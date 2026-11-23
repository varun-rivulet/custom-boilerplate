const fs = require('fs');
const path = require('path');
const { launch } = require('../lib/browser');
const { SITE_URL, WIDTHS } = require('../config');
const { hexToRgb, px, near, TIERS, SIZES, h1Size, parseButtonVars } = require('./helpers');

const DARK_HEADING = hexToRgb('#0F172A');
const LIGHT_HEADING = hexToRgb('#FFFFFF');
const IGNORED_REQUESTS = [/\/_hcms\/perf/, /\/favicon\.ico/, /track\.hubspot|hs-analytics|hs-banner|hscollectedforms|hsadspixel|usemessages|hs-scripts/];

const runTests = async ({ seeded, build, outDir, log }) => {
  const results = [];
  const shots = path.join(outDir, 'screenshots');
  fs.mkdirSync(shots, { recursive: true });
  const add = (check, title, status, detail = '', page = '') => { results.push({ check: String(check), title, status, detail, page }); log(`[${status}] ${check} ${title}${detail ? ` - ${detail}` : ''}`); };
  const bust = (url) => `${url}${url.includes('?') ? '&' : '?'}qa=${Date.now()}`;
  const browser = await launch();
  const context = await browser.newContext();

  const open = async (url, width = 1440, { expectStatus = 200 } = {}) => {
    const page = await context.newPage();
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    const bad = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${m.text()} @ ${m.location().url || ''}`); });
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) => { if (!IGNORED_REQUESTS.some((re) => re.test(r.url()))) bad.push(`FAILED ${r.failure() && r.failure().errorText} ${r.url()}`); });
    page.on('response', (r) => { if (r.status() >= 400 && !IGNORED_REQUESTS.some((re) => re.test(r.url())) && r.url().split('?')[0] !== url.split('?')[0]) bad.push(`${r.status()} ${r.url()}`); });
    const fontResponses = [];
    page.on('response', (r) => { if (/typekit|googlefonts|fonts\.g/.test(r.url())) fontResponses.push({ url: r.url(), status: r.status() }); });
    const resp = await page.goto(bust(url), { waitUntil: 'networkidle', timeout: 90000 });
    await page.evaluate(() => document.fonts.ready);
    const status = resp ? resp.status() : 0;
    return { page, errors: errors.filter((e) => !/favicon\.ico/.test(e)), bad, fontResponses, status, statusOk: status === expectStatus };
  };

  const waitForBuild = async (url) => {
    const deadline = Date.now() + 180000;
    while (Date.now() < deadline) {
      const res = await fetch(bust(url), { redirect: 'follow' }).catch(() => null);
      if (res && res.ok) {
        const html = await res.text();
        if (html.includes(`content="${build}"`)) return true;
      }
      await new Promise((r) => setTimeout(r, 5000));
    }
    return false;
  };

  const pageOf = (name) => seeded.pages.find((p) => p.name.endsWith(name));
  const basePage = pageOf('Base Module');
  const formPage = pageOf('Form');
  const landingPage = pageOf('Landing');
  const pageUrl = (p) => (p && p.url) || (p && `${SITE_URL}/${p.slug}`);

  const targets = [
    ['Base Module', pageUrl(basePage)],
    ['Form', formPage && pageUrl(formPage)],
    ['Landing', landingPage && pageUrl(landingPage)],
    ...seeded.posts.map((p) => [p.name.replace(/^.*– /, ''), p.url]),
  ].filter(([, u]) => u);

  for (const [label, url] of targets) {
    const fresh = await waitForBuild(url);
    add('build', `${label} serves this build`, fresh ? 'PASS' : 'FAIL', fresh ? '' : 'qa-build meta not found after 3 min (stale cache or publish failed)', url);
  }

  if (!basePage) {
    add('all', 'Base Module page', 'BLOCKED', 'QA – Base Module page was not created');
    await browser.close();
    return results;
  }

  const baseUrl = pageUrl(basePage);
  const sections = seeded.sections || [];

  {
    const { page, errors, bad, fontResponses } = await open(baseUrl);
    add('console', 'Console errors (Base Module)', errors.length ? 'FAIL' : 'PASS', errors.join(' | '), baseUrl);
    add('requests', 'Failed requests / 4xx-5xx (Base Module)', bad.length ? 'FAIL' : 'PASS', bad.join(' | '), baseUrl);
    const meta = await page.evaluate(() => ({
      viewport: document.querySelector('meta[name=viewport]') && document.querySelector('meta[name=viewport]').content,
      robots: document.querySelector('meta[name=robots]') && document.querySelector('meta[name=robots]').content,
    }));
    add(3, 'Viewport meta present', meta.viewport ? 'PASS' : 'FAIL', meta.viewport || 'missing', baseUrl);
    add('noindex', 'QA page is noindex', /noindex/.test(meta.robots || '') ? 'PASS' : 'FAIL', meta.robots || 'missing', baseUrl);

    const kit = fontResponses.find((f) => /use\.typekit\.net\/.*\.css/.test(f.url));
    const fonts = await page.evaluate(() => ({
      loaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family.replace(/"/g, '')}|${f.weight}|${f.style}`),
      body: getComputedStyle(document.querySelector('#qa-h1-heading p') || document.body).fontFamily,
      heading: getComputedStyle(document.querySelector('#qa-h1-heading h1') || document.body).fontFamily,
    }));
    const interWeights = [...new Set(fonts.loaded.filter((f) => /^Inter\|/.test(f)).map((f) => f.split('|')[1]))];
    const peridot = fonts.loaded.some((f) => /peridot/i.test(f));
    add(8, 'Adobe kit + Peridot loaded, body uses Peridot, headings use Inter (page)', kit && kit.status === 200 && peridot && /peridot/i.test(fonts.body) && /Inter/.test(fonts.heading) ? 'PASS' : 'FAIL', `kit ${kit ? kit.status : 'not requested'}; loaded: ${fonts.loaded.join(', ')}; body: ${fonts.body}; h1: ${fonts.heading}`, baseUrl);
    add(2, 'Only used Inter weights load', interWeights.length === 1 && interWeights[0] === '500' ? 'PASS' : 'FAIL', `Inter weights: ${interWeights.join(', ') || 'none'}`, baseUrl);

    const cssHref = await page.evaluate(() => { const l = [...document.querySelectorAll('link[rel=stylesheet]')].find((x) => /template_main/.test(x.href)); return l && l.href; });
    const css = cssHref ? await (await fetch(cssHref)).text() : '';
    const colors = [...css.matchAll(/--color-([a-z-]+):([^;}]+)/g)].map((m) => [m[1], m[2].trim()]);
    const badColors = colors.filter(([, v]) => !/^#[0-9A-Fa-f]{6}$/.test(v));
    const emptyVars = [...css.matchAll(/(--[a-z0-9-]+):\s*(;|\})/g)].map((m) => m[1]);
    const hubl = /\{\{|\{%|\{#/.test(css);
    const weights = [...css.matchAll(/--([a-z0-9-]+)-weight:([^;}]+)/g)].filter((m) => !/^\d{3}$/.test(m[2].trim())).map((m) => `${m[1]}=${m[2]}`);
    const btnVars = parseButtonVars(css);
    const btnNonHex = Object.entries(btnVars).flatMap(([k, v]) => ['bg', 'text', 'border', 'bg-hover', 'text-hover', 'border-hover'].filter((p) => v[p] && !/^#[0-9A-Fa-f]{6}$|^transparent$|^inherit$/.test(v[p])).map((p) => `${k}.${p}=${v[p]}`));
    add(19, 'Served main.css: colour tokens and inherited button values are hex, no empty vars, no HubL', colors.length >= 16 && !badColors.length && !emptyVars.length && !hubl && !btnNonHex.length ? 'PASS' : 'FAIL', `colours ${colors.length}; non-hex: ${badColors.map((c) => c.join('=')).join(', ') || 'none'}; empty: ${emptyVars.join(', ') || 'none'}; HubL: ${hubl}; button non-hex: ${btnNonHex.join(', ') || 'none'}`, cssHref);
    add(2, 'Font weights in main.css are numbers', weights.length ? 'FAIL' : 'PASS', weights.join(', '), cssHref);
    add('swap', 'No button swap rules in main.css', /\.text-color-light \.(btn|hs-button)/.test(css) ? 'FAIL' : 'PASS', '', cssHref);

    for (const s of sections) {
      const sel = `#qa-${s.key}`;
      const info = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const c = getComputedStyle(el);
        const h = el.querySelector('.section-title > *');
        const eyebrow = el.querySelector('.section-eyebrow p');
        const a = el.querySelector('.section-description a');
        return {
          cls: el.className, bg: c.backgroundColor, bgImage: c.backgroundImage, bgPos: c.backgroundPosition,
          overlayOpacity: c.getPropertyValue('--overlay-opacity').trim(), heading: h ? getComputedStyle(h).color : null,
          eyebrow: eyebrow ? getComputedStyle(eyebrow).color : null, link: a ? getComputedStyle(a).color : null,
        };
      }, sel);
      if (!info) { add('seed', `Section ${s.key} rendered`, 'FAIL', 'section not found on page', baseUrl); continue; }
      const e = s.expect;
      if (e.text) {
        const want = e.text === 'light' ? LIGHT_HEADING : DARK_HEADING;
        const ok = info.cls.includes(`text-color-${e.text}`) && info.heading === want;
        const checkNo = s.key.startsWith('auto-') || s.key === 'dark-10' || s.key.startsWith('gradient') ? 14 : s.key === 'image-empty' ? 11 : s.key === 'picker-default' ? 13 : 10;
        add(checkNo, `Text colour ${e.text} on ${s.key}`, ok ? 'PASS' : 'FAIL', `class: ${info.cls}; heading ${info.heading}; eyebrow ${info.eyebrow}; link ${info.link}`, baseUrl);
      }
      if (e.bg) add(s.key === 'picker-default' ? 13 : 10, `Background colour ${s.key}`, info.bg === hexToRgb(e.bg) ? 'PASS' : 'FAIL', `${info.bg} (want ${hexToRgb(e.bg)})`, baseUrl);
      if (e.rgba) add(14, 'Colour with opacity outputs rgba', info.bg.replace(/\s/g, '') === e.rgba ? 'PASS' : 'FAIL', info.bg, baseUrl);
      if (e.image) {
        const want = { top: '0%', center: '50%', bottom: '100%' }[e.position];
        add(16, `Image position ${e.position}`, /url\(/.test(info.bgImage) && info.bgPos.split(' ')[1] === want ? 'PASS' : 'FAIL', `${info.bgPos}; image ${/url\(/.test(info.bgImage)}`, baseUrl);
        if (e.position === 'center') add(7, 'Overlay opacity is a decimal and overlay colour sits behind the image', info.overlayOpacity === '0.5' && info.bg === hexToRgb('#0B1F3A') ? 'PASS' : 'FAIL', `--overlay-opacity ${info.overlayOpacity}; bg ${info.bg}; text class ${info.cls}`, baseUrl);
      }
      if (e.noBgImage) add(11, 'Image type with no image: no background image', info.bgImage === 'none' ? 'PASS' : 'FAIL', info.bgImage, baseUrl);
      if (e.gradient) add(14, `Gradient renders (${s.key})`, /linear-gradient/.test(info.bgImage) ? 'PASS' : 'FAIL', info.bgImage.slice(0, 120), baseUrl);
    }

    const btnSections = sections.filter((s) => s.expect.buttons).map((s) => s.key);
    const lightLink = hexToRgb('#F59E0B');
    const darkLink = hexToRgb('#334155');
    for (const key of btnSections) {
      const btns = await page.evaluate((sel) => [...document.querySelectorAll(`${sel} .section-buttons > a`)].map((b) => { const c = getComputedStyle(b); return { cls: b.className, color: c.color, bg: c.backgroundColor, border: c.borderTopColor, radius: c.borderRadius, size: c.fontSize, lh: c.lineHeight, pad: c.padding, light: !!b.closest('.text-color-light') }; }), `#qa-${key}`);
      const problems = [];
      for (const b of btns) {
        const variant = (b.cls.match(/btn-([a-z-]+)/) || [])[1];
        if (!variant) { const want = b.light ? lightLink : darkLink; if (b.color !== want) problems.push(`text-link ${b.color} want ${want}`); continue; }
        const v = btnVars[variant];
        if (!v) { problems.push(`no CSS vars for ${variant}`); continue; }
        const wantText = v.text === 'inherit' ? null : hexToRgb(v.text);
        if (b.bg !== hexToRgb(v.bg)) problems.push(`${variant} bg ${b.bg} want ${hexToRgb(v.bg)}`);
        if (wantText && b.color !== wantText) problems.push(`${variant} text ${b.color} want ${wantText}`);
        if (b.border !== hexToRgb(v.border)) problems.push(`${variant} border ${b.border} want ${hexToRgb(v.border)}`);
        if (b.radius !== '24px' || b.size !== '16px' || b.lh !== '20px' || b.pad !== '12px 32px') problems.push(`${variant} metrics radius ${b.radius} size ${b.size} lh ${b.lh} pad ${b.pad}`);
      }
      add(key === 'plain' ? 20 : 10, `Buttons keep their selected variant (${key})`, btns.length === 10 && !problems.length ? 'PASS' : 'FAIL', `${btns.length} buttons; ${problems.join('; ') || 'all match'}`, baseUrl);
    }
    const gap = await page.evaluate(() => getComputedStyle(document.querySelector('#qa-plain .section-buttons')).columnGap);
    add(20, 'Button gap follows Spacing → Button gap', gap === '16px' ? 'PASS' : 'FAIL', gap, baseUrl);
    await page.hover('#qa-plain .btn-primary');
    await page.waitForTimeout(450);
    const hover = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('#qa-plain .btn-primary')); return { bg: c.backgroundColor, color: c.color, border: c.borderTopColor, radius: c.borderRadius }; });
    const pv = btnVars.primary || {};
    add(20, 'Primary hover colours and radius', hover.bg === hexToRgb(pv['bg-hover']) && hover.border === hexToRgb(pv['border-hover']) ? 'PASS' : 'FAIL', `${JSON.stringify(hover)}; want bg ${pv['bg-hover']} border ${pv['border-hover']}`, baseUrl);

    const links = await page.evaluate(() => [...document.querySelectorAll('#qa-links .section-buttons a')].map((a) => ({ text: a.textContent.trim(), href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'), aria: a.getAttribute('aria-label') })));
    const email = links.find((l) => l.text === 'Email');
    const phone = links.find((l) => l.text === 'Phone');
    const ext = links.find((l) => l.text === 'External');
    const linkOk = email && email.href === 'mailto:qa@example.com' && phone && /^tel:\+?15550100100$/.test(phone.href) && ext && ext.target === '_blank' && /nofollow/.test(ext.rel || '') && /noopener/.test(ext.rel || '');
    add(5, 'Link types: mailto:/tel: once, new tab + rel', linkOk ? 'PASS' : 'FAIL', JSON.stringify(links), baseUrl);

    const images = await page.evaluate(() => [...document.querySelectorAll('img')].map((i) => ({ where: i.closest('header') ? 'header' : i.closest('footer') ? 'footer' : (i.closest('section') || {}).id || 'main', radius: getComputedStyle(i).borderRadius, w: i.getAttribute('width'), h: i.getAttribute('height'), loading: i.getAttribute('loading'), src: i.getAttribute('src'), srcset: i.getAttribute('srcset') || '' })));
    const wide = images.find((i) => i.where === 'qa-wide-image');
    if (wide) {
      const maxSet = Math.max(0, ...wide.srcset.split(',').map((s) => parseInt((s.trim().split(' ')[1] || '0'), 10)));
      add('img-resize', 'Wide image capped at 2× container (2640 × 990)', wide.w === '2640' && wide.h === '990' ? 'PASS' : 'FAIL', `width ${wide.w} height ${wide.h}; largest srcset ${maxSet}w; src ${String(wide.src).split('?')[1] || ''}`, baseUrl);
      add(12, 'Base Module image has the image radius and lazy loading', wide.radius === '4px' && wide.loading === 'lazy' ? 'PASS' : 'FAIL', `radius ${wide.radius} loading ${wide.loading}`, baseUrl);
    } else add('img-resize', 'Wide image present', 'FAIL', 'no image in #qa-wide-image', baseUrl);
    const logo = images.find((i) => i.where === 'header');
    add(12, 'Header logo has no image radius, loads eagerly', logo && logo.radius === '0px' && logo.loading === 'eager' ? 'PASS' : 'FAIL', logo ? `radius ${logo.radius} loading ${logo.loading} ${logo.w}x${logo.h}` : 'no logo', baseUrl);

    const listInfo = async (key) => page.evaluate((sel) => {
      const root = document.querySelector(`${sel} .section-description`);
      if (!root) return null;
      const s = (el) => { const c = getComputedStyle(el); return { type: c.listStyleType, pos: c.listStylePosition, pad: c.paddingLeft, mt: c.marginTop, mb: c.marginBottom }; };
      const topUl = root.querySelector(':scope > ul');
      const topOl = root.querySelector(':scope > ol');
      const lvl2Ul = root.querySelector(':scope > ul li > ul');
      const lvl3Ul = root.querySelector(':scope > ul li ul li > ul');
      const lvl2Ol = root.querySelector(':scope > ol li > ol');
      const lvl3Ol = root.querySelector(':scope > ol li ol li > ol');
      const wrappers = [...root.querySelectorAll('li[data-list-only]')];
      const pInLi = root.querySelector('li > p');
      const li2 = root.querySelector(':scope > ul > li + li');
      const rootLeft = root.getBoundingClientRect().left;
      const firstLi = topUl && topUl.querySelector('li');
      return {
        topUl: topUl && s(topUl), topOl: topOl && s(topOl), lvl2Ul: lvl2Ul && s(lvl2Ul), lvl3Ul: lvl3Ul && s(lvl3Ul), lvl2Ol: lvl2Ol && s(lvl2Ol), lvl3Ol: lvl3Ol && s(lvl3Ol),
        wrappers: wrappers.length, wrapperTypes: wrappers.map((w) => getComputedStyle(w).listStyleType), wrapperNestedMt: wrappers.map((w) => getComputedStyle(w.firstElementChild).marginTop),
        pMargin: pInLi && getComputedStyle(pInLi).margin, liGap: li2 && getComputedStyle(li2).marginTop,
        textOffset: firstLi ? Math.round(firstLi.getBoundingClientRect().left - rootLeft) : null,
      };
    }, `#qa-${key}`);

    const left = await listInfo('lists-left');
    if (left) {
      const problems = [];
      if (!left.topUl || left.topUl.pos !== 'outside' || left.topUl.type !== 'disc') problems.push(`ul ${JSON.stringify(left.topUl)}`);
      if (!left.lvl2Ul || left.lvl2Ul.type !== 'circle') problems.push(`ul level 2 ${left.lvl2Ul && left.lvl2Ul.type}`);
      if (!left.lvl3Ul || left.lvl3Ul.type !== 'square') problems.push(`ul level 3 ${left.lvl3Ul && left.lvl3Ul.type}`);
      if (!left.topOl || left.topOl.type !== 'decimal' || left.topOl.pos !== 'outside') problems.push(`ol ${JSON.stringify(left.topOl)}`);
      if (!left.lvl2Ol || left.lvl2Ol.type !== 'lower-alpha') problems.push(`ol level 2 ${left.lvl2Ol && left.lvl2Ol.type}`);
      if (!left.lvl3Ol || left.lvl3Ol.type !== 'lower-roman') problems.push(`ol level 3 ${left.lvl3Ol && left.lvl3Ol.type}`);
      if (left.pMargin !== '0px') problems.push(`p in li margin ${left.pMargin}`);
      if (left.liGap !== '8px') problems.push(`li gap ${left.liGap}`);
      if (left.lvl2Ul && left.lvl2Ul.mb !== '8px') problems.push(`nested list margin ${left.lvl2Ul.mt}/${left.lvl2Ul.mb}`);
      add('lists', 'Lists (left): outside markers, nesting styles, p margins, spacing', problems.length ? 'FAIL' : 'PASS', problems.join('; ') || `text offset ${left.textOffset}px, ul pad ${left.topUl.pad}, ol pad ${left.topOl.pad}`, baseUrl);
      const wrapOk = left.wrappers >= 2 && left.wrapperTypes.every((t) => t === 'none');
      add('lists', 'li starting with a nested list gets data-list-only (HubL regex) and no marker', wrapOk ? 'PASS' : 'FAIL', `wrappers ${left.wrappers}; types ${left.wrapperTypes.join(',')}; nested margin-top ${left.wrapperNestedMt.join(',')}`, baseUrl);
    } else add('lists', 'Lists section rendered', 'FAIL', 'no description in #qa-lists-left', baseUrl);
    const center = await listInfo('lists-center');
    add('lists', 'Lists (center): markers inside, no padding', center && center.topUl && center.topUl.pos === 'inside' && center.topUl.pad === '0px' && center.topOl.pos === 'inside' ? 'PASS' : 'FAIL', center ? `ul ${JSON.stringify(center.topUl)} ol ${JSON.stringify(center.topOl)}` : 'missing', baseUrl);

    await page.close();
  }

  for (const w of WIDTHS) {
    const { page } = await open(baseUrl, w);
    const t = await page.evaluate(() => {
      const q = (s) => { const el = document.querySelector(s); return el ? parseFloat(getComputedStyle(el).fontSize) : null; };
      const de = document.documentElement;
      const pad = (id) => { const el = document.getElementById(id); if (!el) return null; const c = getComputedStyle(el); return [parseFloat(c.paddingTop), parseFloat(c.paddingBottom)]; };
      const contentBox = (id) => { const el = document.querySelector(`#${id} .section-content`); const box = document.querySelector(`#${id} .container`); if (!el || !box) return null; const r = el.getBoundingClientRect(); const b = box.getBoundingClientRect(); const cs = getComputedStyle(box); return { w: r.width, left: r.left - (b.left + parseFloat(cs.paddingLeft)), right: (b.right - parseFloat(cs.paddingRight)) - r.right }; };
      const wide = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > de.clientWidth + 1 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 5).map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}`);
      return {
        h1: q('#qa-h1-heading h1'), h2: q('#qa-h1-heading .section-description h2'), h3: q('#qa-h1-heading h3'), h4: q('#qa-h1-heading h4'), h5: q('#qa-h1-heading h5'), h6: q('#qa-h1-heading h6'), p: q('#qa-h1-heading .section-description p'),
        scroll: de.scrollWidth > de.clientWidth, scrollW: de.scrollWidth, wide,
        spacingA: pad('qa-spacing-a'), spacingB: pad('qa-spacing-b'), plain: pad('qa-plain'),
        widthLeft: contentBox('qa-width-left'), widthCenter: contentBox('qa-width-center'), widthRight: contentBox('qa-width-right'),
        btnPad: (() => { const b = document.querySelector('#qa-plain .btn-primary'); return b ? getComputedStyle(b).padding : null; })(),
      };
    });
    const tier = TIERS[w];
    const sizeProblems = [];
    if (!near(t.h1, h1Size(w))) sizeProblems.push(`h1 ${t.h1} want ${h1Size(w).toFixed(2)}`);
    for (const k of Object.keys(SIZES)) if (!near(t[k], SIZES[k][tier])) sizeProblems.push(`${k} ${t[k]} want ${SIZES[k][tier]}`);
    add(w === 1440 || w === 360 ? 12 : 'type', `Type sizes at ${w}px (H1 fluid, H2–H6, body)`, sizeProblems.length ? 'FAIL' : 'PASS', sizeProblems.join('; ') || `h1 ${t.h1.toFixed(1)}`, baseUrl);
    add('scroll', `No horizontal scroll at ${w}px (Base Module)`, t.scroll ? 'FAIL' : 'PASS', t.scroll ? `scrollWidth ${t.scrollW}; ${t.wide.join(', ')}` : '', baseUrl);
    const spA = sections.find((s) => s.key === 'spacing-a');
    const spB = sections.find((s) => s.key === 'spacing-b');
    if (spA && spA.expect.padding[w]) add(9, `Custom spacing A at ${w}px (empty side keeps larger tier)`, t.spacingA && near(t.spacingA[0], spA.expect.padding[w][0]) && near(t.spacingA[1], spA.expect.padding[w][1]) ? 'PASS' : 'FAIL', `${t.spacingA} want ${spA.expect.padding[w]}`, baseUrl);
    if (spB && spB.expect.padding[w]) add(6, `Custom spacing B stays per instance at ${w}px`, t.spacingB && near(t.spacingB[0], 33) && near(t.spacingB[1], 33) ? 'PASS' : 'FAIL', `B ${t.spacingB}; plain ${t.plain}`, baseUrl);
    if (w === 1440) {
      const wl = t.widthLeft; const wc = t.widthCenter; const wr = t.widthRight;
      const ok = wl && near(wl.w, 600, 1) && near(wl.left, 0, 1) && wc && near(wc.left, wc.right, 1) && wr && near(wr.right, 0, 1);
      add('width', 'Content width 600 with left / center / right position', ok ? 'PASS' : 'FAIL', JSON.stringify({ left: wl, center: wc, right: wr }), baseUrl);
      add(6, 'Default section padding (Medium) on a section without custom spacing', t.plain && near(t.plain[0], 100) ? 'PASS' : 'FAIL', `${t.plain}`, baseUrl);
    }
    if (w === 767 || w === 1440) add(20, `Button padding at ${w}px`, t.btnPad === (w === 767 ? '10px 24px' : '12px 32px') ? 'PASS' : 'FAIL', t.btnPad, baseUrl);
    await page.screenshot({ path: path.join(shots, `base-module-${w}.png`), fullPage: true });
    if (w === 1440 || w === 360) {
      for (const key of ['lists-left', 'lists-center']) {
        const el = page.locator(`#qa-${key}`);
        if (await el.count()) await el.screenshot({ path: path.join(shots, `${key}-${w}.png`) });
      }
    }
    await page.close();
  }

  {
    const { page } = await open(baseUrl, 1440);
    const h = await page.evaluate(() => {
      const nav = document.querySelector('.site-header-nav');
      const items = [...document.querySelectorAll('.site-header-menu > li')];
      return {
        mode: nav ? (/mega/.test(nav.className) ? 'mega' : 'simple') : 'none',
        items: items.length,
        withChildren: items.filter((li) => li.classList.contains('has-children')).length,
        leafProblems: items.filter((li) => !li.classList.contains('has-children') && (li.querySelector('.site-header-dropdown') || li.querySelector('[data-header-sub-toggle]'))).length,
        labelToggles: document.querySelectorAll('.site-header-label-toggle').length,
        newTab: [...document.querySelectorAll('.site-header-nav a[target=_blank]')].map((a) => a.getAttribute('rel')),
        current: [...document.querySelectorAll('.site-header-nav [aria-current=page]')].map((a) => a.textContent.trim()),
        cta: !!document.querySelector('.site-header-cta a.btn'),
        megaCols: [...document.querySelectorAll('.site-header-mega-grid')].map((g) => g.children.length),
      };
    });
    add(17, `Header renders (${h.mode} menu, ${h.items} items, ${h.withChildren} with sub-items)`, h.items ? 'PASS' : 'FAIL', '', baseUrl);
    add(17, 'Items without sub-items render without arrow or dropdown', h.leafProblems === 0 ? 'PASS' : 'FAIL', `${h.leafProblems} problem items`, baseUrl);
    add(17, 'Header button shown', h.cta ? 'PASS' : 'BLOCKED', h.cta ? '' : 'No header button set (manual: global Header content)', baseUrl);
    add(17, 'Current page link has aria-current="page"', h.current.length ? 'PASS' : 'BLOCKED', h.current.join(', ') || 'QA – Base Module is not in the menu (manual: QA – Menu)', baseUrl);
    add(17, 'New-tab menu item has target and rel', h.newTab.length ? (h.newTab.every((r) => /noopener/.test(r || '')) ? 'PASS' : 'FAIL') : 'BLOCKED', h.newTab.join(', ') || 'no new-tab item in the menu', baseUrl);
    add(17, 'No-URL parent renders as a toggle button', h.labelToggles ? 'PASS' : 'BLOCKED', `${h.labelToggles} label toggles`, baseUrl);
    if (!h.withChildren) {
      add(17, `Dropdown behaviour (${h.mode})`, 'BLOCKED', 'Menu has no sub-items (manual: select QA – Menu in the global Header)', baseUrl);
    } else {
      await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
      await page.mouse.move(5, 600);
      const tabbed = [];
      let arrow = null;
      for (let i = 0; i < 25 && !arrow; i++) {
        await page.keyboard.press('Tab');
        const info = await page.evaluate(() => {
          const a = document.activeElement;
          const c = getComputedStyle(a);
          return { isToggle: a.hasAttribute('data-header-sub-toggle'), label: (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 24), focusVisible: a.matches(':focus-visible'), outline: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}` };
        });
        tabbed.push(info.label);
        if (info.isToggle) arrow = info;
      }
      add(17, `Submenu arrow focus outline with real Tab presses (${h.mode})`, arrow && arrow.focusVisible && arrow.outline.split(' ')[0] !== 'none' ? 'PASS' : 'FAIL', arrow ? `after ${tabbed.length} Tabs: :focus-visible ${arrow.focusVisible}, outline ${arrow.outline}` : `no submenu arrow reached in 25 Tabs (${tabbed.join(' > ')})`, baseUrl);
      if (arrow) await page.screenshot({ path: path.join(shots, `header-${h.mode}-arrow-focus.png`), clip: { x: 0, y: 0, width: 1440, height: 120 } });
      const item = page.locator('.site-header-menu > li.has-children').first();
      const toggle = item.locator('[data-header-sub-toggle]');
      const dd = item.locator('.site-header-dropdown');
      await item.hover(); await page.waitForTimeout(250);
      const hoverOpen = await dd.isVisible();
      await page.mouse.move(5, 600); await page.waitForTimeout(800);
      const hoverClosed = !(await dd.isVisible());
      await toggle.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
      const enterOpen = (await toggle.getAttribute('aria-expanded')) === 'true' && await dd.isVisible();
      await page.keyboard.press('Escape'); await page.waitForTimeout(150);
      const escClosed = (await toggle.getAttribute('aria-expanded')) === 'false';
      const focusBack = await toggle.evaluate((el) => el === document.activeElement);
      await page.keyboard.press(' '); await page.waitForTimeout(150);
      const spaceOpen = (await toggle.getAttribute('aria-expanded')) === 'true';
      await page.mouse.click(5, 600); await page.waitForTimeout(150);
      const outsideClosed = (await toggle.getAttribute('aria-expanded')) === 'false';
      const outline = await toggle.evaluate((el) => { el.focus(); const c = getComputedStyle(el); return `${c.outlineStyle} ${c.outlineWidth}`; });
      const ok = hoverOpen && hoverClosed && enterOpen && escClosed && focusBack && spaceOpen && outsideClosed;
      add(17, `Dropdown (${h.mode}): hover, Enter/Space, Escape returns focus, click outside`, ok ? 'PASS' : 'FAIL', JSON.stringify({ hoverOpen, hoverClosed, enterOpen, escClosed, focusBack, spaceOpen, outsideClosed, outline }), baseUrl);
      await item.hover(); await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(shots, `header-${h.mode}-open-1440.png`) });
      if (h.mode === 'mega') {
        const box = await dd.boundingBox();
        add(17, 'Mega menu: full-width panel with columns', box && box.width >= 1400 && h.megaCols.every((n) => n > 0) ? 'PASS' : 'FAIL', `panel width ${box && Math.round(box.width)}; columns ${h.megaCols.join(',')}`, baseUrl);
      }
      const link = page.locator('a.site-header-link').first();
      if (await link.count()) {
        const bar = () => link.evaluate((el) => { const c = getComputedStyle(el, '::after'); return { tf: c.transform, dur: c.transitionDuration, h: c.height }; });
        await page.mouse.move(5, 600); await page.waitForTimeout(500);
        const before = await bar();
        await link.hover(); await page.waitForTimeout(450);
        const after = await bar();
        add(17, 'Menu link hover: underline bar grows from the left (.25s)', /matrix\(0, 0, 0, 1/.test(before.tf) && /matrix\(1, 0, 0, 1/.test(after.tf) && before.dur === '0.25s' && before.h === '2px' ? 'PASS' : 'FAIL', JSON.stringify({ before, after }), baseUrl);
        await page.mouse.move(5, 600); await page.waitForTimeout(500);
        const ddAnim = await dd.evaluate((el) => { const c = getComputedStyle(el); return { op: c.opacity, vis: c.visibility, tf: c.transform, dur: c.transitionDuration }; });
        await item.hover(); await page.waitForTimeout(450);
        const ddOpen = await dd.evaluate((el) => { const c = getComputedStyle(el); return { op: c.opacity, vis: c.visibility, tf: c.transform }; });
        add(17, `Dropdown (${h.mode}) fades and slides 8px down (.25s)`, ddAnim.op === '0' && ddAnim.vis === 'hidden' && /matrix\(1, 0, 0, 1, 0, -8\)/.test(ddAnim.tf) && ddAnim.dur.startsWith('0.25s') && ddOpen.op === '1' && ddOpen.vis === 'visible' ? 'PASS' : 'FAIL', JSON.stringify({ ddAnim, ddOpen }), baseUrl);
        if (h.mode === 'mega') {
          const ov = await page.locator('.site-header-overlay').evaluate((el) => { const c = getComputedStyle(el); return { op: c.opacity, vis: c.visibility, bg: c.backgroundColor }; });
          await page.mouse.click(5, 700); await page.waitForTimeout(700);
          const ovClosed = await page.locator('.site-header-overlay').evaluate((el) => getComputedStyle(el).visibility);
          add(17, 'Mega menu: page overlay fades in and a click on it closes the menu', ov.op === '1' && ov.vis === 'visible' && ovClosed === 'hidden' ? 'PASS' : 'FAIL', JSON.stringify({ ov, ovClosed }), baseUrl);
        }
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const rm = await page.evaluate(() => ({ link: getComputedStyle(document.querySelector('a.site-header-link'), '::after').transitionDuration, dd: getComputedStyle(document.querySelector('.site-header-dropdown')).transitionDuration }));
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        add(17, 'Reduced motion: header transitions are off', rm.link === '0s' && rm.dd === '0s' ? 'PASS' : 'FAIL', JSON.stringify(rm), baseUrl);
      }
    }
    if (await page.locator('[data-header-toggle]').count()) {
      const runs = async (open) => {
        await page.setViewportSize({ width: 1200, height: 900 }); await page.waitForTimeout(700);
        await page.evaluate(() => { window.__tr = []; document.addEventListener('transitionrun', (e) => { if (e.target.closest && e.target.closest('.site-header, .site-header-overlay')) window.__tr.push(e.propertyName + '@' + e.target.className); }, true); });
        await page.setViewportSize({ width: 900, height: 900 }); await page.waitForTimeout(60);
        if (open) { await page.evaluate(() => document.querySelector('[data-header-toggle]').click()); await page.waitForTimeout(700); await page.evaluate(() => { window.__tr = []; }); }
                await page.setViewportSize({ width: 1200, height: 900 }); await page.waitForTimeout(60);
        await page.setViewportSize({ width: 900, height: 900 }); await page.waitForTimeout(60);
        await page.setViewportSize({ width: 1200, height: 900 }); await page.waitForTimeout(60);
        const trList = await page.evaluate(() => window.__tr); const during = trList.length;
        await page.waitForTimeout(400);
        const cleared = await page.evaluate(() => !document.documentElement.classList.contains('is-resizing'));
        return { open, during, trList, cleared };
      };
      const closedRun = await runs(false);
      const openRun = await runs(true);
      add(17, 'Resize across 991.98px: no header transition plays (menu closed and open)', closedRun.during === 0 && openRun.during === 0 && closedRun.cleared && openRun.cleared ? 'PASS' : 'FAIL', JSON.stringify({ closedRun, openRun }), baseUrl);
      await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(400);
    }
    await page.setViewportSize({ width: 767, height: 900 }); await page.waitForTimeout(300);
    const navToggle = page.locator('[data-header-toggle]');
    if (await navToggle.count()) {
      await page.waitForTimeout(600);
      const panelClosed = await page.locator('#siteHeaderPanel').evaluate((el) => { const c = getComputedStyle(el); return { tf: c.transform, vis: c.visibility, dur: c.transitionDuration }; });
      await navToggle.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(100);
      const animDur = await page.locator('#siteHeaderPanel').evaluate((el) => getComputedStyle(el).transitionDuration); await page.waitForTimeout(400);
      const panelOpen = await page.locator('#siteHeaderPanel').evaluate((el) => { const c = getComputedStyle(el); const b = el.getBoundingClientRect(); return { tf: c.transform, vis: c.visibility, left: Math.round(b.left), w: Math.round(b.width), locked: document.documentElement.classList.contains('is-scroll-locked'), closeIcon: getComputedStyle(document.querySelector('.site-header-icon-close')).opacity }; });
      add(17, 'Mobile panel slides in from the left (.35s), page scroll locked, icon crossfade', /matrix\(1, 0, 0, 1, -/.test(panelClosed.tf) && panelClosed.vis === 'hidden' && animDur.startsWith('0.35s') && panelOpen.vis === 'visible' && panelOpen.left === 0 && panelOpen.w >= 767 && panelOpen.locked && panelOpen.closeIcon === '1' ? 'PASS' : 'FAIL', JSON.stringify({ panelClosed, animDur, panelOpen }), baseUrl);
      const opened = (await navToggle.getAttribute('aria-expanded')) === 'true' && await page.locator('#siteHeaderPanel').isVisible();
      let accordion = 'no sub-items';
      if (h.withChildren) {
        const t = page.locator('.site-header-menu > li.has-children [data-header-sub-toggle]').first();
        await t.click(); await page.waitForTimeout(200);
        accordion = await page.locator('.site-header-menu > li.has-children .site-header-dropdown').first().isVisible() ? 'opens' : 'does not open';
        await page.screenshot({ path: path.join(shots, 'header-mobile-accordion-767.png') });
        await t.focus(); await page.keyboard.press('Escape'); await page.waitForTimeout(150);
      }
      await navToggle.focus(); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
      const closed = (await navToggle.getAttribute('aria-expanded')) === 'false';
      const focusBack = await navToggle.evaluate((el) => el === document.activeElement);
      add(17, 'Mobile menu: Enter opens, accordion submenus, Escape closes with focus on the menu button', opened && closed && focusBack && accordion !== 'does not open' ? 'PASS' : 'FAIL', JSON.stringify({ opened, accordion, closed, focusBack }), baseUrl);
    } else add(17, 'Mobile menu button', 'FAIL', 'no menu button at 767px', baseUrl);
    await page.close();
  }

  {
    const { page } = await open(baseUrl, 1440);
    const year = String(new Date().getFullYear());
    const f = await page.evaluate(() => {
      const root = document.querySelector('.site-footer');
      if (!root) return null;
      const focusOutline = (() => { const a = root.querySelector('a'); if (!a) return null; a.focus(); const c = getComputedStyle(a); return `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`; })();
      return {
        columns: root.querySelectorAll('.site-footer-column').length,
        columnsNoHeading: [...root.querySelectorAll('.site-footer-column')].filter((c) => !c.querySelector('.site-footer-col-title')).length,
        social: root.querySelectorAll('.site-footer-social a').length,
        socialNames: [...root.querySelectorAll('.site-footer-social a')].map((a) => a.textContent.trim()),
        legal: root.querySelectorAll('.site-footer-legal-list a').length,
        hrefs: [...root.querySelectorAll('a[href^="mailto:"],a[href^="tel:"]')].map((a) => a.getAttribute('href')),
        doubled: /mailto:mailto:|tel:tel:/.test(root.innerHTML),
        text: root.textContent.replace(/\s+/g, ' '),
        focusOutline,
        bg: getComputedStyle(root).backgroundColor, color: getComputedStyle(root).color,
        nullText: [...document.querySelectorAll('.site-footer *, .site-header *')].filter((e) => e.children.length === 0 && /^(null|None|undefined)$/.test(e.textContent.trim())).map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}`),
      };
    });
    if (!f) add(18, 'Footer renders', 'FAIL', 'no .site-footer', baseUrl);
    else {
      add(18, 'Header/footer print no literal "null" for empty fields', f.nullText.length ? 'FAIL' : 'PASS', f.nullText.join(', ') || '', baseUrl);
      add(18, 'Footer year and mailto:/tel: prefixes', f.text.includes(year) && !f.doubled ? 'PASS' : 'FAIL', `year ${f.text.includes(year)}; hrefs ${f.hrefs.join(', ')}`, baseUrl);
      add(18, 'Footer colours (default white on Dark) and focus outline', f.bg === hexToRgb('#0B1F3A') && f.color === hexToRgb('#FFFFFF') && /solid/.test(f.focusOutline || '') ? 'PASS' : 'FAIL', `${f.bg} / ${f.color}; focus ${f.focusOutline}`, baseUrl);
      add(18, 'Footer menu columns, social links and legal links present', f.columns && f.social && f.legal ? 'PASS' : 'BLOCKED', `columns ${f.columns} (no heading ${f.columnsNoHeading}); social ${f.social} (${f.socialNames.join(', ')}); legal ${f.legal}${f.columns && f.social && f.legal ? '' : ' (manual: global Footer content)'}`, baseUrl);
    }
    for (const w of [1440, 991, 767, 360]) {
      await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(250);
      const layout = await page.evaluate(() => ['.site-footer-brand', '.site-footer-nav', '.site-footer-aside'].map((s) => { const el = document.querySelector(s); if (!el) return `${s}: -`; const r = el.getBoundingClientRect(); return `${s} x${Math.round(r.left)} y${Math.round(r.top)} w${Math.round(r.width)}`; }));
      const footer = page.locator('.site-footer');
      if (await footer.count()) await footer.screenshot({ path: path.join(shots, `footer-${w}.png`) });
      add(18, `Footer layout at ${w}px`, 'INFO', layout.join(' | '), baseUrl);
    }
    await page.close();
  }

  if (landingPage) {
    const url = pageUrl(landingPage);
    const { page, errors, bad } = await open(url, 1440);
    const h = await page.evaluate(() => ({
      headers: document.querySelectorAll('.site-header').length,
      nav: !!document.querySelector('.site-header-nav'),
      toggle: !!document.querySelector('.site-header-toggle'),
      logo: (() => { const i = document.querySelector('.site-header-logo img'); return i ? `${i.getAttribute('width')}x${i.getAttribute('height')} ${i.getAttribute('loading')}` : null; })(),
      cta: (() => { const a = document.querySelector('.site-header-cta a'); return a ? a.className : null; })(),
      bg: getComputedStyle(document.querySelector('.site-header') || document.body).backgroundColor,
    }));
    add('17b', 'Header – Simple: logo, no menu, no menu button', h.headers === 1 && !h.nav && !h.toggle && h.logo ? 'PASS' : 'FAIL', JSON.stringify(h), url);
    add('17b', 'Header – Simple: header button', h.cta ? 'PASS' : 'BLOCKED', h.cta || 'No button set (manual: global Header – Simple content)', url);
    add('17b', 'Header – Simple: no console errors / failed requests', errors.length || bad.length ? 'FAIL' : 'PASS', [...errors, ...bad].join(' | '), url);
    for (const w of WIDTHS) {
      await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(250);
      const scroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      if (scroll) add('17b', `Landing: horizontal scroll at ${w}px`, 'FAIL', '', url);
      await page.screenshot({ path: path.join(shots, `landing-${w}.png`), fullPage: true });
    }
    add('17b', 'Landing: no horizontal scroll 1440–360', results.some((r) => r.check === '17b' && /horizontal scroll at/.test(r.title)) ? 'FAIL' : 'PASS', '', url);
    await page.close();
  } else add('17b', 'Header – Simple landing page', 'BLOCKED', 'QA – Landing was not created');

  if (formPage) {
    const url = pageUrl(formPage);
    const { page, errors } = await open(url, 1440);
    await page.waitForTimeout(2500);
    const f = await page.evaluate(() => {
      const legacy = document.querySelector('.hs-form');
      const modern = document.querySelector('[class*="hsfc-"]');
      const frame = document.querySelector('iframe[src*="forms"], iframe.hs-form-iframe');
      const root = legacy || modern;
      if (!root) return { found: false, frame: !!frame };
      const label = root.querySelector('label');
      const input = root.querySelector('input[type=text], input[type=email]');
      const submit = root.querySelector('input[type=submit], button[type=submit]');
      const c = (el, p) => (el ? getComputedStyle(el)[p] : null);
      return { found: true, kind: legacy ? 'legacy .hs-form' : 'new editor (hsfc)', label: c(label, 'color'), inputBorder: c(input, 'borderTopColor'), inputRadius: c(input, 'borderTopLeftRadius'), submitBg: c(submit, 'backgroundColor'), submitRadius: c(submit, 'borderTopLeftRadius'), submitClass: submit && submit.className };
    });
    if (!f.found) add(4, 'Form renders', 'FAIL', f.frame ? 'Form renders inside an iframe: theme CSS cannot style it' : 'no form markup found', url);
    else {
      add(4, `Form renders (${f.kind})`, 'PASS', '', url);
      const styled = f.inputBorder === hexToRgb('#64748B') && f.submitRadius === '24px';
      add(4, 'Form follows theme form settings (input border, submit button style)', styled ? 'PASS' : 'FAIL', JSON.stringify(f), url);
      const submit = page.locator('input[type=submit], button[type=submit]').first();
      await submit.click(); await page.waitForTimeout(800);
      const err = await page.evaluate(() => { const e = document.querySelector('.hs-error-msgs label, .hs-error-msg, [class*="hsfc-ErrorAlert"], [role=alert]'); return e ? { text: e.textContent.trim(), color: getComputedStyle(e).color } : null; });
      add(4, 'Required-field error message shows', err ? 'PASS' : 'FAIL', err ? JSON.stringify(err) : 'no error message after empty submit', url);
      await page.screenshot({ path: path.join(shots, 'form-1440.png'), fullPage: true });
    }
    add(4, 'Form page console errors', errors.length ? 'FAIL' : 'PASS', errors.join(' | '), url);
    add(4, 'Form on a dark background', 'MANUAL', 'Waits for the Form Section module (Phase 4)', url);
    await page.close();
  } else add(4, 'Form page', 'BLOCKED', (seeded.blocked.find((b) => b.what === 'form') || {}).reason || 'not created');

  const post = seeded.posts[0];
  if (post && post.url) {
    const { page, fontResponses } = await open(post.url, 1440);
    const b = await page.evaluate(() => {
      const narrow = document.querySelector('.container-narrow');
      const img = document.querySelector('.blog-post-image img');
      const related = document.querySelector('[class*="related"], [class*="recent-posts"]');
      return {
        narrowWidth: narrow ? Math.round(narrow.getBoundingClientRect().width - parseFloat(getComputedStyle(narrow).paddingLeft) - parseFloat(getComputedStyle(narrow).paddingRight)) : null,
        imgRadius: img ? getComputedStyle(img).borderRadius : null,
        wrappers: document.querySelectorAll('.blog-post-body li[data-list-only]').length,
        related: !!related,
        bodyFont: getComputedStyle(document.querySelector('.blog-post-body p') || document.body).fontFamily,
      };
    });
    add(8, 'Blog post: narrow container (65% of 1320 = 858px)', b.narrowWidth && near(b.narrowWidth, 858, 2) ? 'PASS' : 'FAIL', `${b.narrowWidth}px`, post.url);
    add(12, 'Blog featured image has the image radius', b.imgRadius === '4px' ? 'PASS' : 'FAIL', `${b.imgRadius}`, post.url);
    add('lists', 'Blog post body: data-list-only on list-only items', b.wrappers >= 2 ? 'PASS' : 'FAIL', `${b.wrappers} wrappers`, post.url);
    add(8, 'Blog post: Adobe kit and Peridot body font', fontResponses.some((r) => /use\.typekit\.net/.test(r.url) && r.status === 200) && /peridot/i.test(b.bodyFont) ? 'PASS' : 'FAIL', b.bodyFont, post.url);
    add('blog-related', 'Blog post: related posts section', b.related ? 'PASS' : 'NOT BUILT', b.related ? '' : 'blog-post.html has no related posts section yet', post.url);
    for (const w of [1440, 360]) { await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(250); await page.screenshot({ path: path.join(shots, `blog-post-${w}.png`), fullPage: true }); }
    await page.close();
  } else add(8, 'Blog post', 'BLOCKED', (seeded.blocked.find((x) => x.what === 'blog posts') || {}).reason || 'no published QA post');

  if (seeded.blog && seeded.blog.absoluteUrl) {
    const { page, fontResponses, statusOk, status } = await open(seeded.blog.absoluteUrl, 1440);
    add(8, 'Blog listing loads with the Adobe kit', statusOk && fontResponses.some((r) => /use\.typekit\.net/.test(r.url) && r.status === 200) ? 'PASS' : 'FAIL', `status ${status}`, seeded.blog.absoluteUrl);
    await page.screenshot({ path: path.join(shots, 'blog-listing-1440.png'), fullPage: true });
    await page.close();
  }

  {
    const url = `${SITE_URL}/qa-auto-missing-${Date.now()}`;
    const { page, status, fontResponses } = await open(url, 1440, { expectStatus: 404 });
    const theme = await page.evaluate(() => !!document.querySelector('.system-page'));
    add(8, '404 page uses the theme 404 template and the Adobe kit', status === 404 && theme && fontResponses.some((r) => /use\.typekit\.net/.test(r.url)) ? 'PASS' : theme ? 'FAIL' : 'MANUAL', theme ? `status ${status}` : `status ${status}; theme 404 template not in use. MANUAL – needs a Starter+ portal (plan limitation): system page templates can't be set in this portal.`, url);
    await page.screenshot({ path: path.join(shots, '404-1440.png'), fullPage: true });
    await page.close();
  }

  await browser.close();
  return results;
};

module.exports = { runTests };
