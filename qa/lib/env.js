const fs = require('fs');
const path = require('path');
const { REPO_ROOT } = require('../config');

const loadToken = () => {
  const file = path.join(REPO_ROOT, '.env');
  if (!fs.existsSync(file)) throw new Error('Missing .env at the repo root (needs HUBSPOT_QA_TOKEN).');
  const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find((l) => /^\s*HUBSPOT_QA_TOKEN\s*=/.test(l));
  const token = line ? line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '') : '';
  if (!token) throw new Error('HUBSPOT_QA_TOKEN is empty or missing in .env.');
  return token;
};

module.exports = { loadToken };
