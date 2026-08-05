import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

function createHostaraIcon(size, outputPath) {
  const png = new PNG({ width: size, height: size });

  // Dark background #1E1E1E with gradient to #3A3A3A
  // Rounded corner radius ~22%
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

      // Draw Villa House Emblem (Roof & Body)
      const cx = size / 2;
      const cy = size / 2;
      const houseWidth = size * 0.5;
      const houseHeight = size * 0.45;
      const roofPeakY = cy - houseHeight * 0.55;
      const eaveY = cy - houseHeight * 0.1;
      const baseBottomY = cy + houseHeight * 0.45;
      const leftX = cx - houseWidth * 0.5;
      const rightX = cx + houseWidth * 0.5;

      // Roof triangle check
      const inRoof = y >= roofPeakY && y <= eaveY &&
        Math.abs(x - cx) <= ((y - roofPeakY) / (eaveY - roofPeakY)) * (houseWidth * 0.55);

      // Body rectangle check
      const inBody = x >= leftX && x <= rightX && y >= eaveY && y <= baseBottomY;

      // Door cutout check
      const doorW = houseWidth * 0.28;
      const doorH = houseHeight * 0.4;
      const inDoor = x >= (cx - doorW / 2) && x <= (cx + doorW / 2) &&
        y >= (baseBottomY - doorH) && y <= baseBottomY;

      // Accent color #F4C7B8 (Rose Gold) for roof peak
      const inRoofPeakAccent = inRoof && y <= (roofPeakY + (eaveY - roofPeakY) * 0.3);

      if (inDoor) {
        // Dark door opening #1E1E1E
        r = 30;
        g = 30;
        b = 30;
      } else if (inRoofPeakAccent) {
        // Rose Gold Accent #F4C7B8
        r = 244;
        g = 199;
        b = 184;
      } else if (inRoof || inBody) {
        // Clean Off-White Villa body #FAFAF8
        r = 250;
        g = 250;
        b = 248;
      }

      // Draw subtle inner border glow
      if (x < 6 || y < 6 || x > size - 6 || y > size - 6) {
        r = Math.min(255, r + 40);
        g = Math.min(255, g + 40);
        b = Math.min(255, b + 40);
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
