const { connect, act, shot, assertPortal } = require('./ui');

const part = process.argv[2] || 'columns';

const run = async () => {
  const { context } = await connect();
  const p = context.pages()[0];
  await p.bringToFront();
  assertPortal(p);
  const wait = (ms = 900) => p.waitForTimeout(ms);
  const log = (m) => console.log(`[footer] ${m}`);
  const sidebarText = () => p.evaluate(() => document.body.innerText.replace(/\n+/g, ' | '));
  const sideInputs = () => p.evaluate(() => [...document.querySelectorAll('input')].filter((e) => e.offsetParent && e.getBoundingClientRect().left < 430 && e.type === 'text').map((e) => ({ id: e.id, value: e.value })));
  const clickSide = async (text) => {
    const loc = p.locator('body').getByText(text, { exact: true });
    const n = await loc.count();
    for (let i = 0; i < n; i++) {
      const box = await loc.nth(i).boundingBox();
      if (box && box.x < 430) { await act(p, () => loc.nth(i).click()); await wait(); return; }
    }
    throw new Error(`sidebar item "${text}" not found`);
  };
  const toRoot = async () => {
    for (let i = 0; i < 6; i++) {
      const apply = p.getByRole('button', { name: 'Apply changes', exact: true });
      if (await apply.count() && await apply.first().isVisible()) { await act(p, () => apply.first().click()); await wait(1500); continue; }
      const t = await sidebarText();
      if (/Contents \| footer \| footer \| Content/.test(t)) return;
      if (!/Contents/.test(t)) {
        let fr = null;
        for (const x of p.frames()) { try { if (await x.locator('.site-footer').count()) { fr = x; break; } } catch {} }
        const b = fr && await fr.locator('.site-footer .site-footer-copyright').boundingBox();
        if (!b) throw new Error('footer not found in preview');
        await act(p, () => p.mouse.click(b.x + 20, b.y + b.height / 2));
        await wait(2000);
        continue;
      }
      if (/Page contents/.test(t) || /Contents \| footer \| footer/.test(t)) { await clickSide('footer'); continue; }
      await clickSide('Contents');
    }
    throw new Error('could not return to the footer root panel');
  };
  const fillUrl = async (url) => {
    const inputs = await sideInputs();
    const target = inputs.filter((x) => /^FormControl/.test(x.id)).pop();
    if (!target) throw new Error('no URL input in panel');
    await act(p, () => p.locator(`#${target.id}`).fill(url));
    await p.keyboard.press('Tab');
    await wait(500);
  };
  const counter = async () => { const m = (await sidebarText()).match(/Previous \| (\d+)\/(\d+) \| Next/); return m ? [Number(m[1]), Number(m[2])] : [1, 1]; };
  const listAfterAdd = (t, header) => { const i = t.indexOf(`${header} | + Add | `); if (i < 0) return []; return t.slice(i + header.length + 10).split(' | Global content editor')[0].split(' | ').map((s) => s.trim()).filter(Boolean); };

  if (part === 'columns') {
    await toRoot();
    const root = await sidebarText();
    const cols = listAfterAdd(root, 'Menu columns').slice(0, 3);
    log(`columns: ${cols.join(', ')}`);
    for (const [ci, col] of cols.entries()) {
      await toRoot();
      await clickSide(col);
      const t = await sidebarText();
      const links = listAfterAdd(t, 'Links');
      if (ci === cols.length - 1) {
        const inputs = await sideInputs();
        const heading = inputs.find((x) => x.value === col);
        if (heading) { await act(p, () => p.locator(`#${heading.id}`).fill('')); await p.keyboard.press('Tab'); await wait(); log(`cleared heading of ${col}`); }
      }
      await clickSide(links[0]);
      for (let k = 0; k < links.length; k++) {
        const slug = `${col}-${links[k]}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await fillUrl(`https://example.com/${slug}`);
        log(`${col} / ${links[k]} -> https://example.com/${slug}`);
        const [cur, total] = await counter();
        if (cur < total) { await act(p, () => p.getByText('Next', { exact: true }).first().click()); await wait(); }
      }
    }
  }

  if (part === 'legal') {
    await toRoot();
    await clickSide('Bottom bar');
    const t = await sidebarText();
    const links = listAfterAdd(t, 'Legal links');
    log(`legal: ${links.join(', ')}`);
    await clickSide(links[0]);
    for (let k = 0; k < links.length; k++) {
      await fillUrl(`https://example.com/${links[k].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
      const [cur, total] = await counter();
      if (cur < total) { await act(p, () => p.getByText('Next', { exact: true }).first().click()); await wait(); }
    }
  }

  if (part === 'inspect') {
    await toRoot();
    for (const g of (process.argv[3] || '').split(',').filter(Boolean)) await clickSide(g);
    console.log((await sidebarText()).split('Contents')[1]);
    console.log(JSON.stringify(await sideInputs()));
  }

  console.log(await shot(p, `05-footer-${part}`));
  process.exit(0);
};

run().catch(async (e) => { console.log('ERR', e.message); try { const { context } = await connect(); console.log(await shot(context.pages()[0], '05-footer-error')); } catch {} process.exit(1); });
