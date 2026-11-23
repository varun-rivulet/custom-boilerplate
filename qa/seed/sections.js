const LIST_UL = '<ul><li>item</li><li>item</li><li>item</li><li><ul><li>item</li><li>item</li><li>item</li><li><p>this is p in <strong>li</strong></p></li></ul></li></ul>';
const LIST_OL = LIST_UL.replace(/<(\/?)ul>/g, '<$1ol>');
const LIST_DEEP = '<ul><li>level 1<ul><li>level 2<ul><li>level 3</li></ul></li></ul></li></ul><ol><li>level 1<ol><li>level 2<ol><li>level 3</li></ol></li></ol></li></ol>';

const BUTTON_STYLES = ['primary', 'secondary', 'dark', 'white', 'accent', 'primary-outline', 'secondary-outline', 'white-outline', 'dark-outline', 'text-link'];

const link = (href, type = 'EXTERNAL', extra = {}) => ({ url: { type, href, content_id: null }, open_in_new_tab: false, no_follow: false, ...extra });
const allButtons = () => BUTTON_STYLES.map((style) => ({ text: style, style, link: link('https://example.com/') }));
const color = (hex, opacity = 100) => ({ color: hex, opacity });
const spacing = (top, right, bottom, left) => {
  const padding = {};
  [['top', top], ['right', right], ['bottom', bottom], ['left', left]].forEach(([k, v]) => { padding[k] = { value: v === undefined ? null : v, units: 'px' }; });
  return { padding };
};

const section = (key, title, opts = {}) => ({
  key,
  title,
  expect: opts.expect || {},
  params: {
    eyebrow: opts.eyebrow === undefined ? `QA ${key}` : opts.eyebrow,
    heading: opts.heading === undefined ? `<h2>${title}</h2>` : opts.heading,
    description: opts.description !== undefined ? opts.description : '<p>Body text with a <a href="https://example.com/">text link</a> for colour checks.</p>',
    image: opts.image || { src: '', alt: '' },
    buttons: opts.buttons || [{ text: 'Primary', style: 'primary', link: link('https://example.com/') }],
    advanced: { section_id: `qa-${key}`, custom_class: '', hide_desktop: false, hide_tablet: false, hide_mobile: false, show_section: true, ...(opts.advancedOverride || {}) },
    style: {
      background: { type: null, text_color: 'auto', position: 'center', gradient_direction: 'right', ...(opts.background || {}) },
      spacing: { change_spacing: false, ...(opts.spacing || {}) },
      content_align: { text_align_desktop: 'left', text_align_mobile: 'inherit', custom_width: false, width: 860, block_position: 'center', ...(opts.align || {}) },
    },
  },
});

