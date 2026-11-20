const { connect, go, act, shot, assertPortal } = require('./ui');

const HEADER_GCE = 'https://app-na2.hubspot.com/global-content/51597413/editor/432622415565/content';
const mode = process.argv[2];
if (!['mega', 'simple'].includes(mode)) { console.log('usage: node setup/header-mode.js mega|simple'); process.exit(1); }
const label = mode === 'mega' ? 'Mega menu' : 'Simple dropdown';

const run = async () => {
  const { context } = await connect();
  const p = context.pages()[0];
  p.on('dialog', (d) => d.accept());
  await go(p, HEADER_GCE);
  await p.waitForTimeout(9000);
  assertPortal(p);
  if (!/\| header \|/.test(await p.evaluate(() => document.body.innerText.replace(/\n+/g, ' | ')))) throw new Error('not the header module editor');
  if (!/Mega menu/.test(await p.evaluate(() => document.body.innerText))) {
    await act(p, () => p.mouse.click(26, 148));
    await p.waitForTimeout(2000);
    const items = p.getByText('header', { exact: true });
    for (let i = 0; i < await items.count(); i++) {
      const b = await items.nth(i).boundingBox();
      if (b && b.x < 430 && b.y > 120) { await act(p, () => items.nth(i).click()); break; }
    }
    await p.waitForTimeout(2500);
  }
  const radio = p.getByText(label, { exact: true }).first();
  await radio.scrollIntoViewIfNeeded();
  await act(p, () => radio.click());
  await p.waitForTimeout(2500);
  console.log(await shot(p, `10-header-${mode}-set`));
  await act(p, () => p.getByRole('button', { name: /Publish to/ }).click());
  await p.waitForTimeout(2500);
  const dialog = await p.evaluate(() => [...document.querySelectorAll('[role=dialog]')].filter((x) => x.offsetParent).map((x) => x.innerText.replace(/\n+/g, ' | ')).join(' || '));
  console.log('dialog:', dialog);
  await act(p, () => p.locator('[role=dialog]').getByRole('button', { name: 'Publish', exact: true }).click());
  await p.waitForTimeout(7000);
  console.log(await shot(p, `10-header-${mode}-published`));
  process.exit(0);
};

run().catch((e) => { console.log('ERR', e.message); process.exit(1); });
