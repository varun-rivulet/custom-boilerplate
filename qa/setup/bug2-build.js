const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../../theme/modules/footer.module');
const OUT = path.resolve(__dirname, '../.cache/bug2');
const GROUPS = ['contact', 'social', 'bottom'];

const groupDefault = (group) => Object.fromEntries(group.children.map((c) => [c.name, JSON.parse(JSON.stringify(c.default))]));

const withGroupDefaults = (fields) => {
  const copy = JSON.parse(JSON.stringify(fields));
  for (const name of GROUPS) {
    const g = copy.find((x) => x.name === name);
    g.default = groupDefault(g);
  }
  return copy;
};

const build = (variant, fields) => {
  const dir = path.join(OUT, `footer-${variant}.module`);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(SRC, 'module.html'), path.join(dir, 'module.html'));
  fs.writeFileSync(path.join(dir, 'module.css'), '');
  fs.writeFileSync(path.join(dir, 'fields.json'), `${JSON.stringify(fields, null, 2)}\n`);
  const meta = JSON.parse(fs.readFileSync(path.join(SRC, 'meta.json'), 'utf8'));
  fs.writeFileSync(path.join(dir, 'meta.json'), `${JSON.stringify({ ...meta, label: `QA footer test (${variant})`, global: false, host_template_types: ['PAGE'], is_available_for_new_content: false }, null, 2)}\n`);
  return dir;
};

if (require.main === module) {
  const fields = JSON.parse(fs.readFileSync(path.join(SRC, 'fields.json'), 'utf8'));
  fs.rmSync(OUT, { recursive: true, force: true });
  console.log(build('current', fields));
  console.log(build('fixed', withGroupDefaults(fields)));
}

module.exports = { withGroupDefaults, GROUPS };
