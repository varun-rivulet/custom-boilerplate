const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { PORTAL_ID, THEME_FOLDER, REPO_ROOT, REPORTS_DIR } = require('./config');
const { loadToken } = require('./lib/env');
const { createClient } = require('./lib/hubspot');
const { createWriter, hasPortalState } = require('./lib/writer');
const { seed, republish } = require('./seed');
const { runTests } = require('./tests');
const { writeReport, updateReadme } = require('./report');

const args = new Set(process.argv.slice(2));
const log = (msg) => console.log(`[qa] ${msg}`);
const git = (...a) => spawnSync('git', a, { cwd: REPO_ROOT, encoding: 'utf8' }).stdout.trim();

const writePlan = (writer, outDir) => {
  const file = path.join(outDir, 'write-plan.md');
  const lines = ['# Write plan (dry run)', '', `Portal ${PORTAL_ID}. Nothing was written.`, '', '| Operation | Target | Detail |', '|---|---|---|', ...writer.plan.map((p) => `| ${p.op} | ${p.key} | ${p.detail || ''} |`)];
  fs.writeFileSync(file, lines.join('\n'));
  return file;
};

const main = async () => {
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  const commit = git('rev-parse', '--short', 'HEAD');
  const dirty = git('status', '--porcelain', '--', 'theme').length > 0;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const build = `${commit}${dirty ? '-dirty' : ''}-${stamp}`;
  const outDir = path.join(REPORTS_DIR, stamp);
  fs.mkdirSync(outDir, { recursive: true });
  log(`branch ${branch}, commit ${commit}${dirty ? ' (theme has uncommitted changes)' : ''}, build ${build}`);

  const hs = createClient(loadToken());
  await hs.assertPortal();
  log(`portal guard ok (${PORTAL_ID})`);

  const firstRun = !hasPortalState();
  const dryRun = args.has('--dry-run') || (firstRun && !args.has('--confirm-first-run'));
  if (dryRun) {
    log(firstRun && !args.has('--dry-run') ? `first real run in portal ${PORTAL_ID}: running a dry run first` : 'dry run');
    const writer = createWriter(hs, { dryRun: true, log });
    const seeded = await seed(hs, writer, { build, log });
    await republish(hs, writer, seeded, { log });
    const planFile = writePlan(writer, outDir);
    log(`write plan: ${planFile}`);
    if (firstRun && !args.has('--dry-run')) log('review the plan, then run "npm run qa -- --confirm-first-run"');
    return;
  }

  if (!args.has('--skip-upload')) {
    log('uploading theme');
    const up = spawnSync('hs', ['cms', 'upload', `"${path.join(REPO_ROOT, 'theme')}"`, THEME_FOLDER, `--account=${PORTAL_ID}`], { cwd: REPO_ROOT, encoding: 'utf8', shell: true, env: { ...process.env, INIT_CWD: REPO_ROOT } });
    const out = `${up.stdout || ''}${up.stderr || ''}`;
    fs.writeFileSync(path.join(outDir, 'upload.log'), out);
    if (up.status !== 0 || !/SUCCESS/.test(out)) throw new Error(`Theme upload failed (see ${path.join(outDir, 'upload.log')}).`);
    log('upload ok');
  }

  const writer = createWriter(hs, { dryRun: false, log });
  const seeded = await seed(hs, writer, { build, log });
  writer.confirmPortal();
  await republish(hs, writer, seeded, { log });
  fs.writeFileSync(path.join(outDir, 'seeded.json'), JSON.stringify(seeded, null, 2));
  writePlan(writer, outDir);

  const results = await runTests({ seeded, build, outDir, log });
  const meta = { branch, commit, dirty, build, date: new Date().toISOString().slice(0, 10), stamp };
  const reportPath = writeReport({ results, seeded, meta, outDir });
  if (!args.has('--no-readme')) updateReadme({ results, meta });
  const counts = results.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {});
  log(`done: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  log(`report: ${reportPath}`);
};

main().catch((err) => {
  console.error(`[qa] ERROR: ${err.message}`);
  process.exit(1);
});
