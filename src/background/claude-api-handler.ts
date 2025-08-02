// Claude API SDK を使った実際のAPI呼び出し
import Anthropic from '@anthropic-ai/sdk';

// Claude APIクライアントの初期化
let claudeClient: Anthropic | null = null;

// APIキーの取得と初期化
async function initializeClaudeClient(): Promise<Anthropic | null> {
  const { settings } = await chrome.storage.local.get(['settings']);
  const apiKey = settings?.claudeApiKey;
  
  if (!apiKey) {
    console.error('Claude API key not found');
    return null;
  }
  
  if (!claudeClient || claudeClient.apiKey !== apiKey) {
    claudeClient = new Anthropic({
      apiKey: apiKey,
      // Chrome拡張機能では fetch API を使用
      fetch: fetch.bind(self),
    });
  }
  
  return claudeClient;
}

// 動画コンテキストに基づいたシステムプロンプトを生成
function generateSystemPrompt(videoTitle: string, theme: string): string {
  return `あなたは教育用YouTubeアシスタントです。視聴者が動画内の単語について質問してきます。

動画情報:
- タイトル: ${videoTitle}
- テーマ: ${theme}

以下の点に注意して回答してください：
1. 簡潔で分かりやすい説明を心がける
2. 動画のコンテキストに合わせた説明をする
3. 必要に応じて例を含める
4. 専門用語は分かりやすく解説する
5. 日本語で回答する`;
}

// Claude APIを呼び出して回答を生成
export async function handleClaudeAPIRequest(
  request: any,
  sendResponse: (response: any) => void
) {
  try {
    const { word, context, videoTitle } = request;
    
    // Claude APIクライアントを初期化
    const client = await initializeClaudeClient();
    
    if (!client) {
      // APIキーがない場合は、インスタント回答にフォールバック
      const { handleInstantAnswer } = await import('./instant-answer-handler');
      handleInstantAnswer(request, sendResponse);
      return;
    }
    
    // 動画のテーマを検出
    const theme = detectVideoTheme(context, videoTitle);
    
    // プロンプトを構築
    const userPrompt = `動画の文脈: "${context}"

質問: 「${word}」とは何ですか？この動画の文脈で説明してください。`;
    
    try {
      // Claude APIを呼び出し
      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307', // 高速で安価なモデル
        max_tokens: 500,
        temperature: 0.7,
        system: generateSystemPrompt(videoTitle, theme),
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });
      
      // レスポンスからテキストを抽出
      const answer = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '回答を生成できませんでした。';
      
      sendResponse({ 
        answer,
        source: 'claude-api'
      });
      
    } catch (apiError: any) {
      console.error('Claude API error:', apiError);
      
      // APIエラーの場合は、より詳しいエラーメッセージを返す
      if (apiError.status === 401) {
        sendResponse({ 
          error: 'APIキーが無効です。設定画面でAPIキーを確認してください。' 
        });
      } else if (apiError.status === 429) {
        sendResponse({ 
          error: 'API利用制限に達しました。しばらく待ってから再試行してください。' 
        });
      } else {
        // その他のエラーの場合は、インスタント回答にフォールバック
        const { handleInstantAnswer } = await import('./instant-answer-handler');
        handleInstantAnswer(request, sendResponse);
      }
    }
    
  } catch (error) {
    console.error('Claude API handler error:', error);
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Claude API呼び出しエラー' 
    });
  }
}

// 動画のテーマを検出（instant-answer-handlerと同じロジック）
function detectVideoTheme(context: string, videoTitle?: string): string {
  const allText = `${context} ${videoTitle || ''}`.toLowerCase();
  
  if (allText.includes('ai') || allText.includes('人工知能') || allText.includes('機械学習')) {
    return 'AI・機械学習';
  }
  if (allText.includes('プログラ') || allText.includes('コード') || allText.includes('開発')) {
    return 'プログラミング';
  }
  if (allText.includes('ビジネス') || allText.includes('マーケ') || allText.includes('経営')) {
    return 'ビジネス';
  }
  if (allText.includes('英語') || allText.includes('english') || allText.includes('言語')) {
    return '語学学習';
  }
  if (allText.includes('数学') || allText.includes('算数') || allText.includes('計算')) {
    return '数学';
  }
  if (allText.includes('料理') || allText.includes('レシピ') || allText.includes('作り方')) {
    return '料理';
  }
  
  return '一般';
}

// 設定画面用：APIキーの検証
export async function validateClaudeAPIKey(apiKey: string): Promise<boolean> {
  try {
    const client = new Anthropic({
      apiKey: apiKey,
      fetch: fetch.bind(self),
    });
    
    // 簡単なテストメッセージを送信
    const response = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: 'Hello'
        }
      ]
    });
    
    return response.content.length > 0;
  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
}