const path = require('path');

const QA_PREFIX = 'QA –';

const qaName = (suffix) => `${QA_PREFIX} ${suffix}`;

module.exports = {
  QA_PREFIX,
  qaName,
  PORTAL_ID: 51597413,
  SITE_URL: 'https://51597413.hs-sites-na2.com',
  THEME_FOLDER: 'custom-boilerplate',
  FILE_FOLDER: '/QA',
  SLUG_PREFIX: 'qa-auto-',
  WIDTHS: [1440, 1366, 1200, 991, 767, 360],
  REPO_ROOT: path.resolve(__dirname, '..'),
  QA_ROOT: __dirname,
  CACHE_DIR: path.join(__dirname, '.cache'),
  REPORTS_DIR: path.join(__dirname, 'reports'),
  USER_TEST_PAGE_SLUG: 'qa-base-module',
};
