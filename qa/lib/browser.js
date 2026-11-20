const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const launch = async () => {
  try {
    return await chromium.launch();
  } catch (err) {
    const base = path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
    const dirs = fs.existsSync(base) ? fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse() : [];
    for (const dir of dirs) {
      const exe = path.join(base, dir, 'chrome-win64', 'chrome.exe');
      if (fs.existsSync(exe)) return chromium.launch({ executablePath: exe });
    }
    throw new Error('No Chromium found. Run "npx playwright install chromium" in qa/.');
  }
};

module.exports = { launch };
