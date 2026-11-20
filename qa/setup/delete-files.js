const { connect, act, shot, assertPortal } = require('./ui');

const NAMES = ['QA – Wide image 4000 x 1500', 'QA – Background image 2400 x 1200', 'QA – Featured image 1600 x 900'];
const confirm = process.argv.includes('--confirm');

const run = async () => {
  const { context } = await connect();
  const p = context.pages()[0];
  assertPortal(p);
  for (const name of NAMES) {
    const row = p.locator('tr').filter({ has: p.getByText(name, { exact: true }) });
    const count = await row.count();
    if (count < 1) throw new Error(`${name}: no row`);
    const first = row.first();
    const label = (await first.innerText()).split('\n').map((s) => s.trim()).find(Boolean);
    if (label !== name) throw new Error(`${name}: row label "${label}" does not match`);
    const box = first.locator('input[type=checkbox]').first();
    if (!(await box.isChecked())) await act(p, () => box.check({ force: true }));
    await p.waitForTimeout(300);
  }
  const checked = await p.evaluate(() => [...document.querySelectorAll('tr')].filter((r) => r.querySelector('input[type=checkbox]:checked')).map((r) => r.innerText.split('\n').map((s) => s.trim()).find(Boolean)));
  console.log('checked rows:', checked.join(' | '));
  if (checked.length !== 3 || !NAMES.every((n) => checked.includes(n))) throw new Error('selection is not exactly the three leftover files; stopping');
  const buttons = await p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.offsetParent && /Delete|Move|Archive/i.test(b.textContent)).map((b) => b.textContent.trim()));
  console.log('bulk buttons:', buttons.join(' | '));
  if (confirm) {
    await act(p, () => p.getByRole('button', { name: /^Delete/ }).first().click());
    await p.waitForTimeout(1500);
    const dialog = await p.evaluate(() => [...document.querySelectorAll('[role=dialog]')].filter((x) => x.offsetParent).map((x) => x.innerText.replace(/\n+/g, ' | ')).join(' || '));
    console.log('dialog:', dialog);
  }
  console.log(await shot(p, confirm ? '09-files-delete-dialog' : '09-files-selected'));
  process.exit(0);
};

run().catch((e) => { console.log('ERR', e.message); process.exit(1); });
