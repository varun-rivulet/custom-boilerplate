const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { PORTAL_ID, REPORTS_DIR } = require('../config');

const CDP = 'http://127.0.0.1:9333';
const ALLOWED_HOSTS = ['app.hubspot.com', 'app-na2.hubspot.com'];
const SHOTS = path.join(REPORTS_DIR, 'setup');

class PortalError extends Error {}

const portalOk = (url) => {
  let u;
  try { u = new URL(url); } catch { return false; }
  if (!ALLOWED_HOSTS.includes(u.hostname) || u.protocol !== 'https:') return false;
  const firstNumber = u.pathname.split('/').find((seg) => /^\d+$/.test(seg));
  const queryPortals = [...u.searchParams.entries()].filter(([k]) => /portalid|hubid/i.test(k)).map(([, v]) => v);
  if (queryPortals.some((v) => v !== String(PORTAL_ID))) return false;
  if (firstNumber !== undefined) return firstNumber === String(PORTAL_ID);
  return queryPortals.length > 0;
};

const assertPortal = (page) => {
  const url = page.url();
  if (!portalOk(url)) throw new PortalError(`Portal check failed: ${url} is not portal ${PORTAL_ID}. Stopping.`);
};

const connect = async () => {
  const browser = await chromium.connectOverCDP(CDP);
  const context = browser.contexts()[0];
  const page = context.pages().find((p) => /hubspot\.com/.test(p.url())) || context.pages()[0] || await context.newPage();
  return { browser, context, page };
};

const go = async (page, url) => {
  if (!portalOk(url)) throw new PortalError(`Refusing to open ${url}: not portal ${PORTAL_ID}.`);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  assertPortal(page);
};

const act = async (page, fn) => {
  assertPortal(page);
  const out = await fn();
  return out;
};

const shot = async (page, name) => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const file = path.join(SHOTS, `${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}-${name}.png`);
  await page.screenshot({ path: file });
  return file;
};

module.exports = { connect, go, act, shot, assertPortal, portalOk, PortalError, SHOTS };
