/**
 * Génère les icônes PNG pour la PWA KangBanGaming.
 * Usage : node generate-icons.mjs
 * Prérequis : npm install -D sharp   (ou: npm install -g sharp)
 *
 * Génère dans public/icons/ :
 *   icon-192.png        — icône standard 192×192
 *   icon-512.png        — icône standard 512×512
 *   icon-maskable-512.png — icône maskable 512×512 (fond plein, logo centré à 80%)
 *   apple-touch-icon.png  — 180×180 pour iOS
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const OUT = path.join(import.meta.dirname, 'public', 'icons');

// SVG de base (logo Steam retourné, couleur accent #e8813a)
const svgBase = (size, padding = 0) => {
  const inner = size - padding * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#0e1117"/>
  <g transform="translate(${padding},${padding})">
    <svg width="${inner}" height="${inner}" viewBox="0 0 496 512">
      <path fill="#e8813a" transform="rotate(180 248 256)"
        d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4
           38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5
           s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8
           384.8 8 496 119 496 256z
           M155.7 384.3l-30.5-12.6a52.79 52.79 0 0 0 27.2 25.8c26.9 11.2 57.8-1.6 69-28.4
           5.4-13 5.5-27.3.1-40.3-5.4-13-15.5-23.2-28.5-28.6-12.7-5.3-26.4-5.5-38.8-1.4l31.5 13
           c19.8 8.2 29.2 30.9 20.9 50.7-8.3 19.9-31 29.2-50.9 21z
           m173.8-129.9c-34.4 0-62.4-28-62.4-62.3s28-62.3 62.4-62.3 62.4 28 62.4 62.3-27.9 62.3-62.4 62.3z
           m.1-15.6c25.9 0 46.9-21 46.9-46.8 0-25.9-21-46.8-46.9-46.8s-46.9 21-46.9 46.8c.1 25.8 21.1 46.8 46.9 46.8z"/>
    </svg>
  </g>
</svg>`;
};

async function generate() {
  await mkdir(OUT, { recursive: true });

  const sizes = [
    { name: 'icon-192.png',          size: 192, padding: 16 },
    { name: 'icon-512.png',          size: 512, padding: 40 },
    { name: 'icon-maskable-512.png', size: 512, padding: 80 }, // fond plein, logo réduit à ~69%
    { name: 'apple-touch-icon.png',  size: 180, padding: 14 },
  ];

  for (const { name, size, padding } of sizes) {
    const svg = Buffer.from(svgBase(size, padding));
    await sharp(svg)
      .png()
      .toFile(path.join(OUT, name));
    console.log(`✓ ${name} (${size}×${size})`);
  }

  console.log('\nIcones générées dans frontend/public/icons/');
}

generate().catch(console.error);
