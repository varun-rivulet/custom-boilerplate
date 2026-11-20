const fs = require('fs');
const path = require('path');
const { launch } = require('./browser');

const IMAGES = [
  { key: 'wide', file: 'qa-wide.png', width: 4000, height: 1500, label: 'Wide image 4000 x 1500', colors: ['#1d4ed8', '#0ea5e9', '#f59e0b'] },
  { key: 'background', file: 'qa-background.png', width: 2400, height: 1200, label: 'Background image 2400 x 1200', colors: ['#0f172a', '#475569', '#e2e8f0'] },
  { key: 'featured', file: 'qa-featured.png', width: 1600, height: 900, label: 'Featured image 1600 x 900', colors: ['#334155', '#64748b', '#fde68a'] },
];

const generateImages = async (dir) => {
  fs.mkdirSync(dir, { recursive: true });
  const missing = IMAGES.filter((img) => !fs.existsSync(path.join(dir, img.file)));
  if (missing.length) {
    const browser = await launch();
    for (const img of missing) {
      const page = await browser.newPage({ viewport: { width: img.width, height: img.height } });
      await page.setContent(`<html><body style="margin:0"><canvas id="c" width="${img.width}" height="${img.height}"></canvas><script>
        const c = document.getElementById('c'), x = c.getContext('2d');
        const g = x.createLinearGradient(0, 0, c.width, c.height);
        g.addColorStop(0, '${img.colors[0]}'); g.addColorStop(0.5, '${img.colors[1]}'); g.addColorStop(1, '${img.colors[2]}');
        x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
        x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 4;
        for (let i = 0; i < c.width; i += 200) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, c.height); x.stroke(); }
        x.fillStyle = '#ffffff'; x.font = 'bold ${Math.round(img.height / 8)}px sans-serif'; x.fillText('QA ${img.label}', 60, ${Math.round(img.height / 2)});
      </script></body></html>`);
      await page.locator('#c').screenshot({ path: path.join(dir, img.file) });
      await page.close();
    }
    await browser.close();
  }
  return IMAGES.map((img) => ({ ...img, localPath: path.join(dir, img.file) }));
};

module.exports = { generateImages };
