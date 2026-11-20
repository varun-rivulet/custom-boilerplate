const { PORTAL_ID } = require('../config');

const API = 'https://api.hubapi.com';

const createClient = (token) => {
  const redact = (text) => String(text).split(token).join('[redacted]');

  const request = async (method, url, body) => {
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
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(redact(`HubSpot API ${method} ${url} -> ${res.status}: ${text.slice(0, 800)}`));
    }
    if (res.status === 204) return null;
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
    if (Number(info.portalId) !== PORTAL_ID) throw new Error(`Portal guard: token belongs to portal ${info.portalId}, expected ${PORTAL_ID}. Stopping.`);
    return info;
  };

  const findPageBySlug = async (kind, slug) => (await listAll(`/cms/v3/pages/${kind}?archived=false`)).find((p) => p.slug === slug) || null;
  const getPage = (kind, id) => request('GET', `/cms/v3/pages/${kind}/${id}`);
  const getPost = (id) => request('GET', `/cms/v3/blogs/posts/${id}`);
  const getForm = (id) => request('GET', `/marketing/v3/forms/${id}`);
  const listBlogs = async () => (await request('GET', '/cms/v3/blog-settings/settings?limit=100')).results || [];

  return { request, redact, assertPortal, findPageBySlug, getPage, getPost, getForm, listBlogs };
};

module.exports = { createClient };
