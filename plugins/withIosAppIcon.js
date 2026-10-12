const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const SIZES = [
  ['Icon-20@2x.png', 40],
  ['Icon-20@3x.png', 60],
  ['Icon-29@2x.png', 58],
  ['Icon-29@3x.png', 87],
  ['Icon-40@2x.png', 80],
  ['Icon-40@3x.png', 120],
  ['Icon-60@2x.png', 120],
  ['Icon-60@3x.png', 180],
  ['Icon-76@2x.png', 152],
  ['Icon-83.5@2x.png', 167],
];

const CONTENTS = {
  images: [
    {
      filename: 'App-Icon-1024x1024@1x.png',
      idiom: 'universal',
      platform: 'ios',
      size: '1024x1024',
    },
    {
      appearances: [{ appearance: 'luminosity', value: 'dark' }],
      filename: 'App-Icon-1024x1024@1x.png',
      idiom: 'universal',
      platform: 'ios',
      size: '1024x1024',
    },
    {
      appearances: [{ appearance: 'luminosity', value: 'tinted' }],
      filename: 'App-Icon-1024x1024@1x.png',
      idiom: 'universal',
      platform: 'ios',
      size: '1024x1024',
    },
    { filename: 'Icon-20@2x.png', idiom: 'iphone', scale: '2x', size: '20x20' },
    { filename: 'Icon-20@3x.png', idiom: 'iphone', scale: '3x', size: '20x20' },
    { filename: 'Icon-29@2x.png', idiom: 'iphone', scale: '2x', size: '29x29' },
    { filename: 'Icon-29@3x.png', idiom: 'iphone', scale: '3x', size: '29x29' },
    { filename: 'Icon-40@2x.png', idiom: 'iphone', scale: '2x', size: '40x40' },
    { filename: 'Icon-40@3x.png', idiom: 'iphone', scale: '3x', size: '40x40' },
    { filename: 'Icon-60@2x.png', idiom: 'iphone', scale: '2x', size: '60x60' },
    { filename: 'Icon-60@3x.png', idiom: 'iphone', scale: '3x', size: '60x60' },
    { filename: 'Icon-20@2x.png', idiom: 'ipad', scale: '2x', size: '20x20' },
    { filename: 'Icon-29@2x.png', idiom: 'ipad', scale: '2x', size: '29x29' },
    { filename: 'Icon-40@2x.png', idiom: 'ipad', scale: '2x', size: '40x40' },
    { filename: 'Icon-76@2x.png', idiom: 'ipad', scale: '2x', size: '76x76' },
    { filename: 'Icon-83.5@2x.png', idiom: 'ipad', scale: '2x', size: '83.5x83.5' },
    {
      filename: 'App-Icon-1024x1024@1x.png',
      idiom: 'ios-marketing',
      scale: '1x',
      size: '1024x1024',
    },
  ],
  info: { author: 'xcode', version: 1 },
};

/**
 * iPhone 15 is a 3x device. A 1024-only icon set was installed without
 * AppIcon60x60@3x, so iOS showed the empty home-screen placeholder.
 */
function withIosAppIcon(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const icon = path.join(cfg.modRequest.projectRoot, 'assets', 'icon.png');
      const setDir = findAppIconSet(cfg.modRequest.platformProjectRoot);
      if (!icon || !setDir || !fs.existsSync(icon)) return cfg;

      fs.copyFileSync(icon, path.join(setDir, 'App-Icon-1024x1024@1x.png'));
      for (const [name, pixels] of SIZES) {
        execFileSync('sips', ['-z', String(pixels), String(pixels), icon, '--out', path.join(setDir, name)], {
          stdio: 'ignore',
        });
      }
      fs.writeFileSync(path.join(setDir, 'Contents.json'), `${JSON.stringify(CONTENTS, null, 2)}\n`);
      return cfg;
    },
  ]);
}

function findAppIconSet(iosRoot) {
  const entries = fs.readdirSync(iosRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidate = path.join(iosRoot, entry.name, 'Images.xcassets', 'AppIcon.appiconset');
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

module.exports = withIosAppIcon;
