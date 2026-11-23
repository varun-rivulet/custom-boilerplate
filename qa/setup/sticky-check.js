const { chromium } = require('playwright');
const { SITE_URL } = require('../config');
(async () => {
  const exe = require('fs').readdirSync(process.env.LOCALAPPDATA + '/ms-playwright').filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
  const browser = await chromium.launch({ executablePath: `${process.env.LOCALAPPDATA}/ms-playwright/${exe}/chrome-win64/chrome.exe` });
  for (const [w, h] of [[1440, 900], [390, 330]]) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.goto(`${SITE_URL}/qa-auto-base-module?c=${Date.now()}`, { waitUntil: 'networkidle' });
    const sticky = await p.evaluate(() => document.querySelector('.site-header-wrap')?.classList.contains('is-sticky'));
    if (!sticky) { console.log(w, 'not sticky (cache?)'); continue; }
    await p.evaluate(() => window.scrollTo(0, 1500));
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const hd = document.querySelector('.site-header'); const b = hd.getBoundingClientRect(); return { top: Math.round(b.top), h: Math.round(b.height), cssVar: getComputedStyle(document.documentElement).getPropertyValue('--site-header-height'), pad: getComputedStyle(document.documentElement).scrollPaddingTop }; });
    console.log(w, JSON.stringify(r));
    if (w < 992) {
      await p.click('[data-header-toggle]');
      await p.waitForTimeout(500);
      const m = await p.evaluate(() => { const hb = document.querySelector('.site-header').getBoundingClientRect().bottom; const pn = document.querySelector('.site-header-panel'); const b = pn.getBoundingClientRect(); const cs = getComputedStyle(pn); return { bottom: Math.round(b.bottom), vh: innerHeight, overflowY: cs.overflowY, scrollable: pn.scrollHeight > pn.clientHeight, hdrBottom: Math.round(hb), mh: getComputedStyle(pn).maxHeight, ph: pn.offsetHeight, bs: getComputedStyle(pn).boxSizing, sh: pn.scrollHeight, headerTop: Math.round(document.querySelector('.site-header').getBoundingClientRect().top) }; });
      console.log(w, 'menu open', JSON.stringify(m));
      await p.screenshot({ path: `reports/setup/sticky-${w}.png` });
    }
    await p.close();
  }
  await browser.close();
})();
