// Claude.aiにスクリーンショットとプロンプトを自動入力

console.log('Claude screenshot injector loaded');

// メッセージリスナー
chrome.runtime.onMessage.addListener(async (request, _sender, sendResponse) => {
  if (request.type === 'INJECT_SCREENSHOT_AND_PROMPT') {
    console.log('Injecting screenshot and prompt...');
    
    try {
      await injectScreenshotAndPrompt(
        request.prompt,
        request.screenshotDataUrl,
        request.word,
        request.context
      );
      sendResponse({ success: true });
    } catch (error) {
      console.error('Injection error:', error);
      sendResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
});

async function injectScreenshotAndPrompt(
  prompt: string,
  screenshotDataUrl: string,
  word: string,
  _context: string
) {
  // Claude.aiの入力エリアを待つ
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // Claude.aiの新しいUIに対応した複数のセレクターを試す
    const selectors = [
      'div[contenteditable="true"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="Claude"]',
      '.ProseMirror',
      '[data-placeholder*="Message"]',
      'div.relative div[contenteditable="true"]'
    ];
    
    let inputElement = null;
    for (const selector of selectors) {
      inputElement = document.querySelector(selector);
      if (inputElement) break;
    }
    
    if (inputElement) {
      console.log('Found input element:', inputElement);
      
      // まず画像を添付（ファイルアップロードボタンを探す）
      const fileButtons = [
        'button[aria-label*="Attach"]',
        'button[aria-label*="Upload"]',
        'input[type="file"]',
        'button svg[class*="paperclip"]',
        'button svg[class*="attach"]',
        'button[data-testid*="file"]'
      ];
      
      let fileButton = null;
      for (const selector of fileButtons) {
        fileButton = document.querySelector(selector);
        if (fileButton) break;
      }
      
      if (!fileButton) {
        // ファイルボタンが見つからない場合は、アイコンから探す
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.innerHTML.includes('svg') && 
              (button.innerHTML.includes('paperclip') || 
               button.innerHTML.includes('M21.44') || // paperclip SVG path
               button.innerHTML.includes('attach'))) {
            fileButton = button;
            break;
          }
        }
      }
      
      if (fileButton) {
        console.log('Found file button, converting screenshot to file...');
        
        // データURLをBlobに変換
        const response = await fetch(screenshotDataUrl);
        const blob = await response.blob();
        
        // Blobをファイルに変換
        const fileName = `youtube-screenshot-${word}-${Date.now()}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });
        
        // ファイルをプログラム的にアップロード
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        // ドラッグ&ドロップイベントをシミュレート
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dataTransfer
        });
        
        inputElement.dispatchEvent(dropEvent);
        
        // 少し待つ
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // テキストを入力
      if (inputElement.tagName === 'TEXTAREA') {
        (inputElement as HTMLTextAreaElement).value = prompt;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // contenteditable要素の場合
        inputElement.textContent = prompt;
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        
        // 入力イベントをトリガー
        const inputEvent = new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          data: prompt
        });
        inputElement.dispatchEvent(inputEvent);
      }
      
      console.log('Prompt injected successfully!');
      
      // 送信ボタンを探す（自動送信はしない - ユーザーが確認してから送信）
      highlightSendButton();
      
      return;
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error('Claude.ai input element not found after ' + maxAttempts + ' attempts');
}

// 送信ボタンをハイライト
function highlightSendButton() {
  const sendButtonSelectors = [
    'button[aria-label*="Send"]',
    'button[aria-label*="send"]',
    'button svg[class*="send"]',
    'button[data-testid*="send"]'
  ];
  
  let sendButton = null;
  for (const selector of sendButtonSelectors) {
    sendButton = document.querySelector(selector);
    if (sendButton) break;
  }
  
  if (!sendButton) {
    // アイコンから探す
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.innerHTML.includes('svg') && 
          (button.innerHTML.includes('M2.01') || // send icon path
           button.innerHTML.includes('send'))) {
        sendButton = button;
        break;
      }
    }
  }
  
  if (sendButton) {
    // ボタンをハイライト
    (sendButton as HTMLElement).style.boxShadow = '0 0 10px 3px #3b82f6';
    (sendButton as HTMLElement).style.animation = 'pulse 2s infinite';
    
    // アニメーションを追加
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { box-shadow: 0 0 10px 3px #3b82f6; }
        50% { box-shadow: 0 0 20px 5px #3b82f6; }
        100% { box-shadow: 0 0 10px 3px #3b82f6; }
      }
    `;
    document.head.appendChild(style);
    
    console.log('Send button highlighted - ready to send!');
  }
}