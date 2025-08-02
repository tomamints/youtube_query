// Claude.aiページで動作するコンテンツスクリプト

console.log('Claude.ai injector loaded');

// 診断関数（インライン）
function diagnoseClaude() {
  console.log('=== Claude.ai Diagnostic ===');
  console.log('URL:', window.location.href);
  console.log('Page HTML sample:', document.body.innerHTML.substring(0, 500));
  
  // 入力要素を探す
  const inputSelectors = [
    'textarea',
    'div[contenteditable="true"]',
    '.ProseMirror',
    'div[role="textbox"]'
  ];
  
  inputSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`Found ${elements.length} elements with selector: ${selector}`);
    }
  });
}

// 診断を実行
setTimeout(diagnoseClaude, 2000);

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'INJECT_QUESTION') {
    injectAndSend(request.question)
      .then(answer => sendResponse({ answer }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // 非同期レスポンス
  }
  return false;
});

// 質問を注入して送信
async function injectAndSend(question: string): Promise<string> {
  try {
    // ページが完全に読み込まれるまで待つ
    await waitForPageReady();
    
    // テキストエリアを探す（複数のセレクタを試す）
    let inputElement: HTMLElement | null = null;
    for (const selector of CLAUDE_SELECTORS.textarea) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        inputElement = element;
        console.log('Found input with selector:', selector);
        break;
      }
    }
    
    if (!inputElement) {
      console.error('Could not find input. Tried selectors:', CLAUDE_SELECTORS.textarea);
      console.error('Current page URL:', window.location.href);
      console.error('Page title:', document.title);
      throw new Error('Claude input not found - make sure you are logged in to Claude.ai');
    }

    // 既存の会話をクリア（新しい会話を開始）
    for (const selector of CLAUDE_SELECTORS.newChatButton) {
      const button = document.querySelector(selector) as HTMLElement;
      if (button) {
        button.click();
        await sleep(500);
        break;
      }
    }

    // 質問を入力（textareaとcontentEditableで処理を分ける）
    if (inputElement.tagName === 'TEXTAREA') {
      (inputElement as HTMLTextAreaElement).value = question;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (inputElement.getAttribute('contenteditable') === 'true') {
      inputElement.textContent = question;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      // contentEditableの場合は追加のイベントが必要な場合がある
      inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    }
    
    // 送信ボタンを探してクリック
    await sleep(100);
    const sendButton = findSendButton();
    if (!sendButton) {
      throw new Error('Send button not found');
    }
    
    sendButton.click();

    // 回答を待つ
    const answer = await waitForResponse();
    return answer;
  } catch (error) {
    console.error('Error in Claude injector:', error);
    throw error;
  }
}

// 送信ボタンを探す
function findSendButton(): HTMLElement | null {
  // CLAUDE_SELECTORSと追加のセレクタを組み合わせる
  const selectors = [
    ...CLAUDE_SELECTORS.sendButton,
    'button svg[viewBox="0 0 24 24"]',
    'button:has(svg path[d*="M2.01 21L23 12"])',
    'button:has(svg path[d*="send"])',
    'button[data-testid="send-button"]'
  ];

  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const button = element.tagName === 'BUTTON' ? element : element.closest('button');
        if (button && !(button as HTMLButtonElement).disabled) {
          console.log('Found send button with selector:', selector);
          return button as HTMLElement;
        }
      }
    } catch (e) {
      // :has セレクタがサポートされていない場合のエラーをキャッチ
      console.warn('Selector failed:', selector, e);
    }
  }

  console.error('Send button not found. Tried selectors:', selectors);
  return null;
}

// 回答を待つ
async function waitForResponse(timeout = 30000): Promise<string> {
  const startTime = Date.now();
  let lastMessageText = '';
  
  while (Date.now() - startTime < timeout) {
    // Claudeの回答要素を探す（複数のセレクタを試す）
    let messages: Element[] = [];
    
    for (const selector of CLAUDE_SELECTORS.messages) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          messages = Array.from(elements);
          break;
        }
      } catch (e) {
        console.warn('Message selector failed:', selector, e);
      }
    }
    
    // アシスタントのメッセージを識別
    const assistantMessages = messages.filter(msg => {
      // Claudeのメッセージの特徴を複数チェック
      return (
        msg.querySelector('[data-testid="assistant-message"]') || 
        msg.getAttribute('data-message-author') === 'assistant' ||
        msg.className?.includes('assistant') ||
        msg.className?.includes('claude') ||
        (msg.textContent?.includes('Claude') && !msg.textContent?.includes('Message Claude'))
      );
    });

    if (assistantMessages.length > 0) {
      const lastMessage = assistantMessages[assistantMessages.length - 1];
      const currentText = lastMessage.textContent || '';
      
      // テキストが更新されているかチェック（ストリーミング中）
      if (currentText !== lastMessageText) {
        lastMessageText = currentText;
        await sleep(500); // テキストが更新されたら待つ
        continue;
      }
      
      // ストリーミング完了インジケーターのチェック
      const streamingIndicators = [
        '[data-testid="streaming-indicator"]',
        '.streaming-indicator',
        '[class*="streaming"]',
        '.loading-dots'
      ];
      
      let isStreaming = false;
      for (const indicator of streamingIndicators) {
        if (document.querySelector(indicator)) {
          isStreaming = true;
          break;
        }
      }
      
      // ストリーミングが完了していて、テキストがある場合は返す
      if (!isStreaming && currentText.length > 10) { // 最小10文字以上
        return currentText;
      }
    }

    await sleep(500);
  }

  throw new Error('Timeout waiting for response');
}

// ユーティリティ関数
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ページの準備が完了するまで待つ
async function waitForPageReady(timeout = 10000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    // いずれかの入力要素が見つかればOK
    for (const selector of CLAUDE_SELECTORS.textarea) {
      if (document.querySelector(selector)) {
        await sleep(500); // 追加の安定化待機
        return;
      }
    }
    await sleep(500);
  }
  
  console.warn('Page ready timeout - continuing anyway');
}

// Claude.aiのUIが変更された場合の代替セレクタ
const CLAUDE_SELECTORS = {
  textarea: [
    'textarea[placeholder*="Message Claude"]',
    'textarea[placeholder*="Ask Claude"]',
    'textarea[placeholder*="Talk to Claude"]',
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"]',
    '.ProseMirror',
    'div.ProseMirror[contenteditable="true"]'
  ],
  sendButton: [
    'button[aria-label="Send message"]',
    'button[aria-label="Send"]',
    'button[type="submit"]',
    'button:has(svg path[d*="M2.01 21L23 12"])',
    'button:has(svg path[d*="send"])',
    'button[data-testid="send-button"]',
    'button.send-button',
    'button:has(svg[class*="send"])'
  ],
  newChatButton: [
    'button[aria-label="New chat"]',
    'button[aria-label="Start new chat"]',
    'button:has(svg path[d*="M12 5v14"])',
    'a[href="/new"]',
    'button[data-testid="new-chat"]'
  ],
  messages: [
    '[data-testid="message"]',
    '[data-testid="assistant-message"]',
    '.message-content',
    'div[class*="message"]',
    'div[class*="assistant"]',
    '.conversation-turn',
    'div[data-message-author="assistant"]'
  ]
};