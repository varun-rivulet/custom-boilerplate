const { AUTO_PREFIX, SLUG_PREFIX, FILE_FOLDER } = require('../config');

class GuardError extends Error {}

const fail = (msg) => { throw new GuardError(`Write guard: ${msg}`); };

const assertAutoName = (name, what) => {
  if (typeof name !== 'string' || !name.startsWith(`${AUTO_PREFIX} `)) fail(`refusing ${what} "${name}" (name must start with "${AUTO_PREFIX} ").`);
};

const assertAutoSlug = (slug, what) => {
  const last = String(slug || '').split('/').pop();
  if (!last.startsWith(SLUG_PREFIX)) fail(`refusing ${what} with slug "${slug}" (slug must start with "${SLUG_PREFIX}").`);
};

const assertQaFolder = (folderPath) => {
  if (folderPath !== FILE_FOLDER) fail(`files may only be written to ${FILE_FOLDER}, not "${folderPath}".`);
};

module.exports = { GuardError, assertAutoName, assertAutoSlug, assertQaFolder };
