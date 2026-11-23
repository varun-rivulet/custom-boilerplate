const fs = require('fs');
const path = require('path');
const { REPO_ROOT } = require('./config');

const flatten = (fields, trail, out) => {
  for (const f of fields || []) {
    const here = [...trail, f.name];
    if (f.children) { out.push({ ...f, path: here.join('.'), group: true }); flatten(f.children, here, out); } else out.push({ ...f, path: here.join('.') });
  }
  return out;
};
const sources = () => {
  const mods = path.join(REPO_ROOT, 'theme', 'modules');
  return [['theme', path.join(REPO_ROOT, 'theme', 'fields.json')], ...fs.readdirSync(mods).filter((m) => fs.existsSync(path.join(mods, m, 'fields.json'))).map((m) => [m.replace('.module', ''), path.join(mods, m, 'fields.json')])];
};
const build = () => sources().flatMap(([scope, file]) => flatten(JSON.parse(fs.readFileSync(file, 'utf8')), [], []).filter((f) => !f.group).map((f) => ({
  scope, path: f.path, label: f.label || '', type: f.type, hasHelp: Boolean(f.help_text), hasDefault: f.default !== undefined, visibility: Boolean(f.visibility || f.advanced_visibility), inherited: Boolean(f.inherited_value),
})));
module.exports = { build };
if (require.main === module) {
  const rows = build();
  const by = {};
  rows.forEach((r) => { by[r.scope] = (by[r.scope] || 0) + 1; });
  console.log(JSON.stringify(by));
  fs.writeFileSync(path.join(__dirname, 'reports', 'field-matrix.json'), JSON.stringify(rows, null, 1));
  console.log('fields', rows.length, 'no help', rows.filter((r) => !r.hasHelp).length, 'no default', rows.filter((r) => !r.hasDefault).length);
}
