const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { REPO_ROOT } = require('./config');

const README_CHECKS = [
  ['0', 'Old theme folder deleted'],
  ['2', 'Font fields'],
  ['3', 'Viewport meta'],
  ['4', 'Forms'],
  ['5', 'Link field'],
  ['6', 'scope_css per instance'],
  ['7', 'Overlay color'],
  ['8', 'Secondary font on all template types'],
  ['9', 'Spacing field value shape'],
  ['10', 'Light text on dark backgrounds'],
  ['11', 'Image type with no image'],
  ['12', 'H1 and image radius'],
  ['13', 'Background color picker inheritance'],
  ['14', 'Auto text color from hex'],
  ['15', 'HubSpot CTA add-on'],
  ['16', 'Image position'],
  ['17', 'Header module'],
  ['17b', 'Header – Simple'],
  ['18', 'Footer module'],
  ['19', 'Theme settings inheritance'],
  ['20', 'Button styles'],
];

const MANUAL = {};

const DONE_MANUALLY = { 0: 'Old theme folder deleted by hand (2026-11-23).' };

const CLIENT_PORTAL = {
  8: 'The 404 template needs a Starter+ portal (system page templates). Verify on the first client portal; does not block the merge.',
  15: 'The HubSpot CTA add-on needs CTA access (Content Hub Pro/Enterprise). Verify on the first client portal; does not block the merge.',
};

const EDITOR_CHECKS = {
  2: 'font picker shows the Adobe secondary font',
  13: 'color pickers show the inherited palette color',
  17: 'Simple/Mega switching, sticky toggle',
  '17b': 'Header – Simple editor fields',
  19: 'palette change reaches the served main.css',
};

const EDITOR_STATE = path.join(__dirname, '.state', 'editor-checks.json');

const editorFingerprint = () => {
  const theme = path.join(REPO_ROOT, 'theme');
  const files = [path.join(theme, 'fields.json'), path.join(theme, 'templates', 'layouts', 'base.html')];
  const walk = (dir, filter) => { if (!fs.existsSync(dir)) return; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) walk(f, filter); else if (filter(f)) files.push(f); } };
  const norm = (f) => f.split(path.sep).join('/');
  walk(path.join(theme, 'modules'), (f) => /fields\.json$/.test(norm(f)) || /\/(header|header-simple|footer)\.module\//.test(norm(f)));
  walk(path.join(theme, 'templates', 'partials'), () => true);
  const hash = crypto.createHash('sha1');
  for (const f of files.sort()) { hash.update(norm(path.relative(theme, f))); hash.update(fs.readFileSync(f).toString().split('\r\n').join('\n')); }
  return hash.digest('hex');
};

const markEditorDone = () => {
  fs.mkdirSync(path.dirname(EDITOR_STATE), { recursive: true });
  fs.writeFileSync(EDITOR_STATE, JSON.stringify({ hash: editorFingerprint(), date: new Date().toISOString().slice(0, 10) }, null, 2));
};

const editorState = () => {
  let saved = null;
  try { saved = JSON.parse(fs.readFileSync(EDITOR_STATE, 'utf8')); } catch {}
  return { saved, due: !saved || saved.hash !== editorFingerprint() };
};

const statusOf = (rows) => {
  if (!rows.length) return null;
  if (rows.some((r) => r.status === 'FAIL')) return 'FAIL';
  if (rows.some((r) => r.status === 'BLOCKED')) return 'PARTIAL';
  if (rows.some((r) => r.status === 'MANUAL')) return rows.some((r) => r.status === 'PASS') ? 'PASS (auto part)' : 'MANUAL';
  return 'PASS';
};

