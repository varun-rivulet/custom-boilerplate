const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { PORTAL_ID, THEME_FOLDER, REPO_ROOT, REPORTS_DIR, SITE_URL } = require('./config');
const { loadToken } = require('./lib/env');
const { createClient } = require('./lib/hubspot');
const { createWriter } = require('./lib/writer');
const { seed, republish } = require('./seed');
const { launch } = require('./lib/browser');

const FIELDS = path.join(REPO_ROOT, 'theme', 'fields.json');
const BACKUP = path.join(__dirname, '.state', 'fields.json.real');
const WIDTHS = [1920, 1440, 1366, 1200, 991, 767, 360];
const GROUPS = ['global_colors', 'spacing', 'text', 'text_on_dark', 'buttons_group', 'forms', 'header', 'footer'];
const log = (m) => console.log(`[theme-live] ${m}`);
const gitOut = (...a) => spawnSync('git', a, { cwd: REPO_ROOT, encoding: 'utf8' });

const upload = () => {
  const up = spawnSync('hs', ['cms', 'upload', `"${path.join(REPO_ROOT, 'theme')}"`, THEME_FOLDER, `--account=${PORTAL_ID}`], { cwd: REPO_ROOT, encoding: 'utf8', shell: true });
  const out = `${up.stdout || ''}${up.stderr || ''}`;
  if (up.status !== 0 || !/SUCCESS/.test(out)) throw new Error(`upload failed: ${out.slice(-300)}`);
};

let counter = 0;
const sentinelHex = () => { counter += 1; const n = (0x1a2b3c + counter * 0x0b1d27) % 0xffffff; return `#${n.toString(16).padStart(6, '0').toUpperCase()}`; };

const hexRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`; };

// Mutates one field definition to a non-default value. Returns { want, kind } or null when skipped.
const mutate = (f, p) => {
  if (f.type === 'color') {
    const hex = sentinelHex();
    delete f.inherited_value;
    f.default = { color: hex, opacity: 100 };
    return { kind: 'color', want: hex };
  }
  if (f.type === 'number') {
    const min = f.min === undefined ? 0 : f.min;
    const max = f.max === undefined ? 9999 : f.max;
    const d = f.default === undefined ? min : f.default;
    const val = d + 3 <= max ? d + 3 : d - 3 >= min ? d - 3 : d;
    f.default = val;
    return { kind: 'number', want: val, was: d };
  }
  if (f.type === 'boolean') { const was = Boolean(f.default); f.default = !was; return { kind: 'boolean', want: !was, was }; }
  if (f.type === 'choice') {
    const opts = (f.choices || []).map((c) => c[0]);
    const was = f.default;
    const next = opts.find((o) => o !== was);
    if (next === undefined) return null;
    f.default = next;
    return { kind: 'choice', want: next, was };
  }
  if (f.type === 'spacing') {
    const was = JSON.parse(JSON.stringify(f.default.padding));
    const pad = {};
    for (const s of ['top', 'right', 'bottom', 'left']) { const v = was[s] ? was[s].value : 0; pad[s] = { value: v + 3, units: 'px' }; }
    f.default = { padding: pad };
    return { kind: 'spacing', want: pad, was };
  }
  if (f.type === 'border') {
    const hex = sentinelHex();
    delete f.inherited_value;
    const was = JSON.parse(JSON.stringify(f.default));
    const side = (w0) => ({ width: { value: (w0 || 2) + 1, units: 'px' }, opacity: 100, style: 'solid', color: hex });
    f.default = { top: side(was.top && was.top.width && was.top.width.value), right: side(was.right && was.right.width && was.right.width.value), bottom: side(was.bottom && was.bottom.width && was.bottom.width.value), left: side(was.left && was.left.width && was.left.width.value) };
    return { kind: 'border', want: hex, width: f.default.top.width.value };
  }
  return null;
};

const buildTemp = (group) => {
  const real = JSON.parse(fs.readFileSync(BACKUP, 'utf8'));
  const g = real.find((x) => x.name === group);
  const changes = {};
  const walk = (arr, trail) => { for (const f of arr) { const p = [...trail, f.name]; if (f.children) walk(f.children, p); else { const m = mutate(f, p.join('.')); if (m) changes[p.join('.')] = m; } } };
  walk(g.children, [group]);
  fs.writeFileSync(FIELDS, JSON.stringify(real, null, 2).replace(/\n/g, '\r\n') + '\r\n');
  return changes;
};

const restore = () => { fs.copyFileSync(BACKUP, FIELDS); };

const fetchCss = async (pageUrl) => {
  const html = await (await fetch(`${pageUrl}${pageUrl.includes('?') ? '&' : '?'}tl=${Date.now()}`)).text();
  const m = html.match(/href="([^"]*template_main[^"]*\.css[^"]*)"/);
  if (!m) throw new Error('main.css link not found on the page');
  const href = m[1].startsWith('//') ? `https:${m[1]}` : m[1];
  return { css: await (await fetch(href)).text(), html, href };
};

const tierIdx = (w) => (w >= 1367 ? 0 : w >= 1201 ? 1 : w >= 992 ? 2 : w >= 768 ? 3 : 4); // desktop, large laptop, laptop, tablet, mobile
const cnt = (text, val) => { const re = new RegExp(`(?<![\\d.])${String(val).replace('.', '\\.')}(?![\\d.])`, 'g'); return (text.match(re) || []).length; };

const main = async () => {
  const wanted = process.argv.slice(2).filter((a) => GROUPS.includes(a));
  const groups = wanted.length ? wanted : GROUPS;
  fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
  const clean = gitOut('diff', '--quiet', '--', 'theme/fields.json').status === 0;
  if (!clean && !fs.existsSync(BACKUP)) throw new Error('theme/fields.json has uncommitted changes; commit or stash them first.');
  if (clean) fs.copyFileSync(FIELDS, BACKUP);
  const rows = [];
  const add = (group, field, status, detail = '', w = '') => { rows.push({ group, field, status, detail, w }); if (status === 'FAIL') log(`FAIL ${field} ${w} ${detail}`); };
  let failed = null;
  const hs = createClient(loadToken());
  await hs.assertPortal();
  const browser = await launch();
  try {
    for (const group of groups) {
      log(`group ${group}: build temporary fields.json`);
      const changes = buildTemp(group);
      log(`${Object.keys(changes).length} fields changed; uploading`);
      upload();
      const writer = createWriter(hs, { dryRun: false, log: () => {} });
      const build = `themelive-${group}-${Date.now()}`;
      const seeded = await seed(hs, writer, { build, log: () => {} });
      writer.confirmPortal();
      await republish(hs, writer, seeded, { log: () => {} });
      const url = (n) => { const p = seeded.pages.find((x) => x.name.endsWith(n)); return p && (p.url || `${SITE_URL}/${p.slug}`); };
      const baseUrl = url('Base Module');
      // wait for the regenerated stylesheet
      const probe = Object.entries(changes).find(([, c]) => c.kind === 'color');
      let css = ''; let html = '';
      for (let i = 0; i < 24; i++) {
        ({ css, html } = await fetchCss(baseUrl));
        if (!probe || css.toLowerCase().includes(probe[1].want.toLowerCase())) break;
        await new Promise((r) => setTimeout(r, 10000));
        await republish(hs, writer, seeded, { log: () => {} });
      }
      const haystack = `${css}\n${html}`.toLowerCase();
      const base = require('./.state/baseline-css.json');
      const chk = (field, c) => {
        if (c.kind === 'color' || c.kind === 'border') return haystack.includes(c.want.toLowerCase());
        if (c.kind === 'number') return cnt(css + html, c.want) > cnt(base.css + base.html, c.want);
        if (c.kind === 'spacing') return ['top', 'right', 'bottom', 'left'].every((s) => cnt(css + html, c.want[s].value) >= 1);
        if (c.kind === 'choice') return css.includes(String(c.want)) || html.includes(String(c.want));
        if (c.kind === 'boolean') return css !== base.css || html !== base.html;
        return true;
      };
      for (const [field, c] of Object.entries(changes)) {
        const ok = chk(field, c);
        add(group, field, ok ? 'PASS' : 'NOT APPLIED', ok ? `${c.kind} ${JSON.stringify(c.want).slice(0, 40)} found in served CSS/HTML` : `${c.kind} ${JSON.stringify(c.want).slice(0, 40)} not in served CSS/HTML (saved override in the portal, or not output)`);
      }
      // rendered checks
      const ctx = await browser.newContext();
      const S = {}; for (const [f, c] of Object.entries(changes)) S[f] = c;
      const { renderChecks } = require('./theme-live-checks');
      await renderChecks({ group, S, ctx, urls: { base: baseUrl, form: url('Form'), hf: url('Header Footer') }, add, WIDTHS, tierIdx, hexRgb });
      await ctx.close();
    }
  } catch (err) {
    failed = err;
  } finally {
    restore();
    try { upload(); log('real fields.json restored and uploaded'); } catch (e) { log(`RESTORE UPLOAD FAILED: ${e.message}`); failed = failed || e; }
    await browser.close().catch(() => {});
  }
  const diff = gitOut('diff', '--stat', '--', 'theme/fields.json').stdout.trim();
  log(`fields.json diff vs git after restore: ${diff || 'none'}`);
  const outFile = path.join(REPORTS_DIR, `theme-live-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
  fs.writeFileSync(outFile, JSON.stringify(rows, null, 1));
  const by = {};
  rows.forEach((r) => { const k = `${r.group}:${r.status}`; by[k] = (by[k] || 0) + 1; });
  log(JSON.stringify(by));
  log(`rows: ${outFile}`);
  if (failed) { console.error(`[theme-live] ERROR: ${failed.message}`); process.exit(1); }
};

if (process.argv.includes('--restore')) {
  try { restore(); upload(); console.log('restored real fields.json and uploaded'); } catch (e) { console.error(e.message); process.exit(1); }
} else if (process.argv.includes('--baseline')) {
  (async () => {
    const hs = createClient(loadToken());
    await hs.assertPortal();
    const url = `${SITE_URL}/qa-auto-base-module`;
    const { css, html } = await fetchCss(url);
    fs.writeFileSync(path.join(__dirname, '.state', 'baseline-css.json'), JSON.stringify({ css, html }));
    console.log('baseline stored', css.length, html.length);
  })().catch((e) => { console.error(e.message); process.exit(1); });
} else {
  main().catch((e) => { console.error(`[theme-live] ERROR: ${e.message}`); try { restore(); } catch {} process.exit(1); });
}
