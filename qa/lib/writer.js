const fs = require('fs');
const path = require('path');
const { PORTAL_ID, STATE_FILE } = require('../config');
const { assertAutoName, assertAutoSlug, assertQaFolder, GuardError } = require('./guard');

const loadState = () => {
  const all = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : {};
  return all;
};

const saveState = (all) => {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(all, null, 2));
};

const hasPortalState = () => {
  const all = loadState();
  return Boolean(all[PORTAL_ID] && all[PORTAL_ID].confirmed);
};

const createWriter = (hs, { dryRun = false, log = () => {} } = {}) => {
  const all = loadState();
  const state = all[PORTAL_ID] || (all[PORTAL_ID] = { confirmed: false, objects: {} });
  const plan = [];
  let fakeId = 0;

  const record = (op, key, detail) => { plan.push({ op, key, detail }); log(`${dryRun ? '[dry-run] ' : ''}${op} ${key}${detail ? ` (${detail})` : ''}`); };
  const idFor = (key) => (state.objects[key] && state.objects[key].id) || null;
  const owned = (key, id) => {
    const entry = state.objects[key];
    if (!entry || String(entry.id) !== String(id)) throw new GuardError(`Write guard: ${key} id ${id} is not in ${path.basename(STATE_FILE)}; it was not created by the harness.`);
  };
  const remember = (key, type, obj) => {
    if (dryRun) return;
    state.objects[key] = { type, id: String(obj.id), name: obj.name, createdAt: new Date().toISOString() };
    saveState(all);
  };
  const fake = (extra = {}) => ({ id: `dry-run-${++fakeId}`, ...extra });

  const pagePath = (kind) => `/cms/v3/pages/${kind}`;

  const upsertPage = async (kind, body) => {
    assertAutoName(body.name, 'page');
    assertAutoSlug(body.slug, 'page');
    const key = `${kind}:${body.name}`;
    const id = idFor(key);
    if (!id) {
      record('CREATE page', key, `slug ${body.slug}`);
      if (dryRun) return fake({ name: body.name });
      const created = await hs.request('POST', pagePath(kind), body);
      remember(key, kind, created);
      return created;
    }
    const current = await hs.getPage(kind, id);
    owned(key, current.id);
    assertAutoName(current.name, 'existing page');
    assertAutoSlug(current.slug, 'existing page');
    record('UPDATE page draft', key, `id ${id}`);
    if (!dryRun) await hs.request('PATCH', `${pagePath(kind)}/${id}/draft`, body);
    return { ...current, id };
  };

  const publishPage = async (kind, key) => {
    const id = idFor(key);
    if (!id) { record('PUBLISH page', key, 'new page'); return; }
    const current = await hs.getPage(kind, id);
    owned(key, current.id);
    assertAutoName(current.name, 'page');
    assertAutoSlug(current.slug, 'page');
    record('PUBLISH page', key, `id ${id}`);
    if (dryRun) return;
    if (String(current.currentState || '').startsWith('PUBLISHED')) await hs.request('POST', `${pagePath(kind)}/${id}/draft/push-live`);
    else await hs.request('POST', `${pagePath(kind)}/schedule`, { id: String(id), publishDate: new Date(Date.now() + 3000).toISOString() });
  };

  const upsertPost = async (body) => {
    assertAutoName(body.name, 'blog post');
    assertAutoSlug(body.slug, 'blog post');
    const key = `post:${body.name}`;
    const id = idFor(key);
    if (!id) {
      record('CREATE blog post', key, `slug ${body.slug}`);
      if (dryRun) return fake({ name: body.name });
      const created = await hs.request('POST', '/cms/v3/blogs/posts', body);
      remember(key, 'post', created);
      return created;
    }
    const current = await hs.getPost(id);
    owned(key, current.id);
    assertAutoName(current.name, 'existing blog post');
    record('UPDATE blog post draft', key, `id ${id}`);
    if (!dryRun) await hs.request('PATCH', `/cms/v3/blogs/posts/${id}/draft`, body);
    return { ...current, id };
  };

  const publishPost = async (key) => {
    const id = idFor(key);
    if (!id) { record('PUBLISH blog post', key, 'new post'); return; }
    const current = await hs.getPost(id);
    owned(key, current.id);
    assertAutoName(current.name, 'blog post');
    record('PUBLISH blog post', key, `id ${id}`);
    if (dryRun) return;
    if (String(current.currentState || '').startsWith('PUBLISHED')) await hs.request('POST', `/cms/v3/blogs/posts/${id}/draft/push-live`);
    else await hs.request('POST', '/cms/v3/blogs/posts/schedule', { id: String(id), publishDate: new Date(Date.now() + 3000).toISOString() });
  };

  const upsertForm = async (body) => {
    assertAutoName(body.name, 'form');
    const key = `form:${body.name}`;
    const id = idFor(key);
    if (!id) {
      record('CREATE form', key);
      if (dryRun) return fake({ name: body.name });
      const created = await hs.request('POST', '/marketing/v3/forms/', body);
      remember(key, 'form', created);
      return created;
    }
    const current = await hs.getForm(id);
    owned(key, current.id);
    assertAutoName(current.name, 'existing form');
    record('UPDATE form', key, `id ${id}`);
    if (dryRun) return { ...current, id };
    const { createdAt, ...patch } = body;
    return hs.request('PATCH', `/marketing/v3/forms/${id}`, patch);
  };

  const uploadFile = async (localPath, name, folderPath) => {
    assertAutoName(name, 'file');
    assertQaFolder(folderPath);
    const key = `file:${name}`;
    const known = state.objects[key];
    if (known) { record('REUSE file', key, `id ${known.id}`); return known.meta; }
    record('UPLOAD file', key, `to ${folderPath}`);
    if (dryRun) return { url: `https://example.invalid/${encodeURIComponent(name)}.png`, width: null, height: null };
    const form = new FormData();
    form.append('file', new Blob([fs.readFileSync(localPath)]), `${name}${path.extname(localPath)}`);
    form.append('fileName', name);
    form.append('folderPath', folderPath);
    form.append('options', JSON.stringify({ access: 'PUBLIC_NOT_INDEXABLE', overwrite: false, duplicateValidationStrategy: 'NONE', duplicateValidationScope: 'EXACT_FOLDER' }));
    const up = await hs.request('POST', '/files/v3/files', form);
    state.objects[key] = { type: 'file', id: String(up.id), name, createdAt: new Date().toISOString(), meta: { url: up.url, width: up.width, height: up.height } };
    saveState(all);
    return state.objects[key].meta;
  };

  const confirmPortal = () => { if (!dryRun) { state.confirmed = true; saveState(all); } };

  return { dryRun, plan, idFor, upsertPage, publishPage, upsertPost, publishPost, upsertForm, uploadFile, confirmPortal };
};

module.exports = { createWriter, hasPortalState };
