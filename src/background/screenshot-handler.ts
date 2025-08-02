// スクリーンショット撮影とClaude.aiへの転送

export async function handleScreenshotAndAsk(
  request: any,
  sendResponse: (response: any) => void
) {
  try {
    const { word, context, videoTitle } = request;
    
    console.log('Taking screenshot and opening Claude.ai...');
    
    // 現在のタブのスクリーンショットを撮る
    const screenshot = await chrome.tabs.captureVisibleTab(
      chrome.windows.WINDOW_ID_CURRENT,
      { format: 'png' }
    );
    
    // スクリーンショットをデータURLからBlobに変換（現在は使用しないがドラッグ&ドロップ用に準備）
    // const response = await fetch(screenshot);
    // const blob = await response.blob();
    
    // Claude.aiの新しいタブを開く
    const claudeTab = await chrome.tabs.create({
      url: 'https://claude.ai/new',
      active: true
    });
    
    // Claude.aiが読み込まれるのを待つ
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // プロンプトを作成
    const prompt = createClaudePrompt(word, context, videoTitle);
    
    // Claude.aiのタブにメッセージを送信
    await chrome.tabs.sendMessage(claudeTab.id!, {
      type: 'INJECT_SCREENSHOT_AND_PROMPT',
      prompt,
      screenshotDataUrl: screenshot,
      word,
      context
    });
    
    sendResponse({ 
      success: true, 
      message: 'Claude.aiを開きました。画像とプロンプトを自動入力しています...' 
    });
    
  } catch (error) {
    console.error('Screenshot and ask error:', error);
    sendResponse({ 
      error: error instanceof Error ? error.message : 'スクリーンショット撮影エラー' 
    });
  }
}

// Claudeへのプロンプトを作成
function createClaudePrompt(word: string, context: string, videoTitle: string): string {
  return `YouTube動画を見ていて分からない単語がありました。スクリーンショットを添付します。

【動画情報】
タイトル: ${videoTitle}
文脈: ${context}

【質問】
スクリーンショットの中で「${word}」という単語/表現について詳しく教えてください。

以下の観点から説明をお願いします：
1. 一般的な意味・定義
2. この動画の文脈での具体的な意味
3. スクリーンショットの映像との関連性
4. 動画のジャンルに特有の使われ方
5. 関連する知識や背景情報
6. 初学者にも分かりやすい例

スクリーンショットから読み取れる情報も含めて、分かりやすく説明してください。`;
}