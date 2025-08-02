// AI APIハンドラー

interface AIRequest {
  type: 'ASK_AI';
  word: string;
  context: string;
  videoTitle?: string;
}

interface Settings {
  apiKey: string;
  apiProvider: 'instant' | 'openai' | 'claude-api' | 'claude-subscription' | 'claude-screenshot' | 'claude-local';
  language: string;
}

// Claude APIを呼び出す
async function callClaudeAPI(apiKey: string, prompt: string): Promise<string> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // 高速で安価なモデル
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}

// OpenAI APIを呼び出す
async function callOpenAIAPI(apiKey: string, prompt: string): Promise<string> {
  try {
    console.log('OpenAI API Request:', {
      apiKeyPrefix: apiKey.substring(0, 7) + '...',
      promptLength: prompt.length
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    console.log('OpenAI API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error Response:', errorText);
      
      let errorMessage = 'OpenAI APIエラー';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        errorMessage = errorText;
      }
      
      throw new Error(`${response.status}: ${errorMessage}`);
    }

    const data = await response.json();
    console.log('OpenAI API Success:', { 
      model: data.model,
      usage: data.usage 
    });
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('OpenAI APIから有効な応答がありません');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API error details:', error);
    throw error;
  }
}

// プロンプトを生成
function generatePrompt(word: string, context: string, videoTitle: string | undefined, language: string): string {
  const langInstruction = language === 'ja' 
    ? '日本語で回答してください。' 
    : 'Please respond in English.';

  // wordがすでにプロンプトとして整形されている場合（「この動画の文脈における」で始まる場合）
  if (word.includes('この動画の文脈における') || word.includes('動画の内容:')) {
    return `${word}\n\n${langInstruction}`;
  }
  
  // 通常の質問の場合（チャットのフォローアップ質問など）
  if (!context.includes('ユーザー:') && !context.includes('アシスタント:')) {
    // 初回の単語クリック（旧形式のフォールバック）
    return `
YouTube動画の学習支援として、以下の単語・フレーズについて説明してください。

動画タイトル: ${videoTitle || '不明'}
文脈: ${context}
質問された単語/フレーズ: "${word}"

${langInstruction}
学習者にとってわかりやすく、動画の文脈に即した説明を提供してください。
専門用語は避け、必要に応じて例を含めてください。
`;
  }
  
  // チャットのフォローアップ質問の場合
  return `${context}\n\n${langInstruction}`;
}

// AIリクエストを処理
export async function handleAIRequest(
  request: AIRequest, 
  sendResponse: (response: any) => void
): Promise<void> {
  try {
    // 設定を取得
    const result = await chrome.storage.local.get(['settings']);
    const settings: Settings = result.settings;
    
    console.log('AI Handler - Settings:', settings);

    if (!settings?.apiKey) {
      sendResponse({ 
        error: 'APIキーが設定されていません。拡張機能の設定画面でAPIキーを入力してください。' 
      });
      return;
    }
    
    // OpenAI用の設定確認
    if (settings.apiProvider === 'openai' && !settings.apiKey.startsWith('sk-')) {
      sendResponse({ 
        error: 'OpenAI APIキーの形式が正しくありません。"sk-"で始まるキーを入力してください。' 
      });
      return;
    }

    // プロンプトを生成
    const prompt = generatePrompt(
      request.word,
      request.context,
      request.videoTitle,
      settings.language
    );

    console.log('Sending prompt to AI:', prompt);

    // APIを呼び出す
    let answer: string;
    if (settings.apiProvider === 'openai') {
      console.log('Calling OpenAI API...');
      answer = await callOpenAIAPI(settings.apiKey, prompt);
    } else if (settings.apiProvider === 'claude-api') {
      console.log('Calling Claude API...');
      answer = await callClaudeAPI(settings.apiKey, prompt);
    } else {
      sendResponse({ 
        error: `サポートされていないAPIプロバイダー: ${settings.apiProvider}` 
      });
      return;
    }

    // 学習履歴に保存（オプション）
    await saveToHistory(request.word, answer, request.videoTitle);

    sendResponse({ answer });
  } catch (error) {
    console.error('AI request error:', error);
    sendResponse({ 
      error: error instanceof Error ? error.message : 'AI APIの呼び出しに失敗しました。' 
    });
  }
}

// 学習履歴を保存
async function saveToHistory(word: string, answer: string, videoTitle?: string): Promise<void> {
  try {
    const { history = [] } = await chrome.storage.local.get(['history']);
    
    history.unshift({
      word,
      answer,
      videoTitle,
      timestamp: new Date().toISOString()
    });

    // 最新100件のみ保持
    const limitedHistory = history.slice(0, 100);
    
    await chrome.storage.local.set({ history: limitedHistory });
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}