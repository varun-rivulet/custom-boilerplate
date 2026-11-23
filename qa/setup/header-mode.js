const { connect, go, act, shot, assertPortal } = require('./ui');

const GCE = {
  header: 'https://app-na2.hubspot.com/global-content/51597413/editor/429302027972/content',
};
const args = process.argv.slice(2);
const mode = args.find((a) => ['mega', 'simple'].includes(a));
const sticky = args.find((a) => ['sticky-on', 'sticky-off'].includes(a));
if (!mode && !sticky) { console.log('usage: node setup/header-mode.js [mega|simple] [sticky-on|sticky-off]'); process.exit(1); }

const run = async () => {
  const { context } = await connect();
  const p = context.pages()[0];
  await p.setViewportSize({ width: 1440, height: 1000 });
  p.on('dialog', (d) => d.accept());
  await go(p, GCE.header);
  await p.waitForTimeout(9000);
  assertPortal(p);
  if (!(await p.getByText('Static modules', { exact: true }).count())) { await act(p, () => p.mouse.click(26, 148)); await p.waitForTimeout(2000); }
  await act(p, () => p.getByText('Header', { exact: true }).first().click());
  await p.waitForTimeout(2500);
  if (mode) {
    const radio = p.getByText(mode === 'mega' ? 'Mega menu' : 'Simple dropdown', { exact: true }).first();
    await radio.scrollIntoViewIfNeeded();
    await act(p, () => radio.click());
    await p.waitForTimeout(2500);
    console.log(await shot(p, `40-header-${mode}-set`));
  }
  if (sticky) {
    await act(p, () => p.getByText('Styles', { exact: true }).first().click());
    await p.waitForTimeout(1500);
    const want = sticky === 'sticky-on';
    const box = await p.getByText('Sticky header', { exact: true }).boundingBox();
    const tx = box.x + box.width + 70, ty = box.y + box.height / 2;
    const isOn = async () => (await p.screenshot({ clip: { x: tx - 20, y: ty - 5, width: 40, height: 10 } })).length > 0 && p.evaluate(({ x, y }) => { const el = document.elementFromPoint(x, y); const cb = el && (el.closest('label,div') || el).querySelector('input[type=checkbox]'); return cb ? cb.checked : null; }, { x: tx, y: ty });
    const cur = await isOn();
    console.log('sticky currently', cur);
    if (cur !== want) { await act(p, () => p.mouse.click(tx, ty)); await p.waitForTimeout(1500); console.log('sticky now', await isOn()); }
    console.log(await shot(p, `41-header-${sticky}`));
  }
  await act(p, () => p.getByRole('button', { name: /Publish to/ }).click());
  await p.waitForTimeout(2500);
  console.log('dialog:', await p.evaluate(() => [...document.querySelectorAll('[role=dialog]')].filter((x) => x.offsetParent).map((x) => x.innerText).join(' || ')));
  await act(p, () => p.locator('[role=dialog]').getByRole('button', { name: /^Publish/ }).first().click());
  await p.waitForTimeout(8000);
  console.log(await shot(p, '42-header-published'));
  process.exit(0);
};
run().catch((e) => { console.log('ERR', e.message); process.exit(1); });
