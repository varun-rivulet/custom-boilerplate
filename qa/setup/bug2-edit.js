const { connect, go, act, shot, assertPortal } = require('./ui');

const PAGE = 'https://app-na2.hubspot.com/pages/51597413/editor/432711252706/content';
const variant = process.argv[2];
const index = variant === 'fixed' ? 1 : 0;

const run = async () => {
  const { context } = await connect();
  const p = context.pages()[0];
  p.on('dialog', (d) => d.accept());
  if (!p.url().includes('/editor/432711252706/')) { await go(p, PAGE); await p.waitForTimeout(12000); }
  assertPortal(p);
  await act(p, () => p.getByText('Remind me later', { exact: true }).click({ timeout: 3000 })).catch(() => {});
  const wait = (ms = 1200) => p.waitForTimeout(ms);
  const text = () => p.evaluate(() => document.body.innerText.replace(/\n+/g, ' | '));
  const side = async (label, { optional = false } = {}) => {
    const loc = p.getByText(label, { exact: true });
    for (let i = 0; i < await loc.count(); i++) {
      const b = await loc.nth(i).boundingBox();
      if (b && b.x < 430 && b.y > 120) { await act(p, () => loc.nth(i).click()); await wait(1800); return true; }
    }
    if (optional) return false;
    throw new Error(`sidebar item "${label}" not found`);
  };
  const apply = async () => {
    const ap = p.getByRole('button', { name: 'Apply changes', exact: true });
    if (await ap.count() && await ap.first().isVisible()) { await act(p, () => ap.first().click()); await wait(1800); }
  };
  const fillUrl = async (url) => {
    const id = await p.evaluate(() => { const i = [...document.querySelectorAll('input')].filter((e) => e.offsetParent && e.getBoundingClientRect().left < 430 && /^FormControl/.test(e.id)); return i.length ? i[i.length - 1].id : null; });
    if (!id) throw new Error('no URL input');
    await act(p, () => p.locator(`#${id}`).fill(url));
    await p.keyboard.press('Tab');
    await wait(800);
  };
  const toRoot = async () => {
    const crumb = p.getByText(`QA footer test (${variant})`, { exact: true });
    for (let i = 0; i < await crumb.count(); i++) {
      const b = await crumb.nth(i).boundingBox();
      if (b && b.x < 430 && b.y < 170) { await act(p, () => crumb.nth(i).click()); await wait(1800); return true; }
    }
    return false;
  };
  const openModule = async () => {
    if ((await text()).includes(`Contents | QA footer test (${variant})`) && await toRoot()) return;
    let frame = null;
    for (const f of p.frames()) { try { if (await f.locator('.site-footer').count() >= 3) { frame = f; break; } } catch {} }
    if (!frame) throw new Error('preview frame with the footer copies not found');
    const target = frame.locator('.site-footer .site-footer-copyright').nth(index);
    await target.scrollIntoViewIfNeeded();
    await wait(800);
    const b = await target.boundingBox();
    await act(p, () => p.mouse.click(b.x + 20, b.y + b.height / 2));
    await wait(2500);
    const t = await text();
    if (!t.includes(`QA footer test (${variant})`)) throw new Error(`selected module is not the ${variant} copy`);
  };

  await openModule();
  await side('Social links');
  const socialBefore = (await text()).split('Social links | + Add | ')[1]?.split(' | Apply')[0]?.split(' | Global')[0];
  await side('LinkedIn');
  await fillUrl('https://www.linkedin.com/company/example');
  await apply();
  console.log(`[${variant}] social list before edit: ${socialBefore}`);
  const counter = ((await text()).match(/Previous \| (\d+\/\d+)/) || [])[1];
  console.log(`[${variant}] social counter after edit: ${counter}`);
  if (process.argv.includes('--social-only')) {
    await act(p, () => p.getByRole('button', { name: 'Save', exact: true }).first().click());
    await wait(4000);
    console.log(await shot(p, `12-bug2-${variant}-social`));
    process.exit(0);
  }

  await openModule();
  await side('Bottom bar');
  await side('Privacy policy');
  await fillUrl('https://example.com/privacy-policy');
  await apply();

  await openModule();
  await side('Contact');
  await side('123 Example Street, City');
  await fillUrl('https://maps.example.com/?q=123+Example+Street');
  await apply();

  await act(p, () => p.getByRole('button', { name: 'Save', exact: true }).first().click());
  await wait(4000);
  console.log(await shot(p, `12-bug2-${variant}-edited`));
  process.exit(0);
};

run().catch(async (e) => { console.log('ERR', e.message); try { const { context } = await connect(); console.log(await shot(context.pages()[0], `12-bug2-${variant}-error`)); } catch {} process.exit(1); });
