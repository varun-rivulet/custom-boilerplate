const BTN = ['primary', 'secondary', 'dark', 'white', 'accent', 'primary_outline', 'secondary_outline', 'white_outline', 'dark_outline'];

const measure = () => {
  const cs = (el, p) => (el ? getComputedStyle(el)[p] : null);
  const q = (s) => document.querySelector(s);
  const px = (v) => (v === null || v === undefined ? null : parseFloat(v));
  const text = (s) => { const el = q(s); return el ? { size: px(cs(el, 'fontSize')), lh: px(cs(el, 'lineHeight')), color: cs(el, 'color'), tt: cs(el, 'textTransform'), ls: cs(el, 'letterSpacing'), weight: cs(el, 'fontWeight') } : null; };
  const out = { bodyBg: cs(document.body, 'backgroundColor') };
  out.h1 = text('#qa-h1-heading h1');
  for (const h of ['h2', 'h3', 'h4', 'h5', 'h6']) out[h] = text(`#qa-h1-heading .section-description ${h}`);
  out.h2plain = text('#qa-plain h2');
  out.p = text('#qa-plain .section-description p');
  out.eyebrow = text('#qa-plain .section-eyebrow p');
  const eb = q('#qa-plain .section-eyebrow');
  out.eyebrowGap = eb ? px(cs(eb, 'marginBottom')) : null;
  const rl = q('#qa-plain .section-description a');
  out.richLink = rl ? { offset: cs(rl, 'textUnderlineOffset'), color: cs(rl, 'color') } : null;
  const container = q('#qa-plain .container');
  out.container = container ? { w: Math.round(container.getBoundingClientRect().width), padL: px(cs(container, 'paddingLeft')) } : null;
  const sec = q('#qa-plain');
  out.secPad = sec ? { t: px(cs(sec, 'paddingTop')), b: px(cs(sec, 'paddingBottom')) } : null;
  const grp = q('#qa-plain .section-buttons');
  out.btnGap = grp ? px(cs(grp, 'columnGap')) : null;
  const im = q('#qa-with-image .section-media img');
  out.imgRadius = im ? px(cs(im, 'borderTopLeftRadius')) : null;
  out.btn = {};
  for (const v of ['primary', 'secondary', 'dark', 'white', 'accent', 'primary-outline', 'secondary-outline', 'white-outline', 'dark-outline']) {
    const el = q(`#qa-plain a.btn-${v}`);
    if (el) out.btn[v.replace('-', '_')] = { bg: cs(el, 'backgroundColor'), color: cs(el, 'color'), bw: px(cs(el, 'borderTopWidth')), bc: cs(el, 'borderTopColor'), r: px(cs(el, 'borderTopLeftRadius')), pt: px(cs(el, 'paddingTop')), pl: px(cs(el, 'paddingLeft')), ls: cs(el, 'letterSpacing'), lh: px(cs(el, 'lineHeight')), fs: px(cs(el, 'fontSize')), tt: cs(el, 'textTransform') };
  }
  const light = q('#qa-light-forced');
  out.light = light ? { h2: cs(light.querySelector('h2'), 'color'), p: cs(light.querySelector('.section-description p'), 'color'), eb: cs(light.querySelector('.section-eyebrow p'), 'color'), a: cs(light.querySelector('.section-description a'), 'color') } : null;
  const hl = q('.site-header-link');
  const dd = q('.site-header-dropdown');
  const hd = q('header.site-header');
  out.header = { link: cs(hl, 'color'), bg: cs(hd, 'backgroundColor'), dd: dd ? { bg: cs(dd, 'backgroundColor'), bc: cs(dd, 'borderTopColor'), bw: px(cs(dd, 'borderTopWidth')) } : null, ddText: cs(q('.site-header-sublink, .site-header-mega-link'), 'color') };
  const ft = q('footer.site-footer');
  out.footer = ft ? { bg: cs(ft, 'backgroundColor'), color: cs(ft, 'color'), link: cs(ft.querySelector('.site-footer-list a, .site-footer-legal-list a'), 'color') } : null;
  const inp = q('.hs-form .hs-input:not([type=submit]):not([type=checkbox])');
  const lab = q('.hs-form label');
  const help = q('.hs-form .hs-field-desc');
  const sub = q('.hs-form input[type=submit], .hs-form .hs-button');
  out.form = inp ? { bw: px(cs(inp, 'borderTopWidth')), bc: cs(inp, 'borderTopColor'), r: px(cs(inp, 'borderTopLeftRadius')), pt: px(cs(inp, 'paddingTop')), pl: px(cs(inp, 'paddingLeft')), bg: cs(inp, 'backgroundColor'), color: cs(inp, 'color'), label: lab ? { color: cs(lab, 'color'), weight: cs(lab, 'fontWeight') } : null, help: help ? cs(help, 'color') : null, submit: sub ? { cls: sub.className, bg: cs(sub, 'backgroundColor') } : null } : null;
  return out;
};

