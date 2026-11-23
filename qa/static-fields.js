const fs = require('fs');
const path = require('path');
const { REPO_ROOT } = require('./config');

const theme = path.join(REPO_ROOT, 'theme');
const walk = (dir, out = []) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const f = path.join(dir, e.name); if (e.isDirectory()) walk(f, out); else if (/\.(css|html|js)$/.test(e.name) && !/swiper|_normalize|_reset/.test(e.name)) out.push(f); } return out; };
const src = walk(theme).map((f) => fs.readFileSync(f, 'utf8')).join('\n');

const leaves = [];
const flat = (a, t) => { for (const f of a) { const p = [...t, f.name]; if (f.children) flat(f.children, p); else leaves.push({ path: p.join('.'), name: f.name, type: f.type, parts: p }); } };
flat(JSON.parse(fs.readFileSync(path.join(theme, 'fields.json'), 'utf8')), []);

const aliases = {};
for (let pass = 0; pass < 3; pass++) {
  for (const m of src.matchAll(/\{%\s*set\s+(\w+)\s*=\s*([\w.]+)\s*%\}/g)) {
    const [, name, rhs] = m;
    if (rhs.startsWith('theme.')) aliases[name] = rhs.slice(6);
    else { const root = rhs.split('.')[0]; if (aliases[root]) aliases[name] = aliases[root] + rhs.slice(root.length); }
  }
}
const esc = (x) => x.split('.').join(String.fromCharCode(92) + '.');
const wb = String.fromCharCode(92) + 'b';
const used = (leaf) => {
  if (src.includes('theme.' + leaf.path)) return 'direct';
  for (const [alias, prefix] of Object.entries(aliases)) {
    if (leaf.path.startsWith(prefix + '.')) {
      const rest = leaf.path.slice(prefix.length + 1);
      if (new RegExp(wb + alias + String.fromCharCode(92) + '.' + esc(rest) + wb).test(src)) return 'alias';
    }
  }
  return null;
};
const dynamic = (leaf) => {
  const last = leaf.parts[leaf.parts.length - 1];
  const prev = leaf.parts[leaf.parts.length - 2];
  const dot = String.fromCharCode(92) + '.';
  const hasLast = new RegExp(dot + last + wb).test(src);
  const hasPrev = prev ? new RegExp(dot + prev + wb).test(src) : true;
  return hasLast && hasPrev ? 'dynamic (loop key/macro)' : null;
};
const rows = leaves.map((l) => ({ ...l, how: used(l) || dynamic(l) }));
const missing = rows.filter((r) => !r.how);
module.exports = { rows, missing };
if (require.main === module) {
  const by = {};
  rows.forEach((r) => { by[r.how || 'UNMAPPED'] = (by[r.how || 'UNMAPPED'] || 0) + 1; });
  console.log('fields', rows.length, JSON.stringify(by));
  missing.forEach((m) => console.log('UNMAPPED', m.path, `[${m.type}]`));
}
