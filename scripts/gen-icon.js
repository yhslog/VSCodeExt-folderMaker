const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const width = 128;
const height = 128;

function lerp(a, b, t) { return a + (b - a) * t; }

function setPixel(png, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= width || y >= height) return;
  const idx = (width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function distPointToSegment(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;
  let xx, yy;
  if (param < 0) { xx = x1; yy = y1; }
  else if (param > 1) { xx = x2; yy = y2; }
  else { xx = x1 + param * C; yy = y1 + param * D; }
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

function drawThickLine(png, x1, y1, x2, y2, thickness, color) {
  const r = color[0], g = color[1], b = color[2], a = color[3] ?? 255;
  const minX = Math.floor(Math.min(x1, x2) - thickness);
  const maxX = Math.ceil(Math.max(x1, x2) + thickness);
  const minY = Math.floor(Math.min(y1, y2) - thickness);
  const maxY = Math.ceil(Math.max(y1, y2) + thickness);
  const rad = thickness / 2;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (distPointToSegment(x + 0.5, y + 0.5, x1, y1, x2, y2) <= rad) {
        setPixel(png, x, y, r, g, b, a);
      }
    }
  }
}

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

(function main() {
  const png = new PNG({ width, height });

  // Gradient background top -> bottom
  const top = { r: 124, g: 77, b: 255 };
  const bottom = { r: 0, g: 194, b: 255 };
  for (let y = 0; y < height; y++) {
    const t = y / (height - 1);
    const r = Math.round(lerp(top.r, bottom.r, t));
    const g = Math.round(lerp(top.g, bottom.g, t));
    const b = Math.round(lerp(top.b, bottom.b, t));
    for (let x = 0; x < width; x++) {
      setPixel(png, x, y, r, g, b, 255);
    }
  }

  // Draw Y mark
  const white = [255, 255, 255, 255];
  const thickness = 12;
  drawThickLine(png, 32, 28, 64, 60, thickness, white);
  drawThickLine(png, 96, 28, 64, 60, thickness, white);
  drawThickLine(png, 64, 60, 64, 96, thickness, white);

  const outDir = path.join(process.cwd(), 'media');
  ensureDirSync(outDir);
  const outPath = path.join(outDir, 'icon.png');
  png.pack().pipe(fs.createWriteStream(outPath))
    .on('finish', () => console.log('Wrote', outPath))
    .on('error', (e) => { console.error(e); process.exit(1); });
})();