const buildSections = (images) => {
  const img = (k) => ({ src: images[k].url, alt: `QA ${k} image`, width: images[k].width, height: images[k].height });
  return [
    section('h1-heading', 'H1 in the rich text heading', { heading: '<h1>QA heading set as H1</h1>', description: '<h2>QA H2</h2><h3>QA H3</h3><h4>QA H4</h4><h5>QA H5</h5><h6>QA H6</h6><p>QA body text paragraph.</p>', expect: { text: 'dark', h1: true, type: true } }),
    section('plain', 'Plain section, all buttons', { buttons: allButtons(), expect: { text: 'dark', buttons: true } }),
    section('light-color', 'Light colour background', { background: { type: 'color', color: color('#DBEAFE') }, expect: { text: 'dark', bg: '#DBEAFE' } }),
    section('dark-color', 'Dark colour background #7d53e9, all buttons', { background: { type: 'color', color: color('#7d53e9') }, buttons: allButtons(), expect: { text: 'light', bg: '#7D53E9', buttons: true } }),
    section('dark-10', 'Dark colour at 10% opacity', { background: { type: 'color', color: color('#0B1F3A', 10) }, expect: { text: 'dark', rgba: 'rgba(11,31,58,0.1)' } }),
    section('auto-primary', 'Auto on #3B82F6', { background: { type: 'color', color: color('#3B82F6') }, expect: { text: 'dark' } }),
    section('auto-secondary', 'Auto on #334155', { background: { type: 'color', color: color('#334155') }, expect: { text: 'light' } }),
    section('auto-muted', 'Auto on #64748B', { background: { type: 'color', color: color('#64748B') }, expect: { text: 'light' } }),
    section('auto-accent', 'Auto on #F59E0B', { background: { type: 'color', color: color('#F59E0B') }, expect: { text: 'dark' } }),
    section('picker-default', 'Colour type, picker untouched', { background: { type: 'color' }, expect: { text: 'light', bg: '#0B1F3A' } }),
    section('image-top', 'Image background, position top', { background: { type: 'image', image: img('background'), position: 'top', overlay_color: color('#0B1F3A', 50) }, expect: { image: true, position: 'top', overlay: 0.5 } }),
    section('image-center', 'Image background, position center', { background: { type: 'image', image: img('background'), position: 'center', overlay_color: color('#0B1F3A', 50) }, expect: { image: true, position: 'center', overlay: 0.5 } }),
    section('image-bottom', 'Image background, position bottom', { background: { type: 'image', image: img('background'), position: 'bottom', overlay_color: color('#0B1F3A', 50) }, expect: { image: true, position: 'bottom', overlay: 0.5 } }),
    section('image-empty', 'Image type, no image chosen', { background: { type: 'image', image: { src: '', alt: '' } }, expect: { text: 'dark', noBgImage: true } }),
    section('gradient-dark', 'Gradient #334155 to #0B1F3A', { background: { type: 'gradient', gradient_start: color('#334155'), gradient_end: color('#0B1F3A'), gradient_direction: 'right' }, expect: { text: 'light', gradient: true } }),
    section('gradient-mixed', 'Gradient #DBEAFE to #0B1F3A (mixed)', { background: { type: 'gradient', gradient_start: color('#DBEAFE'), gradient_end: color('#0B1F3A'), gradient_direction: 'right' }, expect: { text: 'dark', gradient: true } }),
    section('light-forced', 'Text color Light on a light background, all buttons', { background: { text_color: 'light' }, buttons: allButtons(), expect: { text: 'light', buttons: true } }),
    section('spacing-a', 'Custom spacing A', {
      spacing: { change_spacing: true, desktop: spacing(111, 0, 99, 0), laptop: spacing(77, 0, 66, 0), tablet: spacing(null, 0, 44, 0), mobile: spacing(22, 0, 11, 0) },
      expect: { padding: { 1440: [111, 99], 1366: [111, 99], 1200: [77, 66], 991: [77, 44], 767: [22, 11], 360: [22, 11] } },
    }),
    section('spacing-b', 'Custom spacing B', {
      spacing: { change_spacing: true, desktop: spacing(33, 0, 33, 0), laptop: spacing(33, 0, 33, 0), tablet: spacing(33, 0, 33, 0), mobile: spacing(33, 0, 33, 0) },
      expect: { padding: { 1440: [33, 33], 991: [33, 33], 360: [33, 33] } },
    }),
    section('width-left', 'Content width 600, left', { align: { custom_width: true, width: 600, block_position: 'left' }, expect: { width: 600, position: 'left' } }),
    section('width-center', 'Content width 600, center', { align: { custom_width: true, width: 600, block_position: 'center' }, expect: { width: 600, position: 'center' } }),
    section('width-right', 'Content width 600, right', { align: { custom_width: true, width: 600, block_position: 'right' }, expect: { width: 600, position: 'right' } }),
    section('links', 'Link types', {
      buttons: [
        { text: 'Email', style: 'primary', link: link('qa@example.com', 'EMAIL_ADDRESS') },
        { text: 'Phone', style: 'secondary', link: link('+15550100100', 'PHONE') },
        { text: 'External', style: 'dark', link: link('https://example.com/', 'EXTERNAL', { open_in_new_tab: true, no_follow: true }) },
      ],
      expect: { links: true },
    }),
    section('lists-left', 'Lists, left aligned', { description: LIST_UL + LIST_OL + LIST_DEEP, expect: { lists: 'left' } }),
    section('lists-center', 'Lists, center aligned', { description: LIST_UL + LIST_OL, align: { text_align_desktop: 'center' }, expect: { lists: 'center' } }),
    section('page-h1', 'QA page title (H1)', { heading: '<h1>QA page title</h1>', buttons: [], expect: { text: 'dark' } }),
    section('hd-h3', 'Heading as H3', { heading: '<h3>QA heading set as H3</h3>' }),
    section('hd-h4', 'Heading as H4', { heading: '<h4>QA heading set as H4</h4>' }),
    section('hd-h5', 'Heading as H5', { heading: '<h5>QA heading set as H5</h5>' }),
    section('hd-h6', 'Heading as H6', { heading: '<h6>QA heading set as H6</h6>' }),
    section('hd-p', 'Heading as paragraph', { heading: '<p>QA heading set as paragraph</p>' }),
    section('hide-desktop', 'Hidden on desktop', { advancedOverride: { hide_desktop: true } }),
    section('hide-tablet', 'Hidden on tablet', { advancedOverride: { hide_tablet: true } }),
    section('hide-mobile', 'Hidden on mobile', { advancedOverride: { hide_mobile: true } }),
    section('custom-class', 'Custom class', { advancedOverride: { custom_class: ' qa-custom one-more ' } }),
    section('not-shown', 'Show section off', { advancedOverride: { show_section: false } }),
    section('align-right', 'Align right, mobile center', { align: { text_align_desktop: 'right', text_align_mobile: 'center' }, buttons: allButtons().slice(0, 3) }),
    section('align-center-mobile-left', 'Align center, mobile left', { align: { text_align_desktop: 'center', text_align_mobile: 'left' }, buttons: allButtons().slice(0, 3) }),
    section('empty-bits', 'Only heading, buttons without URL or text', { eyebrow: '', description: '', buttons: [{ text: 'No URL', style: 'primary', link: link('') }, { text: '', style: 'primary', link: link('https://example.com/') }] }),
    section('only-buttons', 'Only buttons', { eyebrow: '', heading: '', description: '', buttons: allButtons().slice(0, 2) }),
    section('with-image', 'Image with alt', { image: img('wide'), expect: {} }),
    section('wide-image', 'Wide image (4000px) resize', { image: img('wide'), expect: { resize: 2640 } }),
  ];
};

module.exports = { buildSections, BUTTON_STYLES, LIST_UL, LIST_OL };