const summarize = (results) => README_CHECKS.map(([id, title]) => {
  const ed = editorState();
  const rows = results.filter((r) => r.check === id && r.status !== 'INFO');
  let status = statusOf(rows) || (MANUAL[id] ? 'MANUAL' : 'NOT RUN');
  if (status === 'PASS' && MANUAL[id]) status = 'PASS (auto part)';
  const failed = rows.filter((r) => ['FAIL', 'BLOCKED', 'MANUAL'].includes(r.status)).map((r) => `${r.status}: ${r.title}${r.status === 'MANUAL' && r.detail ? ` (${r.detail.replace(/^.*?MANUAL – /, '')})` : ''}`);
  let note = [failed.join('; '), MANUAL[id] || ''].filter(Boolean).join(' / ');
  if (DONE_MANUALLY[id]) { status = 'PASS'; note = DONE_MANUALLY[id]; }
  if (EDITOR_CHECKS[id] && !['FAIL', 'PARTIAL'].includes(status)) {
    if (ed.due) { status = 'EDITOR CHECK DUE'; note = `Files changed since the last editor run (${EDITOR_CHECKS[id]}). Re-run once with changed content, then: node run.js --mark-editor-done`; }
    else { status = 'PASS'; note = [note, `Editor part verified ${ed.saved.date} (${EDITOR_CHECKS[id]})`].filter(Boolean).join(' / '); }
  }
  if (CLIENT_PORTAL[id] && status !== 'FAIL') { status = 'VERIFY ON FIRST CLIENT PORTAL'; note = CLIENT_PORTAL[id]; }
  return { id, title, status, note };
});

const esc = (s) => String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

const writeReport = ({ results, seeded, meta, outDir }) => {
  const summary = summarize(results);
  const extra = results.filter((r) => !README_CHECKS.some(([id]) => id === r.check));
  const lines = [
    `# QA report ${meta.stamp}`,
    '',
    `Branch \`${meta.branch}\`, commit \`${meta.commit}\`${meta.dirty ? ' (uncommitted theme changes)' : ''}, build \`${meta.build}\`, portal 51597413.`,
    '',
    '## README sandbox checklist',
    '',
    '| Check | Status | Notes |',
    '|---|---|---|',
    ...summary.map((s) => `| ${s.id}. ${s.title} | ${s.status} | ${esc(s.note)} |`),
    '',
    '## All results',
    '',
    '| Check | Status | Test | Detail |',
    '|---|---|---|---|',
    ...results.map((r) => `| ${r.check} | ${r.status} | ${esc(r.title)} | ${esc(r.detail).slice(0, 400)} |`),
    '',
    '## Seeded content',
    '',
    ...seeded.pages.map((p) => `- ${p.name}: ${p.url || p.slug} (${p.state || 'unknown state'})`),
    ...seeded.posts.map((p) => `- ${p.name}: ${p.url || '-'} (${p.state || 'unknown state'})`),
    ...(seeded.blocked.length ? ['', '## Blocked while seeding', '', ...seeded.blocked.map((b) => `- ${b.what}: ${esc(b.reason)}`)] : []),
    '',
    `Screenshots: \`${path.join(outDir, 'screenshots')}\``,
    '',
    `Other checks in this run: ${extra.length} (console, requests, build freshness, type sizes, lists, image resize, scroll, width).`,
  ];
  const file = path.join(outDir, 'report.md');
  fs.writeFileSync(file, lines.join('\n'));
  return file;
};

const START = '<!-- qa-status:start -->';
const END = '<!-- qa-status:end -->';

const updateReadme = ({ results, meta }) => {
  const file = path.join(REPO_ROOT, 'README.md');
  let text = fs.readFileSync(file, 'utf8');
  const summary = summarize(results);
  const block = [
    START,
    `**Last automated run:** ${meta.date}, branch \`${meta.branch}\`, commit \`${meta.commit}\`${meta.dirty ? ' (uncommitted theme changes)' : ''} (\`npm run qa\` in \`qa/\`).`,
    '',
    '| Check | Status | Notes |',
    '|---|---|---|',
    ...summary.map((s) => `| ${s.id}. ${s.title} | ${s.status} | ${esc(s.note)} |`),
    END,
  ].join('\n');
  if (text.includes(START) && text.includes(END)) {
    text = text.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block);
  } else {
    const anchor = text.indexOf('## Sandbox test checklist');
    if (anchor < 0) throw new Error('README has no "## Sandbox test checklist" heading.');
    const lineEnd = text.indexOf('\n', anchor);
    text = `${text.slice(0, lineEnd + 1)}\n${block}\n${text.slice(lineEnd + 1)}`;
  }
  fs.writeFileSync(file, text);
};

module.exports = {
  markEditorDone, writeReport, updateReadme, summarize };
