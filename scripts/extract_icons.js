const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function extractPrecise() {
  const srcPath = 'C:/Users/Ankit/.gemini/antigravity-ide/brain/e6552598-ac4b-4795-aaa0-e3c6c9ff39b6/.user_uploaded/media_1789398277813.png';
  const outDir = 'd:/Personal Project/GYM Project/FitCore/src/assets/muscle_icons';
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const base = await Jimp.read(srcPath);

  // Exact coordinates of the inner muscle icon inside the badge:
  const items = [
    { name: 'chest', y: 242, x: 50, w: 58, h: 58 },
    { name: 'back', y: 338, x: 50, w: 58, h: 58 },
    { name: 'legs', y: 435, x: 50, w: 58, h: 58 },
    { name: 'shoulders', y: 531, x: 50, w: 58, h: 58 },
    { name: 'chest_back', y: 628, x: 50, w: 58, h: 58 },
    { name: 'biceps', y: 726, x: 50, w: 58, h: 58 },
  ];

  for (const item of items) {
    const cropped = base.clone().crop({ x: item.x, y: item.y, w: item.w, h: item.h });
    const targetFile = path.join(outDir, `${item.name}.png`);
    await cropped.write(targetFile);
    console.log('Saved precise', targetFile);
  }
}
extractPrecise().catch(console.error);
