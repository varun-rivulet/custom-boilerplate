const { QA_PREFIX, FILE_FOLDER } = require('../config');

class GuardError extends Error {}

const isQaName = (name) => typeof name === 'string' && name.startsWith(`${QA_PREFIX} `);

const assertQaName = (name, what) => {
  if (!isQaName(name)) {
    throw new GuardError(`Write guard: refusing to touch ${what} "${name}" (name must start with "${QA_PREFIX} ").`);
  }
};

const assertQaFolder = (folderPath) => {
  if (folderPath !== FILE_FOLDER) {
    throw new GuardError(`Write guard: files may only be written to ${FILE_FOLDER}, not "${folderPath}".`);
  }
};

module.exports = { GuardError, isQaName, assertQaName, assertQaFolder };
