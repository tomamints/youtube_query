// Claude.ai診断ツール
export function diagnoseClaude() {
  console.log('=== Claude.ai Diagnostic Tool ===');
  console.log('URL:', window.location.href);
  console.log('Title:', document.title);
  
  // 入力要素を探す
  console.log('\n--- Input Elements ---');
  const inputSelectors = [
    'textarea',
    'div[contenteditable="true"]',
    '.ProseMirror',
    'div[role="textbox"]',
    'input[type="text"]'
  ];
  
  inputSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
      elements.forEach((el, idx) => {
        console.log(`  [${idx}]`, {
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          placeholder: el.getAttribute('placeholder'),
          contentEditable: el.getAttribute('contenteditable'),
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label')
        });
      });
    }
  });
  
  // ボタン要素を探す
  console.log('\n--- Button Elements ---');
  const buttons = document.querySelectorAll('button');
  console.log(`Found ${buttons.length} buttons`);
  
  buttons.forEach((btn, idx) => {
    const text = btn.textContent?.trim().substring(0, 30);
    const ariaLabel = btn.getAttribute('aria-label');
    const hasSvg = btn.querySelector('svg') !== null;
    
    if (ariaLabel || text || hasSvg) {
      console.log(`Button [${idx}]:`, {
        text,
        ariaLabel,
        hasSvg,
        className: btn.className.substring(0, 50),
        disabled: btn.disabled
      });
    }
  });
  
  // メッセージ要素を探す
  console.log('\n--- Message Elements ---');
  const messageSelectors = [
    '[data-testid*="message"]',
    'div[class*="message"]',
    'div[class*="Message"]',
    'div[class*="conversation"]',
    'div[class*="chat"]'
  ];
  
  messageSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
      }
    } catch (e) {
      // セレクタエラーを無視
    }
  });
  
  console.log('\n=== End Diagnostic ===');
}

// ページ読み込み時に自動実行
if (window.location.hostname === 'claude.ai') {
  setTimeout(diagnoseClaude, 2000);
}