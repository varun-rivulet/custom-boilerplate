const fs = require('fs');
const path = require('path');
const { qaName, THEME_FOLDER, FILE_FOLDER, SLUG_PREFIX, USER_TEST_PAGE_SLUG, CACHE_DIR } = require('../config');
const { generateImages } = require('../lib/images');
const { buildSections } = require('./sections');
const { extractSample, buildLayout } = require('./layout');

const headHtml = (build) => `<meta name="robots" content="noindex, nofollow">\n<meta name="qa-build" content="${build}">`;

const FORM_SPEC = (name) => ({
  name,
  formType: 'hubspot',
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
  params: { path: '@hubspot/form', module_id: 1155639, form: { form_id: formId, response_type: 'inline', message: 'QA form submitted.' }, title: 'QA form title' },
});

const seed = async (hs, { build, log }) => {
  const result = { pages: [], posts: [], blocked: [], images: {} };

  const images = await generateImages(path.join(CACHE_DIR, 'images'));
  for (const img of images) {
    const up = await hs.uploadFile(img.localPath, qaName(img.label), FILE_FOLDER);
    result.images[img.key] = { url: up.url, width: up.width || img.width, height: up.height || img.height };
  }
  log(`images uploaded to ${FILE_FOLDER}: ${images.length}`);

  const reference = await hs.findPageBySlug('site-pages', USER_TEST_PAGE_SLUG);
  if (!reference) throw new Error(`Reference page /${USER_TEST_PAGE_SLUG} not found; it is read (never changed) to copy HubSpot's Base Module layout format.`);
  const sample = extractSample(await hs.getPage('site-pages', reference.id));
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CACHE_DIR, 'layout-sample.json'), JSON.stringify(sample, null, 2));

  const sections = buildSections(result.images);
  result.sections = sections.map(({ key, title, expect }) => ({ key, title, expect }));
  const pageSpecs = [
    { kind: 'site-pages', name: qaName('Base Module'), slug: `${SLUG_PREFIX}base-module`, template: 'page.html', widgets: sections.map((s) => ({ kind: 'base', params: s.params })) },
  ];

  try {
    const form = await hs.upsertForm(FORM_SPEC(qaName('Form')));
    result.formId = form.id;
    pageSpecs.push({ kind: 'site-pages', name: qaName('Form'), slug: `${SLUG_PREFIX}form`, template: 'page.html', widgets: [formWidget(form.id)] });
  } catch (err) {
    result.blocked.push({ what: 'form', reason: err.message });
  }

  pageSpecs.push({ kind: 'landing-pages', name: qaName('Landing'), slug: `${SLUG_PREFIX}landing`, template: 'landing-page.html', widgets: [{ kind: 'base', params: sections[1].params }] });

  for (const spec of pageSpecs) {
    const body = {
      name: spec.name,
      htmlTitle: spec.name,
      slug: spec.slug,
      templatePath: `${THEME_FOLDER}/templates/${spec.template}`,
      headHtml: headHtml(build),
      metaDescription: 'QA test page. Not for visitors.',
      layoutSections: buildLayout(sample, spec.widgets),
    };
    try {
      const page = await hs.upsertPage(spec.kind, body);
      result.pages.push({ kind: spec.kind, id: page.id, name: spec.name, slug: spec.slug });
      log(`page upserted: ${spec.name}`);
    } catch (err) {
      result.blocked.push({ what: spec.name, reason: err.message });
    }
  }

  const blogs = await hs.listBlogs();
  const blog = blogs.find((b) => b.name === qaName('Blog'));
  if (!blog) {
    result.blocked.push({ what: 'blog posts', reason: `No blog named "${qaName('Blog')}" (manual step: create it with the custom-boilerplate templates).` });
  } else {
    result.blog = { id: blog.id, name: blog.name, slug: blog.slug, absoluteUrl: blog.absoluteUrl };
    for (let i = 1; i <= 3; i++) {
      const name = qaName(`Post ${i}`);
      const body = {
        name,
        htmlTitle: name,
        contentGroupId: String(blog.id),
        slug: `${blog.slug ? `${blog.slug}/` : ''}${SLUG_PREFIX}post-${i}`,
        headHtml: headHtml(build),
        metaDescription: 'QA test post. Not for visitors.',
        useFeaturedImage: true,
        featuredImage: result.images.featured.url,
        featuredImageAltText: `QA featured image ${i}`,
        postBody: `<p>QA post ${i} body with a <a href="https://example.com/">link</a>.</p><h2>Lists</h2>${require('./sections').LIST_UL}${require('./sections').LIST_OL}`,
      };
      try {
        const post = await hs.upsertPost(body);
        result.posts.push({ id: post.id, name });
      } catch (err) {
        result.blocked.push({ what: name, reason: err.message });
      }
    }
    log(`blog posts upserted: ${result.posts.length}`);
  }
  return result;
};

const republish = async (hs, seeded, { log }) => {
  for (const p of seeded.pages) {
    await hs.publishPage(p.kind, p.id);
    log(`published: ${p.name}`);
  }
  for (const p of seeded.posts) {
    await hs.publishPost(p.id);
    log(`published: ${p.name}`);
  }
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
};

module.exports = { seed, republish };
