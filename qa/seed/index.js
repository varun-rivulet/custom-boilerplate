const fs = require('fs');
const path = require('path');
const { autoName, qaName, THEME_FOLDER, FILE_FOLDER, SLUG_PREFIX, REFERENCE_PAGE_SLUG, CACHE_DIR } = require('../config');
const { generateImages } = require('../lib/images');
const { buildSections, LIST_UL, LIST_OL } = require('./sections');
const { extractSample, buildLayout } = require('./layout');

const headHtml = (build) => `<meta name="robots" content="noindex, nofollow">\n<meta name="qa-build" content="${build}">`;

const FORM_SPEC = (name) => ({
  name,
  formType: 'hubspot',
  createdAt: new Date().toISOString(),
  archived: false,
  fieldGroups: [
    { groupType: 'default_group', richTextType: 'text', fields: [
      { objectTypeId: '0-1', name: 'firstname', label: 'First name', required: true, hidden: false, fieldType: 'single_line_text', description: 'Help text: your given name.' },
      { objectTypeId: '0-1', name: 'lastname', label: 'Last name', required: false, hidden: false, fieldType: 'single_line_text' },
    ] },
    { groupType: 'default_group', richTextType: 'text', fields: [
      { objectTypeId: '0-1', name: 'email', label: 'Email', required: true, hidden: false, fieldType: 'email', validation: { blockedEmailDomains: [], useDefaultBlockList: false } },
    ] },
    { groupType: 'default_group', richTextType: 'text', fields: [
      { objectTypeId: '0-1', name: 'hs_lead_status', label: 'Status (dropdown)', required: false, hidden: false, fieldType: 'dropdown', options: [
        { label: 'New', value: 'NEW', displayOrder: 0, description: '' },
        { label: 'Open', value: 'OPEN', displayOrder: 1, description: '' },
      ] },
    ] },
    { groupType: 'default_group', richTextType: 'text', fields: [
      { objectTypeId: '0-1', name: 'message', label: 'Message', required: false, hidden: false, fieldType: 'multi_line_text' },
    ] },
  ],
  configuration: {
    language: 'en', cloneable: true, editable: true, archivable: true, recaptchaEnabled: false, notifyContactOwner: false, notifyRecipients: [],
    createNewContactForNewEmail: false, prePopulateKnownValues: false, allowLinkToResetKnownValues: false, lifecycleStages: [],
    postSubmitAction: { type: 'thank_you', value: 'QA form submitted.' },
  },
  displayOptions: { renderRawHtml: false, theme: 'default_style', submitButtonText: 'Submit', style: {} },
  legalConsentOptions: { type: 'implicit_consent_to_process', communicationConsentText: '', privacyText: 'QA consent text: we process your data to answer your request.', consentToProcessText: 'By submitting, you agree to the QA privacy text.' },
});

const formWidget = (formId) => ({
  kind: 'form',
  label: 'Form',
  params: { path: '@hubspot/form', type: 'module', schema_version: 2, form: { form_id: formId, response_type: 'inline', message: 'QA form submitted.' }, title: 'QA form title' },
});

