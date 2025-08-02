import { handleAIRequest } from './ai-handler';
import { handleClaudeRequest } from './claude-handler';
import { handleClaudeDirectRequest } from './claude-direct-handler';
import { handleClaudeLocalServerRequest } from './claude-local-server-handler';
import { handleScreenshotAndAsk } from './screenshot-handler';
import { handleInstantAnswer } from './instant-answer-handler';
import { handleClaudeAPIRequest, validateClaudeAPIKey } from './claude-api-handler';
import { handleClaudeSubscriptionRequest } from './claude-subscription-handler';

console.log('🎓 YouTube Learning Assistant: Service worker started!');

// 拡張機能インストール時
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details);
  
  // デフォルト設定を保存
  chrome.storage.local.set({
    settings: {
      language: 'ja',
      theme: 'light',
      apiKey: '',
      apiProvider: 'instant'  // デフォルトを即答モードに
    }
  });
});

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Message received:', request);
  
  switch (request.type) {
    case 'GET_SETTINGS':
      chrome.storage.local.get(['settings'], (result) => {
        sendResponse(result.settings || {});
      });
      return true; // 非同期レスポンスのため
      
    case 'SAVE_SETTINGS':
      chrome.storage.local.set({ settings: request.settings }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'ASK_AI':
      handleAIRequest(request, sendResponse);
      return true; // 非同期処理
      
    case 'ASK_CLAUDE':
      handleClaudeRequest(request, sendResponse);
      return true; // 非同期処理
      
    case 'ASK_CLAUDE_DIRECT':
      handleClaudeDirectRequest(request, sendResponse);
      return true; // 非同期処理
      
    case 'ASK_CLAUDE_LOCAL':
      handleClaudeLocalServerRequest(request, sendResponse);
      return true; // 非同期処理
      
    case 'SCREENSHOT_AND_ASK':
      handleScreenshotAndAsk(request, sendResponse);
      return true; // 非同期処理
      
    case 'INSTANT_ANSWER':
      handleInstantAnswer(request, sendResponse);
      return true; // 即座に返答
      
    case 'CLAUDE_API':
      handleClaudeAPIRequest(request, sendResponse);
      return true; // 非同期処理
      
    case 'CLAUDE_SUBSCRIPTION':
      handleClaudeSubscriptionRequest(request, sendResponse);
      return true; // 非同期処理
      
    case 'VALIDATE_API_KEY':
      validateClaudeAPIKey(request.apiKey).then(isValid => {
        sendResponse({ isValid });
      });
      return true; // 非同期処理
      
    case 'FETCH_CAPTIONS':
      // CORS回避のための字幕取得
      console.log('Fetching captions from:', request.url);
      
      // YouTubeの字幕APIにはリファラーとOriginヘッダーが必要
      fetch(request.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'ja,en;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        credentials: 'omit' // クッキーを送信しない
      })
        .then(response => {
          console.log('Caption response status:', response.status);
          console.log('Caption response headers:', response.headers.get('content-type'));
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return response.text();
        })
        .then(data => {
          console.log('Caption data length:', data.length);
          console.log('Caption data preview:', data.substring(0, 200));
          sendResponse({ data });
        })
        .catch(error => {
          console.error('Caption fetch error:', error);
          sendResponse({ error: error.message });
        });
      return true; // 非同期処理
      
    default:
      sendResponse({ error: 'Unknown message type' });
      return true;
  }
});

// エラーハンドリング
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event);
});

export {};