const JimpModule = require('jimp');
const Jimp = JimpModule.Jimp || JimpModule;
const path = require('path');
const fs = require('fs');

const SOURCE_ICON = path.join(__dirname, '../src/assets/Icone.png');
const ANDROID_RES_DIR = path.join(__dirname, '../android/app/src/main/res');
const IOS_APPICON_DIR = path.join(__dirname, '../ios/FitCore/Images.xcassets/AppIcon.appiconset');

const ANDROID_ICONS = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 }
];

const IOS_ICONS = [
  { name: 'icon-40.png', size: 40 },
  { name: 'icon-58.png', size: 58 },
  { name: 'icon-60.png', size: 60 },
  { name: 'icon-80.png', size: 80 },
  { name: 'icon-87.png', size: 87 },
  { name: 'icon-120.png', size: 120 },
  { name: 'icon-180.png', size: 180 },
  { name: 'icon-1024.png', size: 1024 }
];

// Compatibility wrapper for Jimp resize API
function resizeImage(image, size) {
  if (JimpModule.Jimp) {
    // Jimp v1.x signature
    return image.resize({ w: size, h: size });
  } else {
    // Jimp v0.x signature
    return image.resize(size, size);
  }
}

// Compatibility wrapper for Jimp write API
async function writeImage(image, outputPath) {
  if (typeof image.writeAsync === 'function') {
    await image.writeAsync(outputPath);
  } else {
    await image.write(outputPath);
  }
}

// Anti-aliased circle crop helper
function makeRound(image) {
  const width = image.bitmap.width;
  const height = image.bitmap.height;
  const radius = width / 2;
  const centerX = width / 2;
  const centerY = height / 2;
  
  image.scan(0, 0, width, height, function(x, y, idx) {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > radius) {
      this.bitmap.data[idx + 3] = 0;
    } else if (distance > radius - 1.0) {
      const alpha = this.bitmap.data[idx + 3];
      const factor = radius - distance;
      this.bitmap.data[idx + 3] = Math.round(alpha * factor);
    }
  });
  return image;
}

async function run() {
  console.log('Starting app icon generation...');
  console.log(`Source icon: ${SOURCE_ICON}`);

  if (!fs.existsSync(SOURCE_ICON)) {
    console.error(`Error: Source icon not found at ${SOURCE_ICON}`);
    process.exit(1);
  }

  // Load the source image once
  const sourceImage = await Jimp.read(SOURCE_ICON);
  console.log(`Loaded source icon successfully (${sourceImage.bitmap.width}x${sourceImage.bitmap.height})`);

  // 1. Generate Android Icons
  console.log('\n--- Generating Android Icons ---');
  for (const icon of ANDROID_ICONS) {
    const targetDir = path.join(ANDROID_RES_DIR, icon.dir);
    if (!fs.existsSync(targetDir)) {
      console.log(`Creating directory: ${targetDir}`);
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Standard Icon
    const stdPath = path.join(targetDir, 'ic_launcher.png');
    const stdImg = sourceImage.clone();
    resizeImage(stdImg, icon.size);
    await writeImage(stdImg, stdPath);
    console.log(`Saved: ${stdPath} (${icon.size}x${icon.size})`);

    // Rounded Icon
    const roundPath = path.join(targetDir, 'ic_launcher_round.png');
    const roundImg = sourceImage.clone();
    resizeImage(roundImg, icon.size);
    makeRound(roundImg);
    await writeImage(roundImg, roundPath);
    console.log(`Saved: ${roundPath} (${icon.size}x${icon.size}, rounded)`);
  }

  // 2. Generate iOS Icons
  console.log('\n--- Generating iOS Icons ---');
  if (!fs.existsSync(IOS_APPICON_DIR)) {
    console.log(`Creating directory: ${IOS_APPICON_DIR}`);
    fs.mkdirSync(IOS_APPICON_DIR, { recursive: true });
  }

  for (const icon of IOS_ICONS) {
    const targetPath = path.join(IOS_APPICON_DIR, icon.name);
    const iosImg = sourceImage.clone();
    resizeImage(iosImg, icon.size);
    await writeImage(iosImg, targetPath);
    console.log(`Saved: ${targetPath} (${icon.size}x${icon.size})`);
  }

  console.log('\nIcon generation complete! 🎉');
}

run().catch(err => {
  console.error('Error during icon generation:', err);
  process.exit(1);
});
