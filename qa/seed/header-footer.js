const MENU_ID = 432623624931;
const link = (href, type = 'EXTERNAL', extra = {}) => ({ url: { type, href, content_id: null }, open_in_new_tab: false, no_follow: false, ...extra });
const mod = (name, label, params) => ({ kind: 'module', label, params: { path: `/custom-boilerplate/modules/${name}`, type: 'module', schema_version: 2, ...params } });

const buildHeaderFooter = (images) => {
  const logo = (alt) => ({ image: { src: images.featured.url, alt, width: images.featured.width, height: images.featured.height }, link: link('https://example.com/') });
  const cta = (style, text = 'QA button', href = 'https://example.com/go') => ({ type: 'link', text, style, link: link(href) });
  return [
    mod('header', 'Header', { logo: logo('QA logo'), menu: MENU_ID, menu_type: 'mega', mega_columns: '5', cta: cta('secondary-outline'), style: { border: false, sticky: false } }),
    mod('header', 'Header', { logo: logo('QA logo'), menu: MENU_ID, menu_type: 'simple', mega_columns: '4', cta: cta('accent', ''), style: { border: true, sticky: true } }),
    mod('header', 'Header', { logo: { image: { src: '', alt: '' }, link: link('') }, menu: MENU_ID, menu_type: 'simple', cta: cta('primary', 'No URL', ''), style: { border: false, sticky: false } }),
    mod('header-simple', 'Header – Simple', { logo: logo(''), cta: cta('dark'), style: { border: true, sticky: false } }),
    mod('header-simple', 'Header – Simple', { logo: { image: { src: '', alt: '' }, link: link('') }, cta: cta('primary', ''), style: { border: false, sticky: true } }),
    mod('footer', 'Footer', {
      logo: logo('QA footer logo'),
      description: '<p>QA footer description with a <a href="https://example.com/">link</a>.</p>',
      heading_tag: 'h3',
      columns: [
        { heading: 'QA column one', links: [{ text: 'Link A', link: link('https://example.com/a') }, { text: 'Link B', link: link('https://example.com/b', 'EXTERNAL', { open_in_new_tab: true }) }, { text: 'No URL', link: link('') }] },
        { heading: '', links: [{ text: 'Headless link', link: link('https://example.com/c') }] },
        { heading: 'QA column three', links: [{ text: 'Link D', link: link('https://example.com/d') }] },
        { heading: 'QA column four', links: [{ text: 'Link E', link: link('https://example.com/e') }] },
      ],
      contact: { heading: 'QA contact', items: [{ type: 'email', text: 'qa@example.com', link: link('qa@example.com', 'EMAIL_ADDRESS') }, { type: 'phone', text: '+1 555 0100', link: link('+15550100100', 'PHONE') }, { type: 'address', text: '1 QA Street', link: link('') }] },
      social: { heading: 'QA follow', items: ['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'tiktok', 'other'].map((platform) => ({ platform, link: link(`https://example.com/${platform}`) })) },
      bottom: { copyright: 'QA company', show_year: true, legal_links: [{ text: 'Privacy', link: link('https://example.com/privacy') }, { text: 'Terms', link: link('https://example.com/terms') }] },
      style: { spacing: { change_spacing: true, desktop: { padding: { top: { value: 60, units: 'px' }, bottom: { value: 20, units: 'px' } } }, mobile: { padding: { top: { value: 30, units: 'px' }, bottom: { value: 10, units: 'px' } } } } },
    }),
    mod('footer', 'Footer', {
      logo: { image: { src: '', alt: '' }, link: link('') }, description: '', heading_tag: 'p', columns: [], contact: { heading: '', items: [] }, social: { heading: '', items: [] },
      bottom: { copyright: 'QA minimal', show_year: false, legal_links: [] }, style: { spacing: { change_spacing: false } },
    }),
  ];
};

module.exports = { buildHeaderFooter };
