// YouTubeの字幕要素を確認するスクリプト
// ブラウザのコンソールで実行してください

console.log('=== YouTube Caption Elements Check ===');

// 1. 様々な字幕セレクタを試す
const selectors = [
  '.ytp-caption-segment',
  '.caption-window',
  '.ytp-caption-window-container',
  '.captions-text',
  '.ytp-caption-element',
  '[class*="caption"]',
  '[class*="subtitle"]',
  '.caption-visual-line',
  '.ytp-caption-window-bottom'
];

selectors.forEach(selector => {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    console.log(`✅ Found ${elements.length} elements with selector: ${selector}`);
    elements.forEach((el, i) => {
      if (i < 3) { // 最初の3つだけ表示
        console.log(`  - Text: "${el.textContent?.trim()?.substring(0, 50)}..."`);
        console.log(`  - Classes: ${el.className}`);
      }
    });
  }
});

// 2. 字幕コンテナの構造を確認
const captionContainer = document.querySelector('.ytp-caption-window-container');
if (captionContainer) {
  console.log('\n=== Caption Container Structure ===');
  console.log('Container found, checking children...');
  
  const walker = document.createTreeWalker(
    captionContainer,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );
  
  let node;
  let depth = 0;
  while (node = walker.nextNode()) {
    if (depth < 5) { // 深さ5まで
      const indent = '  '.repeat(depth);
      const text = node.textContent?.trim().substring(0, 30);
      console.log(`${indent}${node.tagName}.${node.className} - "${text}"`);
    }
    depth++;
  }
}

// 3. 現在表示されているテキストを持つ要素を探す
console.log('\n=== Elements with visible text ===');
const allElements = document.querySelectorAll('*');
const captionElements = [];

allElements.forEach(el => {
  const text = el.textContent?.trim();
  const classList = el.className;
  
  // 字幕っぽいテキストを含む要素を探す
  if (text && 
      text.length > 2 && 
      text.length < 200 && 
      !text.includes('>>') &&
      !text.includes('クリック') &&
      (classList.includes('caption') || 
       classList.includes('subtitle') ||
       el.closest('.ytp-caption-window-container'))) {
    
    // 子要素を持たない（テキストノードのみ）の要素
    if (el.children.length === 0) {
      captionElements.push({
        selector: el.tagName + '.' + el.className.split(' ').join('.'),
        text: text,
        element: el
      });
    }
  }
});

console.log('Found potential caption elements:', captionElements.length);
captionElements.slice(0, 5).forEach(item => {
  console.log(`- ${item.selector}: "${item.text.substring(0, 50)}..."`);
});

console.log('=== End Check ===');