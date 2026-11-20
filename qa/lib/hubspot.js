const fs = require('fs');
const path = require('path');
const { PORTAL_ID } = require('../config');
const { assertQaName, assertQaFolder, isQaName } = require('./guard');

const API = 'https://api.hubapi.com';

const createClient = (token) => {
  const redact = (text) => String(text).split(token).join('[redacted]');

  const request = async (method, url, body, { raw = false, allow404 = false } = {}) => {
    const headers = { Authorization: `Bearer ${token}` };
    let payload;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
    let res;
    for (let attempt = 0; attempt < 4; attempt++) {
      res = await fetch(API + url, { method, headers, body: payload });
      if (res.status !== 429 && res.status < 500) break;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
    if (allow404 && res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(redact(`HubSpot API ${method} ${url} -> ${res.status}: ${text.slice(0, 800)}`));
    }
    if (raw || res.status === 204) return res;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  };

  const listAll = async (url) => {
    const out = [];
    let after;
    do {
      const sep = url.includes('?') ? '&' : '?';
      const page = await request('GET', `${url}${sep}limit=100${after ? `&after=${after}` : ''}`);
      out.push(...(page.results || []));
      after = page.paging && page.paging.next && page.paging.next.after;
    } while (after);
    return out;
  };

  const assertPortal = async () => {
    const info = await request('GET', '/account-info/v3/details');
    if (Number(info.portalId) !== PORTAL_ID) {
      throw new Error(`Portal guard: token belongs to portal ${info.portalId}, expected ${PORTAL_ID}. Stopping.`);
    }
    return info;
  };

  const pageBase = (kind) => `/cms/v3/pages/${kind}`;

  const findPage = async (kind, name) => {
    const pages = await listAll(`${pageBase(kind)}?archived=false`);
    return pages.find((p) => p.name === name) || null;
  };

  const findPageBySlug = async (kind, slug) => {
    const pages = await listAll(`${pageBase(kind)}?archived=false`);
    return pages.find((p) => p.slug === slug) || null;
  };

  const getPage = (kind, id) => request('GET', `${pageBase(kind)}/${id}`);

  const upsertPage = async (kind, spec) => {
    assertQaName(spec.name, 'page');
    const existing = await findPage(kind, spec.name);
    if (!existing) return request('POST', pageBase(kind), spec);
    assertQaName(existing.name, 'page');
    await request('PATCH', `${pageBase(kind)}/${existing.id}/draft`, spec);
    return { ...existing, ...spec, id: existing.id };
  };

  const publishPage = async (kind, id) => {
    const current = await getPage(kind, id);
    assertQaName(current.name, 'page');
    if (String(current.currentState || '').startsWith('PUBLISHED')) {
      await request('POST', `${pageBase(kind)}/${id}/draft/push-live`);
    } else {
      await request('POST', `${pageBase(kind)}/schedule`, { id: String(id), publishDate: new Date(Date.now() + 3000).toISOString() });
    }
  };

  const listBlogs = async () => {
    const res = await request('GET', '/cms/v3/blog-settings/settings?limit=100');
    return res.results || [];
  };

  const findPost = async (name, contentGroupId) => {
    const posts = await listAll(`/cms/v3/blogs/posts?archived=false&contentGroupId=${contentGroupId}`);
    return posts.find((p) => p.name === name) || null;
  };

  const upsertPost = async (spec) => {
    assertQaName(spec.name, 'blog post');
    const existing = await findPost(spec.name, spec.contentGroupId);
    if (!existing) return request('POST', '/cms/v3/blogs/posts', spec);
    assertQaName(existing.name, 'blog post');
    await request('PATCH', `/cms/v3/blogs/posts/${existing.id}/draft`, spec);
    return { ...existing, ...spec, id: existing.id };
  };

  const publishPost = async (id) => {
    const current = await request('GET', `/cms/v3/blogs/posts/${id}`);
    assertQaName(current.name, 'blog post');
    if (String(current.currentState || '').startsWith('PUBLISHED')) {
      await request('POST', `/cms/v3/blogs/posts/${id}/draft/push-live`);
    } else {
      await request('POST', '/cms/v3/blogs/posts/schedule', { id: String(id), publishDate: new Date(Date.now() + 3000).toISOString() });
    }
    return current;
  };

  const getPost = (id) => request('GET', `/cms/v3/blogs/posts/${id}`);

  const findForm = async (name) => {
    const forms = await listAll('/marketing/v3/forms/?formTypes=hubspot');
    return forms.find((f) => f.name === name) || null;
  };

  const upsertForm = async (spec) => {
    assertQaName(spec.name, 'form');
    const existing = await findForm(spec.name);
    if (!existing) return request('POST', '/marketing/v3/forms/', spec);
    assertQaName(existing.name, 'form');
    return request('PATCH', `/marketing/v3/forms/${existing.id}`, spec);
  };

  const uploadFile = async (localPath, name, folderPath) => {
    assertQaName(name, 'file');
    assertQaFolder(folderPath);
    const form = new FormData();
    const ext = path.extname(localPath);
    form.append('file', new Blob([fs.readFileSync(localPath)]), `${name}${ext}`);
    form.append('fileName', name);
    form.append('folderPath', folderPath);
    form.append('options', JSON.stringify({ access: 'PUBLIC_NOT_INDEXABLE', overwrite: true, duplicateValidationStrategy: 'NONE', duplicateValidationScope: 'EXACT_FOLDER' }));
    return request('POST', '/files/v3/files', form);
  };

  return { request, redact, assertPortal, findPage, findPageBySlug, getPage, upsertPage, publishPage, listBlogs, upsertPost, publishPost, getPost, upsertForm, uploadFile, isQaName };
};

module.exports = { createClient };
