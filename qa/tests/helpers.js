const hexToRgb = (hex) => {
  if (!hex || hex === 'transparent') return 'rgba(0, 0, 0, 0)';
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};

const px = (v) => parseFloat(v);
const near = (a, b, tol = 0.6) => Math.abs(a - b) <= tol;

const TIERS = { 1440: 0, 1366: 1, 1200: 2, 991: 3, 767: 4, 360: 4 };
const SIZES = {
  h2: [56, 52, 48, 44, 40], h3: [42, 40, 38, 36, 36], h4: [34, 32, 30, 28, 26],
  h5: [24, 22, 22, 20, 20], h6: [20, 20, 18, 18, 18], p: [18, 18, 18, 16, 16],
};
const h1Size = (w) => Math.min(85, Math.max(47, (85 / 14.4) * w / 100));

const parseButtonVars = (css) => {
  const out = {};
  const grab = (block) => {
    const v = {};
    block.replace(/--btn-(bg|text|border|bg-hover|text-hover|border-hover|radius|pad|pad-mobile|size|line-height):([^;}]+)/g, (_, k, val) => { v[k] = val.trim(); });
    return v;
  };
  const base = css.match(/\.btn,\.hs-button\{([^}]*)\}/);
  if (base) out.primary = grab(base[1]);
  css.replace(/(?<=^|\})\s*\.btn-([a-z-]+)\{([^}]*)\}/g, (_, name, block) => { if (!out[name]) out[name] = grab(block); });
  return out;
};

module.exports = { hexToRgb, px, near, TIERS, SIZES, h1Size, parseButtonVars };
