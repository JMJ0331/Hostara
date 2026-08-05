import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

function createHostaraIcon(size, outputPath) {
  const png = new PNG({ width: size, height: size });
  const radius = Math.floor(size * 0.234); // ~120px for 512

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Check rounded corner bounds
      let inCorner = false;
      if (x < radius && y < radius) {
        inCorner = Math.hypot(radius - x, radius - y) > radius;
      } else if (x > size - radius && y < radius) {
        inCorner = Math.hypot(x - (size - radius), radius - y) > radius;
      } else if (x < radius && y > size - radius) {
        inCorner = Math.hypot(radius - x, y - (size - radius)) > radius;
      } else if (x > size - radius && y > size - radius) {
        inCorner = Math.hypot(x - (size - radius), y - (size - radius)) > radius;
      }

      if (inCorner) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      // Dark background #242424
      let r = 36;
      let g = 36;
      let b = 36;
      let a = 255;

      // Bold White H
      const leftStem = x >= size * 0.281 && x <= size * 0.406 && y >= size * 0.234 && y <= size * 0.766;
      const rightStem = x >= size * 0.594 && x <= size * 0.719 && y >= size * 0.234 && y <= size * 0.766;
      const crossbar = x >= size * 0.406 && x <= size * 0.594 && y >= size * 0.438 && y <= size * 0.562;

      if (leftStem || rightStem || crossbar) {
        r = 255;
        g = 255;
        b = 255;
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated icon: ${outputPath} (${size}x${size})`);
}

createHostaraIcon(192, path.join(process.cwd(), 'public', 'icon-192.png'));
createHostaraIcon(512, path.join(process.cwd(), 'public', 'icon-512.png'));
