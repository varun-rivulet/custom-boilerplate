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
const GROUPS = ['global_colors', 'spacing', 'text', 'text_on_dark', 'buttons_group', 'forms', 'header', 'footer', 'fonts'];
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
    const step = f.step || 1;
    const d = f.default === undefined ? min : f.default;
    const round = (v) => Math.round(v / step) * step;
    let val = round(d + 3 * step);
    if (val > max) val = round(d - 3 * step);
    if (val < min) val = round((min + max) / 2);
    if (val === d) val = d + step <= max ? d + step : d - step;
    val = Number(val.toFixed(4));
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

const FONT_TEST = { primary: { font: 'Lora', fallback: 'serif' }, secondary: { font: 'qa-adobe-test', fallback: 'serif' } };
const FONT_WEIGHTS = { h1: '600', h2: '700', h3: '600', h4: '400', h5: '700', h6: '600', body_font: '300', links: '700', eyebrow: '600' };
const buildFonts = () => {
  const real = JSON.parse(fs.readFileSync(BACKUP, 'utf8'));
  const changes = {};
  const gf = real.find((x) => x.name === 'global_fonts');
  for (const f of gf.children) {
    const t = FONT_TEST[f.name];
    f.default = { ...f.default, font: t.font, fallback: t.fallback };
    changes[`global_fonts.${f.name}`] = { kind: 'font', want: { ...t, set: f.default.font_set } };
  }
  const tx = real.find((x) => x.name === 'text');
  for (const g of tx.children) {
    const f = (g.children || []).find((x) => x.type === 'font');
    if (!f) continue;
    const hex = sentinelHex();
    if (f.inherited_value && f.inherited_value.property_value_paths) delete f.inherited_value.property_value_paths.color;
    f.default = { ...f.default, variant: FONT_WEIGHTS[g.name], color: hex };
    changes[`text.${g.name}.font.color`] = { kind: 'color', want: hex, key: g.name };
    changes[`text.${g.name}.font.weight`] = { kind: 'weight', want: FONT_WEIGHTS[g.name], key: g.name };
  }
  fs.writeFileSync(FIELDS, JSON.stringify(real, null, 2).replace(/\n/g, '\r\n') + '\r\n');
  return changes;
};

const buildTemp = (group) => {
  if (group === 'fonts') return buildFonts();
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
      const probe = Object.entries(changes).find(([, c]) => c.kind === 'color') || Object.entries(changes).find(([, c]) => c.kind === 'number');
      const baseCss = require('./.state/baseline-css.json');
      const probeSeen = (cssText, htmlText) => (probe[1].kind === 'color' ? cssText.toLowerCase().includes(probe[1].want.toLowerCase()) : cssText !== baseCss.css);
      let css = ''; let html = '';
      for (let i = 0; i < 24; i++) {
        ({ css, html } = await fetchCss(baseUrl));
        if (!probe || probeSeen(css, html)) break;
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
        if (c.kind === 'weight') return css.includes(`--${c.key === 'body_font' ? 'body' : c.key === 'links' ? 'link' : c.key}-weight:${c.want}`);
        if (c.kind === 'font') { const k = field.endsWith('primary') ? 'primary' : 'secondary'; return css.includes(`--font-${k}:"${c.want.font}", ${c.want.fallback}`); }
        return true;
      };
      for (const [field, c] of Object.entries(changes)) {
        const ok = chk(field, c);
        add(group, field, ok ? 'PASS' : 'NOT APPLIED', ok ? `${c.kind} ${JSON.stringify(c.want).slice(0, 40)} found in served CSS/HTML` : `${c.kind} ${JSON.stringify(c.want).slice(0, 40)} not in served CSS/HTML (saved override in the portal, or not output)`);
      }
      // rendered checks
      const ctx = await browser.newContext();
      if (group === 'fonts') {
        const pg = await ctx.newPage();
        await pg.setViewportSize({ width: 1440, height: 900 });
        await pg.goto(baseUrl, { waitUntil: 'networkidle' });
        const sels = { h1: '#qa-h1-heading h1', h2: '#qa-h1-heading .section-description h2', h3: '#qa-h1-heading .section-description h3', h4: '#qa-h1-heading .section-description h4', h5: '#qa-h1-heading .section-description h5', h6: '#qa-h1-heading .section-description h6', body_font: '#qa-plain .section-description p', eyebrow: '#qa-plain .section-eyebrow p' };
        const got = await pg.evaluate((ss) => Object.fromEntries(Object.entries(ss).map(([k, sel]) => { const el = document.querySelector(sel); if (!el) return [k, null]; const c = getComputedStyle(el); return [k, { fam: c.fontFamily, w: c.fontWeight, col: c.color }]; })), sels);
        for (const [k, g] of Object.entries(got)) {
          const style = k === 'eyebrow' || k === 'body_font' ? FONT_TEST.secondary : FONT_TEST.primary;
          if (!g) { add(group, `text.${k} rendered`, 'FAIL', 'element not found', 1440); continue; }
          add(group, `text.${k}.font.family → rendered family`, g.fam.includes(`"${style.font}"`) || g.fam.includes(style.font) ? 'PASS' : 'FAIL', g.fam, 1440);
          add(group, `text.${k}.font.weight → rendered weight`, String(g.w) === FONT_WEIGHTS[k] ? 'PASS' : 'FAIL', g.w, 1440);
          add(group, `text.${k}.font.color → rendered color`, g.col === hexRgb(changes[`text.${k}.font.color`].want) ? 'PASS' : 'FAIL', g.col, 1440);
        }
        const faces = [...html.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0]);
        const lora = faces.filter((x) => /font-family:\s*"Lora"/.test(x));
        const loraW = [...new Set(lora.map((x) => (x.match(/font-weight:\s*(\d+)/) || [])[1]))].sort();
        const usedW = [...new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((k) => FONT_WEIGHTS[k]))].sort();
        add(group, 'global_fonts.primary → Google font loaded (self-served @font-face, font-display swap)', lora.length && lora.every((x) => /font-display:\s*swap/.test(x) && /_hcms\/googlefonts\/Lora\//.test(x)) ? 'PASS' : 'FAIL', `${lora.length} faces`, 1440);
        add(group, 'global_fonts.primary → only the used weights are loaded', loraW.length && loraW.every((w) => usedW.includes(w)) ? 'PASS' : 'FAIL', `loaded ${loraW.join(',')}; used by headings ${usedW.join(',')}`, 1440);
        add(group, 'global_fonts.secondary → Adobe kit link kept, no @font-face for the Adobe family', html.includes('use.typekit.net/kwi4rat.css') && !faces.some((x) => /qa-adobe-test/.test(x)) ? 'PASS' : 'FAIL', '', 1440);
        await pg.close();
      }
      const S = {}; for (const [f, c] of Object.entries(changes)) S[f] = c;
      const { renderChecks } = require('./theme-live-checks');
      await renderChecks({ group, S, ctx, urls: { base: baseUrl, form: url('Form'), hf: url('Header Footer') }, add, WIDTHS, tierIdx, hexRgb });
      await ctx.close();
      for (const r of rows) {
        if (r.group !== group || r.status !== 'NOT APPLIED' || !r.detail.startsWith('number')) continue;
        const rend = rows.filter((x) => x.group === group && x.field.startsWith(`${r.field} → `));
        if (rend.length && rend.every((x) => x.status === 'PASS')) { r.status = 'PASS'; r.detail = 'verified by the rendered checks (the static count collides with another changed value)'; }
      }
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
