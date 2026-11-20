const path = require('path');

const QA_PREFIX = 'QA –';
const AUTO_PREFIX = `${QA_PREFIX} Auto`;

const qaName = (suffix) => `${QA_PREFIX} ${suffix}`;
const autoName = (suffix) => `${AUTO_PREFIX} ${suffix}`;

module.exports = {
  QA_PREFIX,
  AUTO_PREFIX,
  qaName,
  autoName,
  PORTAL_ID: 51597413,
  SITE_URL: 'https://51597413.hs-sites-na2.com',
  THEME_FOLDER: 'custom-boilerplate',
  FILE_FOLDER: '/QA',
  SLUG_PREFIX: 'qa-auto-',
  WIDTHS: [1440, 1366, 1200, 991, 767, 360],
  REPO_ROOT: path.resolve(__dirname, '..'),
  QA_ROOT: __dirname,
  CACHE_DIR: path.join(__dirname, '.cache'),
  STATE_FILE: path.join(__dirname, '.state', 'created.json'),
  REPORTS_DIR: path.join(__dirname, 'reports'),
  REFERENCE_PAGE_SLUG: 'qa-base-module',
};