const loadSample = async (hs, log) => {
  const cacheFile = path.join(CACHE_DIR, 'layout-sample.json');
  try {
    const reference = await hs.findPageBySlug('site-pages', REFERENCE_PAGE_SLUG);
    if (reference) {
      const sample = extractSample(await hs.getPage('site-pages', reference.id));
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      fs.writeFileSync(cacheFile, JSON.stringify(sample, null, 2));
      return sample;
    }
  } catch (err) {
    log(`reference page not usable (${err.message}); using cached layout sample`);
  }
  if (fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  throw new Error(`No layout sample: /${REFERENCE_PAGE_SLUG} (read-only reference) not found and no cache.`);
};

const PAGE_DEFS = [
  { kind: 'site-pages', name: autoName('Base Module'), slug: `${SLUG_PREFIX}base-module`, template: 'page.html' },
  { kind: 'site-pages', name: autoName('Form'), slug: `${SLUG_PREFIX}form`, template: 'page.html' },
  { kind: 'landing-pages', name: autoName('Landing'), slug: `${SLUG_PREFIX}landing-page`, template: 'landing-page.html' },
];
const POST_NAMES = [1, 2, 3].map((i) => autoName(`Post ${i}`));

const seed = async (hs, writer, { build, log }) => {
  const result = { pages: [], posts: [], blocked: [], images: {} };

  const images = await generateImages(path.join(CACHE_DIR, 'images'));
  for (const img of images) {
    result.images[img.key] = await writer.uploadFile(img.localPath, autoName(img.label), FILE_FOLDER);
    if (!result.images[img.key].width) result.images[img.key] = { ...result.images[img.key], width: img.width, height: img.height };
  }

  const sample = await loadSample(hs, log);
  const sections = buildSections(result.images);
  result.sections = sections.map(({ key, title, expect }) => ({ key, title, expect }));
  const widgets = {
    [PAGE_DEFS[0].name]: sections.map((s) => ({ kind: 'base', params: s.params })),
    [PAGE_DEFS[2].name]: [{ kind: 'base', params: sections.find((x) => x.key === 'page-h1').params }, { kind: 'base', params: sections[1].params }],
  };

  try {
    const form = await writer.upsertForm(FORM_SPEC(autoName('Form')));
    result.formId = form.id;
    widgets[PAGE_DEFS[1].name] = [{ kind: 'base', params: sections.find((x) => x.key === 'page-h1').params }, formWidget(form.id)];
  } catch (err) {
    result.blocked.push({ what: 'form', reason: err.message });
  }

  for (const def of PAGE_DEFS) {
    if (!widgets[def.name]) continue;
    const body = {
      name: def.name,
      htmlTitle: def.name,
      slug: def.slug,
      templatePath: `${THEME_FOLDER}/templates/${def.template}`,
      headHtml: headHtml(build),
      metaDescription: 'QA test page. Not for visitors.',
      layoutSections: buildLayout(sample, widgets[def.name]),
    };
    try {
      const page = await writer.upsertPage(def.kind, body);
      result.pages.push({ kind: def.kind, key: `${def.kind}:${def.name}`, id: page.id, name: def.name, slug: def.slug });
    } catch (err) {
      if (err.name === 'GuardError' || /Write guard/.test(err.message)) throw err;
      result.blocked.push({ what: def.name, reason: err.message });
    }
  }

  const blogs = await hs.listBlogs();
  const blog = blogs.find((b) => b.name === qaName('Blog'));
  if (!blog) {
    result.blocked.push({ what: 'blog posts', reason: `No blog named "${qaName('Blog')}" (setup step: create it with the custom-boilerplate templates).` });
  } else {
    result.blog = { id: blog.id, name: blog.name, slug: blog.slug, absoluteUrl: blog.absoluteUrl };
    const author = await writer.upsertAuthor({ fullName: autoName('Author'), displayName: autoName('Author'), slug: 'qa-auto-author', bio: 'QA test author.', language: 'en' });
    for (const [i, name] of POST_NAMES.entries()) {
      const body = {
        name,
        htmlTitle: name,
        contentGroupId: String(blog.id),
        blogAuthorId: String(author.id),
        slug: `${blog.slug ? `${blog.slug}/` : ''}${SLUG_PREFIX}post-${i + 1}`,
        headHtml: headHtml(build),
        metaDescription: 'QA test post. Not for visitors.',
        useFeaturedImage: true,
        featuredImage: result.images.featured.url,
        featuredImageAltText: `QA featured image ${i + 1}`,
        postBody: `<p>QA post ${i + 1} body with a <a href="https://example.com/">link</a>.</p><h2>Lists</h2>${LIST_UL}${LIST_OL}`,
      };
      try {
        const post = await writer.upsertPost(body);
        result.posts.push({ key: `post:${name}`, id: post.id, name });
      } catch (err) {
        if (/Write guard/.test(err.message)) throw err;
        result.blocked.push({ what: name, reason: err.message });
      }
    }
  }
  return result;
};

const republish = async (hs, writer, seeded, { log }) => {
  for (const p of seeded.pages) await writer.publishPage(p.kind, p.key);
  for (const p of seeded.posts) await writer.publishPost(p.key);
  if (writer.dryRun) return;
  await new Promise((r) => setTimeout(r, 5000));
  for (const p of seeded.pages) {
    const fresh = await hs.getPage(p.kind, p.id);
    p.url = fresh.url || null;
    p.state = fresh.currentState;
  }
  for (const p of seeded.posts) {
    const fresh = await hs.getPost(p.id);
    p.url = fresh.url || null;
    p.state = fresh.currentState;
  }
  log(`published ${seeded.pages.length} pages, ${seeded.posts.length} posts`);
};

module.exports = { seed, republish };
