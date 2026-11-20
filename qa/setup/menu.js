const { connect, act, shot } = require('./ui');
const { SITE_URL } = require('../config');

const ex = (p) => `https://example.com/${p}`;
const TOP = [
  { label: 'Products', url: ex('products') },
  { label: 'Resources', url: null },
  { label: 'Docs', url: ex('docs'), newTab: true },
  { label: 'QA – Auto Base Module', url: `${SITE_URL}/qa-auto-base-module` },
];
const CHILDREN = {
  Products: [{ label: 'Product A', url: ex('product-a') }, { label: 'Product B', url: ex('product-b') }, { label: 'Product C', url: ex('product-c') }],
  Resources: [{ label: 'Guides', url: ex('guides') }, { label: 'Case studies', url: ex('case-studies') }, { label: 'Webinars', url: ex('webinars') }],
  'Product A': [{ label: 'Product A1', url: ex('a1') }, { label: 'Product A2', url: ex('a2') }],
  'Product B': [{ label: 'Product B1', url: ex('b1') }, { label: 'Product B2', url: ex('b2') }, { label: 'Product B3', url: ex('b3') }],
  'Product C': [{ label: 'Product C1', url: ex('c1') }, { label: 'Product C2', url: ex('c2') }],
};
const LABEL = 'input[placeholder="Menu item label"]';

const run = async () => {
  const { page } = await connect();
  page.on('dialog', (d) => d.accept());
  if (process.argv.includes('--reload')) { const { go } = require('./ui'); await go(page, 'https://app-na2.hubspot.com/menus/51597413/edit/432623624931'); await page.waitForTimeout(3000); }
  const log = (m) => console.log(`[menu] ${m}`);
  const wait = (ms = 600) => page.waitForTimeout(ms);

  const tagRow = async (label) => {
    const ok = await page.evaluate(({ label, sel }) => {
      document.querySelectorAll('[data-qa-row]').forEach((e) => e.removeAttribute('data-qa-row'));
      const input = [...document.querySelectorAll(sel)].find((i) => i.value === label);
      if (!input) return false;
      let el = input.parentElement;
      while (el && el.getBoundingClientRect().width < 1100) el = el.parentElement;
      if (!el) return false;
      el.setAttribute('data-qa-row', label);
      return true;
    }, { label, sel: LABEL });
    if (!ok) throw new Error(`row "${label}" not found`);
    return page.locator(`[data-qa-row="${label}"]`);
  };

  const fillEmptyLabel = async (label) => {
    const idx = await page.evaluate((sel) => [...document.querySelectorAll(sel)].findIndex((i) => !i.value), LABEL);
    if (idx < 0) throw new Error('no empty menu row to fill');
    await act(page, () => page.locator(LABEL).nth(idx).fill(label));
    await wait(300);
  };

  const action = async (label, item) => {
    const row = await tagRow(label);
    await act(page, () => row.hover());
    await wait(300);
    await act(page, () => row.getByText('Actions', { exact: true }).first().click());
    await wait(500);
    await act(page, () => page.getByText(item, { exact: true }).last().click());
    await wait(700);
  };

  const setLink = async (node) => {
    if (node.url === null) { await action(node.label, 'Item without link'); return; }
    await action(node.label, 'URL Link');
    const row = await tagRow(node.label);
    const inputs = await row.locator('input').all();
    let filled = false;
    for (const inp of inputs) {
      const ph = (await inp.getAttribute('placeholder')) || '';
      const val = await inp.inputValue();
      if (val === node.label || ph === 'Menu item label') continue;
      await act(page, () => inp.fill(node.url));
      filled = true;
      break;
    }
    if (!filled) throw new Error(`no URL input for "${node.label}"`);
    await wait(300);
    if (node.newTab) {
      const r = await tagRow(node.label);
      await act(page, () => r.hover());
      await wait(300);
      await act(page, () => r.getByText('Actions', { exact: true }).first().click());
      await wait(500);
      await act(page, () => page.getByText('Open link in new window', { exact: true }).last().click());
      await wait(300);
      await page.keyboard.press('Escape');
      await wait(300);
    }
  };

  const existing = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((i) => i.value), LABEL);
  const filled = existing.filter(Boolean);
  if (filled.some((l) => l !== 'Products') || filled.length > 1) throw new Error(`QA – Menu already has items (${existing.join(', ')}); stopping to avoid duplicates.`);

  await page.keyboard.press('Escape');
  await wait(300);
  const chooseType = async (node) => {
    const urlOpt = page.getByText('Add URL Link', { exact: true });
    if (await urlOpt.count() && await urlOpt.last().isVisible()) {
      await act(page, () => page.getByText(node.url === null ? 'Add item without link' : 'Add URL Link', { exact: true }).last().click());
      await wait(700);
      return true;
    }
    return false;
  };
  const fillRow = async (node, typed) => {
    await fillEmptyLabel(node.label);
    if (!typed) { await setLink(node); return; }
    if (node.url !== null) {
      const row = await tagRow(node.label);
      const inputs = await row.locator('input').all();
      let done = false;
      for (const inp of inputs) {
        if (((await inp.getAttribute('placeholder')) || '') === 'Menu item label') continue;
        await act(page, () => inp.fill(node.url));
        done = true;
        break;
      }
      if (!done) throw new Error('no URL input for "' + node.label + '"');
      await wait(300);
    }
    if (node.newTab) {
      const r = await tagRow(node.label);
      await act(page, () => r.hover());
      await wait(300);
      await act(page, () => r.getByText('Actions', { exact: true }).first().click());
      await wait(500);
      await act(page, () => page.getByText('Open link in new window', { exact: true }).last().click());
      await wait(300);
      await page.keyboard.press('Escape');
      await wait(300);
    }
  };
  for (const node of TOP) {
    const has = await page.evaluate(({ sel, label }) => [...document.querySelectorAll(sel)].some((x) => x.value === label), { sel: LABEL, label: node.label });
    if (has) { log('top exists: ' + node.label); continue; }
    await act(page, () => page.getByText('Add menu item', { exact: true }).last().click());
    await wait(700);
    const typed = await chooseType(node);
    await fillRow(node, typed);
    log('top: ' + node.label);
  }
  const addChildren = async (parent) => {
    const kids = CHILDREN[parent] || [];
    for (const node of [...kids].reverse()) {
      await action(parent, 'Add child item below');
      const typed = await chooseType(node);
      await fillRow(node, typed);
      log('child of ' + parent + ': ' + node.label);
    }
    for (const node of kids) await addChildren(node.label);
  };
  await addChildren('Products');
  await addChildren('Resources');
  await shot(page, '02-menus-filled');

  await act(page, () => page.getByRole('button', { name: 'Save', exact: true }).click());
  await wait(3000);
  const after = await page.evaluate((sel) => [...document.querySelectorAll(sel)].map((i) => i.value), LABEL);
  log(`saved; rows: ${after.join(', ')}`);
  console.log(await shot(page, '02-menus-saved'));
  process.exit(0);
};

run().catch(async (e) => { console.log('ERR', e.message); try { const { page } = await connect(); console.log(await shot(page, '02-menus-error')); } catch {} process.exit(1); });
