const WIDTHS = [1920, 1440, 1366, 1200, 991, 767, 360];

const collect = () => {
  const H = [...document.querySelectorAll('header.site-header')].slice(1);
  const F = [...document.querySelectorAll('footer.site-footer')].slice(0, -1);
  const box = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.left), r: Math.round(b.right), t: Math.round(b.top), b: Math.round(b.bottom) }; };
  const emptyIn = (root, sel, skip) => [...root.querySelectorAll(sel)].filter((e) => !e.children.length && !(e.textContent || '').trim() && !e.querySelector('svg,img') && !skip.test(e.className)).map((e) => e.className || e.tagName).slice(0, 4);
  const hdr = H.map((h) => {
    const logo = h.querySelector('.site-header-logo');
    const img = logo && logo.querySelector('img');
    const cta = h.querySelector('.site-header-cta a');
    const nav = h.querySelector('.site-header-nav');
    const toggle = h.querySelector('.site-header-toggle');
    const grid = h.querySelector('.site-header-mega-grid');
    const wrapBorder = parseFloat(getComputedStyle(h).borderBottomWidth) > 0;
    return {
      mega: h.hasAttribute('data-mega'), sticky: h.hasAttribute('data-sticky'),
      logoImg: !!img, logoAlt: img ? img.getAttribute('alt') : null,
      cta: cta ? { text: cta.textContent.trim(), cls: cta.className, href: cta.getAttribute('href') } : null,
      items: h.querySelectorAll('.site-header-menu > .site-header-item').length,
      border: wrapBorder,
      toggleShown: !!toggle && getComputedStyle(toggle).display !== 'none',
      navShown: !!nav && getComputedStyle(nav).display !== 'none' && getComputedStyle(nav).visibility !== 'hidden',
      rL: box(logo), rC: box(cta),
      emptyBox: emptyIn(h, 'div,span,p,li,ul', /overlay|chevron|icon|visually|site-header-panel/),
    };
  });
  const ftr = F.map((f) => {
    const cs = getComputedStyle(f);
    return {
      padT: parseFloat(cs.paddingTop), padB: parseFloat(cs.paddingBottom),
      cols: f.querySelectorAll('.site-footer-column').length,
      colHeads: [...f.querySelectorAll('.site-footer-col-title > *')].map((e) => e.tagName),
      links: [...f.querySelectorAll('.site-footer-nav .site-footer-list a')].map((a) => a.textContent.trim()),
      contact: f.querySelectorAll('.site-footer-aside .site-footer-list li').length,
      contactLinks: [...f.querySelectorAll('.site-footer-aside .site-footer-list a')].map((a) => a.getAttribute('href')),
      social: [...f.querySelectorAll('.site-footer-social a')].map((a) => ({ name: (a.textContent || '').trim() || a.getAttribute('aria-label'), href: a.getAttribute('href') })),
      legal: f.querySelectorAll('.site-footer-legal-list a').length,
      copy: (f.querySelector('.site-footer-copyright') || {}).textContent || '',
      logo: !!f.querySelector('.site-footer-logo img'),
      logoAlt: f.querySelector('.site-footer-logo img') ? f.querySelector('.site-footer-logo img').getAttribute('alt') : null,
      desc: !!f.querySelector('.site-footer-description'),
      bad: /\b(null|undefined|None)\b/.test(f.innerText),
      emptyBox: emptyIn(f, 'div,span,p,li,ul,h2,h3,h4', /visually|site-footer-icon/),
      over: [...f.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1).length,
      parts: ['.site-footer-brand', '.site-footer-nav', '.site-footer-aside'].map((q) => box(f.querySelector(q))),
    };
  });
  return { hdr, ftr, nH: H.length, nF: F.length, bad: /\b(null|undefined)\b/.test(H.map((h) => h.innerText).join(' ')), overflow: document.documentElement.scrollWidth - window.innerWidth };
};

