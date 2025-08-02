// 簡易的なアイコン生成スクリプト
// 実際のプロジェクトでは、デザイナーが作成したアイコンを使用してください

const fs = require('fs');
const path = require('path');

// SVGアイコン（学習をイメージした本のアイコン）
const svgIcon = `
<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" rx="24" fill="#4CAF50"/>
  <path d="M32 40C32 35.5817 35.5817 32 40 32H88C92.4183 32 96 35.5817 96 40V88C96 92.4183 92.4183 96 88 96H40C35.5817 96 32 92.4183 32 88V40Z" fill="white" fill-opacity="0.9"/>
  <rect x="42" y="44" width="44" height="4" rx="2" fill="#4CAF50"/>
  <rect x="42" y="54" width="44" height="4" rx="2" fill="#4CAF50"/>
  <rect x="42" y="64" width="32" height="4" rx="2" fill="#4CAF50"/>
  <circle cx="84" cy="76" r="12" fill="#FF9800"/>
  <path d="M84 70V76L88 80" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// アイコンディレクトリの作成
const iconsDir = path.join(__dirname);
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 仮のPNGアイコン生成（本来はSVGからPNGに変換）
// ここでは単純なプレースホルダーを作成
const sizes = [16, 48, 128];

sizes.forEach(size => {
  // 実際のプロジェクトでは、sharp や canvas などのライブラリを使用してSVGをPNGに変換
  // ここでは簡易的にSVGファイルを作成
  fs.writeFileSync(
    path.join(iconsDir, `icon${size}.svg`),
    svgIcon.replace('width="128" height="128"', `width="${size}" height="${size}"`)
  );
  
  console.log(`Created icon${size}.svg`);
});

console.log('\n⚠️  注意: 実際のChrome拡張機能にはPNGアイコンが必要です。');
console.log('SVGファイルをPNGに変換するか、デザイナーに依頼してください。');
console.log('\n一時的な解決策として、以下のツールを使用できます:');
console.log('- https://cloudconvert.com/svg-to-png');
console.log('- https://svgtopng.com/');