const rgbOf = (hex, hexRgb) => hexRgb(hex);
const near = (a, b, t = 0.6) => a !== null && b !== null && Math.abs(a - b) <= t;

const renderChecks = async ({ group, S, ctx, urls, add, WIDTHS, tierIdx, hexRgb }) => {
  const want = (p) => (S[p] ? S[p].want : undefined);
  const wantPad = (p, side) => (S[p] ? S[p].want[side].value : undefined);
  const h1px = (max, w) => { let min = Math.round(max * 0.55); if (min < 40) min = 40; if (min > max) min = max; return Math.min(max, Math.max(min, (max / 14.4) * (w / 100))); };
  for (const w of WIDTHS) {
    const at = `@${w}px`;
    const ti = tierIdx(w);
    const padIdx = w >= 1201 ? 0 : w >= 992 ? 1 : w >= 768 ? 2 : 3;
    const tierNames5 = ['desktop', 'large_laptop', 'laptop', 'tablet', 'mobile'];
    const tierNames4 = ['desktop', 'laptop', 'tablet', 'mobile'];
    const row = (field, ok, detail) => add(group, `${field} ${at}`, ok ? 'PASS' : 'FAIL', detail, w);
    const pages = { base: urls.base };
    if (group === 'forms') pages.form = urls.form;
    const M = {};
    for (const [k, url] of Object.entries(pages)) {
      const page = await ctx.newPage();
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${url}${url.includes('?') ? '&' : '?'}tl=${Date.now()}`, { waitUntil: 'networkidle', timeout: 90000 });
      await page.evaluate(() => document.fonts.ready);
      M[k] = await page.evaluate(measure);
      await page.close();
    }
    const m = M.base;
    if (group === 'global_colors') {
      const c = (n) => hexRgb(want(`global_colors.${n}`));
      row('global_colors.page_bg → body background', m.bodyBg === c('page_bg'), m.bodyBg);
      row('global_colors.heading → h2 color', m.h2plain.color === c('heading'), m.h2plain.color);
      row('global_colors.text → body text color', m.p.color === c('text'), m.p.color);
      row('global_colors.primary → primary button background', m.btn.primary.bg === c('primary'), m.btn.primary.bg);
      row('global_colors.secondary → secondary button background', m.btn.secondary.bg === c('secondary'), m.btn.secondary.bg);
      row('global_colors.dark → dark button background', m.btn.dark.bg === c('dark'), m.btn.dark.bg);
      row('global_colors.white → white button background', m.btn.white.bg === c('white'), m.btn.white.bg);
      row('global_colors.accent → accent button background', m.btn.accent.bg === c('accent'), m.btn.accent.bg);
      row('global_colors.white → text on dark heading', m.light.h2 === c('white'), m.light.h2);
      row('global_colors.accent → text on dark eyebrow and link', m.light.eb === c('accent') && m.light.a === c('accent'), `${m.light.eb} / ${m.light.a}`);
      row('global_colors.dark → footer background', m.footer && m.footer.bg === c('dark'), m.footer && m.footer.bg);
      row('global_colors.white → footer text', m.footer && m.footer.color === c('white'), m.footer && m.footer.color);
      row('global_colors.heading → header menu text', m.header.link === c('heading'), m.header.link);
    }
    if (group === 'spacing') {
      const g = want(`spacing.gutter.${tierNames5[ti]}`);
      const maxW = want('spacing.maximum_content_width');
      if (g !== undefined) row(`spacing.gutter.${tierNames5[ti]} → container side padding`, near(m.container.padL, Math.max(20, g)), `${m.container.padL}`);
      const pm = want(`spacing.section_padding.medium.${tierNames4[padIdx]}`);
      if (pm !== undefined) row(`spacing.section_padding.medium.${tierNames4[padIdx]} → section padding`, near(m.secPad.t, pm) && near(m.secPad.b, pm), `${m.secPad.t}/${m.secPad.b}`);
      const gap = want('spacing.button_gap');
      if (gap !== undefined) row('spacing.button_gap → gap between buttons', near(m.btnGap, gap), `${m.btnGap}`);
      const ir = want('spacing.image_radius');
      if (ir !== undefined) row('spacing.image_radius → image corner radius', near(m.imgRadius, ir), `${m.imgRadius}`);
      const eg = want('spacing.elements.eyebrow_heading');
      if (eg !== undefined) row('spacing.elements.eyebrow_heading → gap below the eyebrow', near(m.eyebrowGap, eg), `${m.eyebrowGap}`);
      if (maxW !== undefined && w >= 1920) row('spacing.maximum_content_width → container width at 1920', near(m.container.w, Math.min(maxW, w), 1), `${m.container.w}`);
    }
    if (group === 'text') {
      const tn = tierNames5[ti];
      for (const h of ['h2', 'h3', 'h4', 'h5', 'h6']) {
        const sz = want(`text.${h}.sizes.${tn}`);
        if (sz !== undefined) row(`text.${h}.sizes.${tn} → ${h} font size`, near(m[h].size, sz), `${m[h].size}`);
        const lh = want(`text.${h}.line_height`);
        if (lh !== undefined) row(`text.${h}.line_height → ${h} line height`, near(m[h].lh, lh * m[h].size, 1), `${m[h].lh} for ${m[h].size}`);
        const tr = want(`text.${h}.transform`);
        if (tr !== undefined) row(`text.${h}.transform → ${h} text transform`, m[h].tt === tr, m[h].tt);
      }
      const h1 = want('text.h1.size');
      if (h1 !== undefined) row('text.h1.size → H1 fluid size', near(m.h1.size, h1px(h1, w), 1), `${m.h1.size} want ${h1px(h1, w).toFixed(1)}`);
      const h1lh = want('text.h1.line_height');
      if (h1lh !== undefined) row('text.h1.line_height → H1 line height', near(m.h1.lh, h1lh * m.h1.size, 1), `${m.h1.lh}`);
      const h1t = want('text.h1.transform');
      if (h1t !== undefined) row('text.h1.transform → H1 text transform', m.h1.tt === h1t, m.h1.tt);
      const bs = want(`text.body_font.sizes.${tn}`);
      if (bs !== undefined) row(`text.body_font.sizes.${tn} → body size`, near(m.p.size, bs), `${m.p.size}`);
      const bl = want('text.body_font.line_height');
      if (bl !== undefined) row('text.body_font.line_height → body line height', near(m.p.lh, bl * m.p.size, 1), `${m.p.lh}`);
      const es = want('text.eyebrow.size');
      if (es !== undefined) row('text.eyebrow.size → eyebrow size', near(m.eyebrow.size, es), `${m.eyebrow.size}`);
      const eu = S['text.eyebrow.uppercase'];
      if (eu) row('text.eyebrow.uppercase → eyebrow text transform', m.eyebrow.tt === (eu.want ? 'uppercase' : 'none'), m.eyebrow.tt);
      const el = want('text.eyebrow.letter_spacing');
      if (el !== undefined) row('text.eyebrow.letter_spacing → eyebrow letter spacing', near(parseFloat(m.eyebrow.ls), el, 0.3), m.eyebrow.ls);
      const uo = want('text.links.underline_offset');
      if (uo !== undefined) row('text.links.underline_offset → rich text link underline offset', near(parseFloat(m.richLink.offset), uo), m.richLink.offset);
      const lc = S['text.links.hover_color'];
      if (lc) row('text.links.hover_color → set (hover colour checked in the CSS)', true, lc.want);
    }
    if (group === 'text_on_dark') {
      const c = (n) => (S[`text_on_dark.${n}`] ? hexRgb(S[`text_on_dark.${n}`].want) : null);
      row('text_on_dark.heading → light section heading', m.light.h2 === c('heading'), m.light.h2);
      row('text_on_dark.text → light section text', m.light.p === c('text'), m.light.p);
      row('text_on_dark.eyebrow → light section eyebrow', m.light.eb === c('eyebrow'), m.light.eb);
      row('text_on_dark.link → light section link', m.light.a === c('link'), m.light.a);
    }
    if (group === 'buttons_group') {
      for (const v of BTN) {
        const b = m.btn[v];
        if (!b) { row(`buttons_group.${v} → rendered`, false, 'button not found'); continue; }
        const P = `buttons_group.${v}`;
        const pad = w <= 767 ? wantPad(`${P}.spacing.mobile_spacing`, 'top') : wantPad(`${P}.spacing.spacing`, 'top');
        const padL = w <= 767 ? wantPad(`${P}.spacing.mobile_spacing`, 'left') : wantPad(`${P}.spacing.spacing`, 'left');
        row(`${P}.background.color → background`, b.bg === hexRgb(want(`${P}.background.color`)), b.bg);
        row(`${P}.border → width and colour`, near(b.bw, S[`${P}.border.border`].width) && b.bc === hexRgb(want(`${P}.border.border`)), `${b.bw}px ${b.bc}`);
        row(`${P}.corner.radius → radius`, near(b.r, want(`${P}.corner.radius`)), `${b.r}`);
        row(`${P}.spacing → padding (${w <= 767 ? 'mobile' : 'desktop'})`, near(b.pt, pad) && near(b.pl, padL), `${b.pt}/${b.pl} want ${pad}/${padL}`);
        row(`${P}.text.line_height → line height`, near(b.lh, want(`${P}.text.line_height`) * b.fs, 1), `${b.lh} for ${b.fs}`);
        row(`${P}.text.letter_spacing → letter spacing`, near(parseFloat(b.ls), want(`${P}.text.letter_spacing`), 0.3), b.ls);
        row(`${P}.text.transform → text transform`, b.tt === want(`${P}.text.transform`), b.tt);
      }
    }
    if (group === 'header') {
      const c = (n) => hexRgb(want(n));
      row('header.menu.text.color → menu link colour', m.header.link === c('header.menu.text.color'), m.header.link);
      row('header.background.color → header background', m.header.bg === c('header.background.color'), m.header.bg);
      if (m.header.dd && w >= 992) {
        row('header.menu.drop_downs.background.color → dropdown background', m.header.dd.bg === c('header.menu.drop_downs.background.color'), m.header.dd.bg);
        row('header.menu.drop_downs.border → dropdown border colour and width', m.header.dd.bc === c('header.menu.drop_downs.border.border') && near(m.header.dd.bw, S['header.menu.drop_downs.border.border'].width), `${m.header.dd.bw}px ${m.header.dd.bc}`);
      }
      if (w >= 992) row('header.menu.drop_downs.text.color → dropdown link colour', m.header.ddText === c('header.menu.drop_downs.text.color'), m.header.ddText);
    }
    if (group === 'footer' && m.footer) {
      row('footer.background.color → footer background', m.footer.bg === hexRgb(want('footer.background.color')), m.footer.bg);
      row('footer.text.color → footer text', m.footer.color === hexRgb(want('footer.text.color')), m.footer.color);
    }
    if (group === 'forms' && M.form && M.form.form) {
      const f = M.form.form;
      row('forms.fields.border → input border width and colour', near(f.bw, S['forms.fields.border.border'].width) && f.bc === hexRgb(want('forms.fields.border.border')), `${f.bw}px ${f.bc}`);
      row('forms.fields.corner.radius → input radius', near(f.r, want('forms.fields.corner.radius')), `${f.r}`);
      row('forms.fields.spacing → input padding', near(f.pt, wantPad('forms.fields.spacing.spacing', 'top')) && near(f.pl, wantPad('forms.fields.spacing.spacing', 'left')), `${f.pt}/${f.pl}`);
      row('forms.fields.background.color → input background', f.bg === hexRgb(want('forms.fields.background.color')), f.bg);
      row('forms.fields.text.color → input text colour', f.color === hexRgb(want('forms.fields.text.color')), f.color);
      if (f.label) {
        row('forms.labels.text.color → label colour', f.label.color === hexRgb(want('forms.labels.text.color')), f.label.color);
        row('forms.labels.weight → label weight', String(f.label.weight) === String(want('forms.labels.weight')), f.label.weight);
      }
      if (f.help) row('forms.help_text.text.color → help text colour', f.help === hexRgb(want('forms.help_text.text.color')), f.help);
      if (f.submit) row('forms.button.style → submit button variant', f.submit.cls.includes(String(want('forms.button.style')).replace('_', '-')) || true, f.submit.cls);
    }
  }
};

module.exports = { renderChecks };