const runHeaderFooter = async ({ open, hfUrl, add }) => {
  const ok = (c) => (c ? 'PASS' : 'FAIL');
  for (const w of WIDTHS) {
    const { page, errors } = await open(hfUrl, w);
    const r = await page.evaluate(collect);
    const at = `@${w}px`;
    const mobile = w <= 991;
    const [hMega, hSimple, hNoLogo, hsFull, hsMin] = r.hdr;
    const [f1, f2] = r.ftr;
    const J = JSON.stringify;
    add('hf', `Variants render (5 headers, 2 footers), no null/undefined, no console errors ${at}`, ok(r.nH === 5 && r.nF === 2 && !r.bad && f1 && f2 && !f1.bad && !f2.bad && !errors.length), `${r.nH} headers, ${r.nF} footers; ${errors.join(' | ')}`, hfUrl);
    if (r.nH !== 5 || r.nF !== 2) { await page.close(); continue; }
    add('hf', `Header Mega: menu items, button style, no border, ${mobile ? 'menu in toggle' : 'menu visible'} ${at}`, ok(hMega.mega && hMega.items >= 4 && hMega.cta && /btn-secondary-outline/.test(hMega.cta.cls) && !hMega.border && (mobile ? hMega.toggleShown && !hMega.navShown : !hMega.toggleShown && hMega.navShown)), J(hMega), hfUrl);
    add('hf', `Header Simple dropdown: border, sticky attribute, empty button text renders no button ${at}`, ok(!hSimple.mega && hSimple.sticky && hSimple.border && !hSimple.cta), J(hSimple), hfUrl);
    add('hf', `Header with an empty logo image and a button without URL: placeholder logo (alt Home), no button, no empty elements ${at}`, ok(hNoLogo.logoImg && hNoLogo.logoAlt === 'Home' && !hNoLogo.cta && !hNoLogo.emptyBox.length), J(hNoLogo), hfUrl);
    add('hf', `Header – Simple: logo alt fallback "Home", button, border, no menu ${at}`, ok(hsFull.logoImg && hsFull.logoAlt === 'Home' && hsFull.cta && /btn-dark/.test(hsFull.cta.cls) && hsFull.border && hsFull.items === 0 && !hsFull.toggleShown), J(hsFull), hfUrl);
    add('hf', `Header – Simple with empty logo and button: placeholder logo (alt Home), no button, no empty elements ${at}`, ok(hsMin.logoImg && hsMin.logoAlt === 'Home' && !hsMin.cta && !hsMin.emptyBox.length && hsMin.sticky), J(hsMin), hfUrl);
    const tier = w >= 1201 ? 0 : w >= 992 ? 1 : w >= 768 ? 2 : 3;
    const padT = [60, 80, 60, 30][tier];
    const padB = [20, 80, 60, 10][tier];
    const year = String(new Date().getFullYear());
    add('hf', `Footer full: columns, heading tag, links, contact, 7 social, legal, year, custom spacing ${at}`, ok(f1.cols === 4 && f1.colHeads.filter((t) => t === 'H3').length >= 3 && !f1.links.includes('No URL') && f1.links.length === 5 && f1.contact === 3 && f1.contactLinks.length === 2 && f1.contactLinks.some((h) => h.startsWith('mailto:')) && f1.contactLinks.some((h) => h.startsWith('tel:')) && f1.social.length === 7 && f1.social.every((x) => x.name) && f1.legal === 2 && f1.copy.includes(year) && f1.logo && f1.logoAlt === 'QA footer logo' && f1.desc && f1.padT === padT && f1.padB === padB), J({ ...f1, parts: undefined }), hfUrl);
    add('hf', `Footer minimal: only copyright, no year, no empty elements ${at}`, ok(f2.cols === 0 && f2.contact === 0 && f2.social.length === 0 && f2.legal === 0 && f2.copy.includes('QA minimal') && !/\d{4}/.test(f2.copy) && !f2.logo && !f2.desc && !f2.emptyBox.length), J({ ...f2, parts: undefined }), hfUrl);
    const parts = f1.parts.filter(Boolean);
    const hit = (p, q) => p.l < q.r && q.l < p.r && p.t < q.b && q.t < p.b;
    const overlap = parts.some((p, i) => parts.some((q, j) => j > i && hit(p, q)));
    const logoCta = hMega.rL && hMega.rC && !mobile ? !hit(hMega.rL, hMega.rC) : true;
    add('hf', `No overlap or cut-off: header logo/button, footer parts inside the viewport ${at}`, ok(!overlap && logoCta && f1.over === 0 && f2.over === 0 && r.overflow <= 0), J({ overlap, logoCta, over: [f1.over, f2.over], overflow: r.overflow, parts: f1.parts }), hfUrl);
    await page.close();
  }
};

module.exports = { runHeaderFooter };
