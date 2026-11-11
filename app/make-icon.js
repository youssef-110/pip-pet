// Draws the app + tray icons (a coral blob with eyes) as PNGs. No image dependencies.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function png(size) {
  const SS = 4, px = Buffer.alloc(size * (size * 4 + 1));
  const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const u = (x + (sx + 0.5) / SS) / size, v = (y + (sy + 0.5) / SS) / size;
        const leaf = inEllipse(u, v, 0.26, 0.17, 0.085, 0.15) || inEllipse(u, v, 0.74, 0.17, 0.085, 0.15); // horns
        const body = ((u - 0.5) / 0.45) ** 4 + ((v - 0.59) / 0.39) ** 4 <= 1;
        if (!leaf && !body) continue;
        const eye = (cx) => inEllipse(u, v, cx, 0.56, 0.055, 0.075);
        const glint = inEllipse(u, v, 0.37, 0.53, 0.02, 0.02) || inEllipse(u, v, 0.67, 0.53, 0.02, 0.02) || inEllipse(u, v, 0.3, 0.36, 0.09, 0.045);
        // light from the top left, like the SVG characters
        const t = Math.min(1, Math.hypot(u - 0.36, v - 0.34) / 0.62), lerp = (a, b, k) => a + (b - a) * k;
        const shade = t < 0.5 ? [248, 180, 160].map((x, i) => lerp(x, [240, 118, 90][i], t * 2)) : [240, 118, 90].map((x, i) => lerp(x, [190, 92, 80][i], t * 2 - 1));
        const c = !body ? [150, 78, 84] : glint ? [255, 255, 255] : eye(0.35) || eye(0.65) ? [38, 28, 44] : shade;
        r += c[0]; g += c[1]; b += c[2]; a++;
      }
      const o = y * (size * 4 + 1) + 1 + x * 4, n = SS * SS;
      if (a) { px[o] = r / a; px[o + 1] = g / a; px[o + 2] = b / a; px[o + 3] = (255 * a) / n; }
    }
  }
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type), data]), len = Buffer.alloc(4), crc = Buffer.alloc(4);
    len.writeUInt32BE(data.length); crc.writeUInt32BE(zlib.crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(px)), chunk('IEND', Buffer.alloc(0))]);
}

const dir = path.join(__dirname, 'assets');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'icon.png'), png(256));
fs.writeFileSync(path.join(dir, 'tray.png'), png(32));
