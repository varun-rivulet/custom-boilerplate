const FIELD_KEYS = ['eyebrow', 'heading', 'description', 'image', 'buttons', 'advanced', 'style'];

const clone = (v) => JSON.parse(JSON.stringify(v));

const findWidget = (node, test, trail = []) => {
  if (!node || typeof node !== 'object') return null;
  if (node.params && test(node)) return { widget: node, trail };
  for (const [k, v] of Object.entries(node)) {
    const hit = findWidget(v, test, trail.concat(k));
    if (hit) return hit;
  }
  return null;
};

const isBaseModule = (w) => /base-module/.test(String(w.params.path || '')) || /base-module/i.test(String(w.params.label || ''));

const extractSample = (page) => {
  const sections = page.layoutSections || {};
  const areaName = Object.keys(sections).find((k) => findWidget(sections[k], isBaseModule));
  if (!areaName) throw new Error('Could not find a Base Module instance in the reference page layout (layoutSections).');
  const area = sections[areaName];
  const rowIndex = (area.rows || []).findIndex((row) => findWidget(row, isBaseModule));
  if (rowIndex < 0) throw new Error('Base Module instance is not inside a top-level row of the reference layout.');
  const row = area.rows[rowIndex];
  const meta = (area.rowMetaData || [])[rowIndex] || null;
  const { widget } = findWidget(row, isBaseModule);
  const baseParams = clone(widget.params);
  FIELD_KEYS.forEach((k) => delete baseParams[k]);
  return { areaName, area: clone(area), row: clone(row), meta: clone(meta), baseParams };
};

const renameAll = (node, suffix) => {
  if (Array.isArray(node)) { node.forEach((n) => renameAll(n, suffix)); return; }
  if (!node || typeof node !== 'object') return;
  if (typeof node.name === 'string') node.name = `${node.name}-${suffix}`;
  Object.values(node).forEach((v) => renameAll(v, suffix));
};

const buildLayout = (sample, widgets) => {
  const area = clone(sample.area);
  area.rows = [];
  area.rowMetaData = [];
  widgets.forEach((w, i) => {
    const row = clone(sample.row);
    renameAll(row, `qa${i}`);
    const { widget } = findWidget(row, isBaseModule);
    widget.params = w.kind === 'base' ? { ...clone(sample.baseParams), ...clone(w.params) } : clone(w.params);
    if (w.kind !== 'base' && w.label) widget.label = w.label;
    area.rows.push(row);
    if (sample.meta) area.rowMetaData.push(clone(sample.meta));
  });
  return { [sample.areaName]: area };
};

module.exports = { extractSample, buildLayout };
