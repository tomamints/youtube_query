// Claude.aiのページに注入されるコンテンツスクリプト
// サブスクリプションの認証を使って直接APIと通信

console.log('Claude.ai injector loaded');

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'INJECT_QUESTION') {
    handleClaudeQuestion(request.question)
      .then(answer => sendResponse({ answer }))
      .catch(error => sendResponse({ error: error.message }));
    return true; // 非同期レスポンス
  }
  return false;
});

// Claude.aiのAPIを直接呼び出す
async function handleClaudeQuestion(question: string): Promise<string> {
  try {
    // Claude.aiのページから認証情報を取得
    const authToken = await getAuthToken();
    if (!authToken) {
      throw new Error('Claude.aiにログインしてください');
    }

    // 組織IDを取得
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      throw new Error('組織IDが見つかりません');
    }

    // 新しい会話を作成
    const conversationId = await createConversation(authToken, organizationId);
    
    // メッセージを送信して応答を取得
    const answer = await sendMessage(authToken, organizationId, conversationId, question);
    
    return answer;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

// 認証トークンを取得
async function getAuthToken(): Promise<string | null> {
  // sessionStorageから取得を試みる
  const sessionToken = sessionStorage.getItem('token');
  if (sessionToken) return sessionToken;

  // localStorageから取得を試みる
  const localToken = localStorage.getItem('token');
  if (localToken) return localToken;

  // Cookieから取得を試みる
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'claude_token' || name === 'session_token') {
      return value;
    }
  }

  // APIコールをインターセプトして取得
  return await interceptAuthToken();
}

// 組織IDを取得
async function getOrganizationId(): Promise<string | null> {
  // ローカルストレージから取得
  const orgData = localStorage.getItem('claude_organization');
  if (orgData) {
    try {
      const parsed = JSON.parse(orgData);
      return parsed.id || parsed.organization_id;
    } catch {}
  }

  // ページのグローバル変数から取得
  if ((window as any).__CLAUDE_ORGANIZATION_ID__) {
    return (window as any).__CLAUDE_ORGANIZATION_ID__;
  }

  // APIから取得
  return await fetchOrganizationId();
}

// APIコールをインターセプトして認証トークンを取得
async function interceptAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      
      // Authorization headerをチェック
      // const _request = args[0] as Request | string;
      const init = args[1] as RequestInit | undefined;
      
      if (init?.headers) {
        const headers = new Headers(init.headers);
        const auth = headers.get('Authorization');
        if (auth && auth.startsWith('Bearer ')) {
          window.fetch = originalFetch; // 元に戻す
          resolve(auth.replace('Bearer ', ''));
        }
      }
      
      return response;
    };
    
    // タイムアウト
    setTimeout(() => {
      window.fetch = originalFetch;
      resolve(null);
    }, 5000);
  });
}

// 組織IDをAPIから取得
async function fetchOrganizationId(): Promise<string | null> {
  try {
    const response = await fetch('https://claude.ai/api/organizations', {
      credentials: 'include'
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data && data[0] && data[0].id) {
      return data[0].id;
    }
  } catch (error) {
    console.error('Failed to fetch organization ID:', error);
  }
  
  return null;
}

// 新しい会話を作成
async function createConversation(authToken: string, organizationId: string): Promise<string> {
  const response = await fetch(`https://claude.ai/api/organizations/${organizationId}/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name: 'YouTube Learning Assistant',
      model: 'claude-3-sonnet'
    })
  });

  if (!response.ok) {
    throw new Error(`会話の作成に失敗しました: ${response.status}`);
  }

  const data = await response.json();
  return data.id || data.conversation_id;
}

// メッセージを送信して応答を取得
async function sendMessage(
  authToken: string, 
  organizationId: string, 
  conversationId: string, 
  message: string
): Promise<string> {
  const response = await fetch(`https://claude.ai/api/organizations/${organizationId}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      'Accept': 'text/event-stream',
    },
    credentials: 'include',
    body: JSON.stringify({
      message: message,
      attachments: []
    })
  });

  if (!response.ok) {
    throw new Error(`メッセージ送信に失敗しました: ${response.status}`);
  }

  // Server-Sent Eventsのストリームを読む
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('レスポンスの読み取りに失敗しました');
  }

  const decoder = new TextDecoder();
  let fullAnswer = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content' && data.content) {
            fullAnswer += data.content;
          } else if (data.type === 'message_stop') {
            return fullAnswer;
          }
        } catch (e) {
          // JSONパースエラーは無視
        }
      }
    }
  }
  
  return fullAnswer || 'レスポンスを取得できませんでした';
}

// ページ上のUI要素を使って質問を送信する代替方法
// @ts-ignore: 未使用の関数（将来の実装用）
async function _sendQuestionViaUI(question: string): Promise<string> {
  // テキストエリアを探す
  const textarea = document.querySelector('textarea[placeholder*="Message"]') as HTMLTextAreaElement;
  if (!textarea) {
    throw new Error('メッセージ入力欄が見つかりません');
  }

  // 質問を入力
  textarea.value = question;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));

  // 送信ボタンを探してクリック
  const sendButton = document.querySelector('button[aria-label*="Send"]') as HTMLButtonElement;
  if (!sendButton) {
    throw new Error('送信ボタンが見つかりません');
  }

  sendButton.click();

  // レスポンスを待つ（最大30秒）
  return await waitForResponse(30000);
}

// レスポンスを待つ
async function waitForResponse(timeout: number): Promise<string> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    // 最新のメッセージを探す
    const messages = document.querySelectorAll('[data-testid="message"]');
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage && lastMessage.textContent && !lastMessage.querySelector('.loading')) {
      const text = lastMessage.textContent.trim();
      if (text && text !== '') {
        return text;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error('タイムアウト: レスポンスを取得できませんでした');
}

export {};