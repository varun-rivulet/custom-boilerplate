const fs = require('fs');
const path = require('path');
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

const MANUAL = {
  0: 'Design Manager folder outside the QA scope; delete by hand.',
  2: 'Editor part (font picker shows Adobe font) needs the editor.',
  13: 'Editor part (picker shows Dark, follows Global colors) needs the editor.',
  15: 'Portal has no CTA access.',
  17: 'Theme settings colour changes and Simple/Mega switching need the editor.',
  19: 'Changing Primary in Theme settings needs the editor; served values are tested.',
};

const statusOf = (rows) => {
  if (!rows.length) return null;
  if (rows.some((r) => r.status === 'FAIL')) return 'FAIL';
  if (rows.some((r) => r.status === 'BLOCKED')) return 'PARTIAL';
  return 'PASS';
};

const summarize = (results) => README_CHECKS.map(([id, title]) => {
  const rows = results.filter((r) => r.check === id && r.status !== 'INFO');
  let status = statusOf(rows) || (MANUAL[id] ? 'MANUAL' : 'NOT RUN');
  if (status === 'PASS' && MANUAL[id]) status = 'PASS (auto part)';
  const failed = rows.filter((r) => r.status === 'FAIL' || r.status === 'BLOCKED').map((r) => `${r.status}: ${r.title}`);
  const note = [failed.join('; '), MANUAL[id] || ''].filter(Boolean).join(' / ');
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

module.exports = { writeReport, updateReadme, summarize };
