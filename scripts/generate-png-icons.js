import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

function createHostaraIcon(size, outputPath) {
  const png = new PNG({ width: size, height: size });

  // Dark background #1E1E1E with gradient to #3A3A3A
  const radius = Math.floor(size * 0.22);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Check rounded rect boundaries
      let inCorner = false;
      let cornerDist = 0;

      if (x < radius && y < radius) {
        cornerDist = Math.hypot(radius - x, radius - y);
        inCorner = cornerDist > radius;
      } else if (x > size - radius && y < radius) {
        cornerDist = Math.hypot(x - (size - radius), radius - y);
        inCorner = cornerDist > radius;
      } else if (x < radius && y > size - radius) {
        cornerDist = Math.hypot(radius - x, y - (size - radius));
        inCorner = cornerDist > radius;
      } else if (x > size - radius && y > size - radius) {
        cornerDist = Math.hypot(x - (size - radius), y - (size - radius));
        inCorner = cornerDist > radius;
      }

      if (inCorner) {
        // Transparent outside rounded corners
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      // Base Dark Gray background gradient
      const factor = (x + y) / (size * 2);
      let r = Math.floor(45 + factor * 20); // ~#2D2D2D
      let g = Math.floor(45 + factor * 20);
      let b = Math.floor(45 + factor * 20);
      let a = 255;

      // Draw Monogram "H" Emblem
      const leftStem = x >= size * 0.25 && x <= size * 0.39 && y >= size * 0.22 && y <= size * 0.78;
      const rightStem = x >= size * 0.61 && x <= size * 0.75 && y >= size * 0.22 && y <= size * 0.78;
      const crossbar = x >= size * 0.35 && x <= size * 0.65 && y >= size * 0.43 && y <= size * 0.57;

      // Triangle Roof Accent above crossbar
      const roofPeakY = size * 0.33;
      const roofBaseY = size * 0.43;
      const inRoofAccent = y >= roofPeakY && y <= roofBaseY &&
        Math.abs(x - size * 0.5) <= ((y - roofPeakY) / (roofBaseY - roofPeakY)) * (size * 0.12);

      if (inRoofAccent) {
        // Rose Gold Accent #F4C7B8
        r = 244;
        g = 199;
        b = 184;
      } else if (leftStem || rightStem || crossbar) {
        // Crisp Off-White #FAFAF8
        r = 250;
        g = 250;
        b = 248;
      }

      // Subtle inner border line
      if (x < 6 || y < 6 || x > size - 6 || y > size - 6) {
        r = Math.min(255, r + 30);
        g = Math.min(255, g + 30);
        b = Math.min(255, b + 30);
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
