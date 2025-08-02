// YouTubeのコンソールで実行してください
console.log('=== 字幕要素テスト ===');

// 1. 基本的な字幕要素の確認
const captionWindow = document.querySelector('.caption-window');
console.log('caption-window:', captionWindow);
if (captionWindow) {
  console.log('caption-window text:', captionWindow.textContent);
}

// 2. 他の可能性のあるセレクタ
const selectors = [
  '.ytp-caption-segment',
  '.ytp-caption-window-container',
  '.caption-visual-line', 
  '.captions-text',
  '[class*="caption"]'
];

selectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`\n${selector}: ${elements.length}個見つかりました`);
    elements.forEach((el, i) => {
      const text = el.textContent?.trim();
      if (text && text.length > 2 && !text.includes('>>')) {
        console.log(`  [${i}] "${text}"`);
      }
    });
  }
});

// 3. 字幕が有効かチェック
const captionBtn = document.querySelector('.ytp-subtitles-button');
if (captionBtn) {
  console.log('\n字幕ボタン状態:', captionBtn.getAttribute('aria-pressed'));
}

console.log('=== テスト終了 ===');