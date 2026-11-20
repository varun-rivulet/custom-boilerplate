const fs = require('fs');
const path = require('path');
const { autoName, THEME_FOLDER, CACHE_DIR } = require('../config');
const { loadToken } = require('../lib/env');
const { createClient } = require('../lib/hubspot');
const { createWriter } = require('../lib/writer');
const { buildLayout } = require('../seed/layout');

const NAME = autoName('Footer Test');
const KEY = `site-pages:${NAME}`;

const run = async () => {
  const hs = createClient(loadToken());
  await hs.assertPortal();
  const writer = createWriter(hs, { log: (m) => console.log(`[bug2] ${m}`) });
  const mode = process.argv[2] || 'create';
  if (mode === 'create') {
    const sample = JSON.parse(fs.readFileSync(path.join(CACHE_DIR, 'layout-sample.json'), 'utf8'));
    const widgets = ['current', 'fixed'].map((v) => ({ kind: 'copy', label: `QA footer test (${v})`, params: { path: `/qa-scratch/footer-${v}`, module_id: Number({ current: 432711205596, fixed: 432668666593 }[v]), type: 'module', schema_version: 2 } }));
    const page = await writer.upsertPage('site-pages', {
      name: NAME,
      htmlTitle: NAME,
      slug: 'qa-auto-footer-test',
      templatePath: `${THEME_FOLDER}/templates/page.html`,
      headHtml: '<meta name="robots" content="noindex, nofollow">',
      layoutSections: buildLayout(sample, widgets),
    });
    console.log(`page id ${page.id}`);
  }
  if (mode === 'inspect') {
    const id = writer.idFor(KEY);
    const draft = await hs.request('GET', `/cms/v3/pages/site-pages/${id}/draft`);
    const json = JSON.stringify(draft.layoutSections);
    for (const v of ['current', 'fixed']) {
      const find = (node) => { if (!node || typeof node !== 'object') return null; if (node.params && String(node.params.path || '').includes(`footer-${v}`)) return node.params; for (const x of Object.values(node)) { const r = find(x); if (r) return r; } return null; };
      const p = find(draft.layoutSections) || {};
      const s = (o) => JSON.stringify(o === undefined ? 'unset' : o);
      console.log(`== ${v}`);
      console.log(`  contact: ${s(p.contact && p.contact.items && p.contact.items.map((i) => `${i.type}:${i.text}:${(i.link && i.link.url && i.link.url.href) || ''}`))}`);
      console.log(`  social:  ${s(p.social && p.social.items && p.social.items.map((i) => `${i.platform}:${(i.link && i.link.url && i.link.url.href) || ''}`))}`);
      console.log(`  legal:   ${s(p.bottom && p.bottom.legal_links && p.bottom.legal_links.map((i) => `${i.text}:${(i.link && i.link.url && i.link.url.href) || ''}`))}`);
    }
    if (!json) console.log('no layout');
  }
};

run().catch((e) => { console.log('ERR', e.message); process.exit(1); });
