// Claude Codeローカルサーバー通信ハンドラー

const CLAUDE_SERVER_URL = 'http://localhost:3456';

export async function handleClaudeLocalServerRequest(
  request: any,
  sendResponse: (response: any) => void
) {
  try {
    const { word, context, videoTitle } = request;
    
    console.log('Claude Code Serverに質問を送信:', { word });
    
    // ローカルサーバーにPOSTリクエスト
    const response = await fetch(`${CLAUDE_SERVER_URL}/ask-claude`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        word,
        context,
        videoTitle
      })
    });
    
    if (!response.ok) {
      // サーバーが起動していない場合のエラーハンドリング
      if (!response.status || response.status === 0) {
        throw new Error('Claude Code Serverが起動していません。\n\nサーバーを起動するには：\n1. ターミナルで educont/server フォルダに移動\n2. npm install を実行\n3. npm start を実行');
      }
      throw new Error(`サーバーエラー: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    console.log('Claude Codeからの回答を受信');
    sendResponse({ answer: data.answer });
    
  } catch (error) {
    console.error('Claude local server request error:', error);
    
    // より詳細なエラーメッセージ
    let errorMessage = 'Claude Code実行エラー';
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      errorMessage = `Claude Code Serverに接続できません。

サーバーを起動してください：
1. 新しいターミナルを開く
2. cd ~/educont/server
3. npm install (初回のみ)
4. npm start

サーバーが起動したら、もう一度単語をクリックしてください。`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    sendResponse({ 
      error: errorMessage
    });
  }
}

// サーバーのヘルスチェック
export async function checkClaudeServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${CLAUDE_SERVER_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}