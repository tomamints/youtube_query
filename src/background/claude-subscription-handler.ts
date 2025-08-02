// Claude.aiサブスクリプション認証を使用したハンドラー

export async function handleClaudeSubscriptionRequest(
  request: any,
  sendResponse: (response: any) => void
) {
  try {
    const { word, context, videoTitle } = request;
    
    // Claude.aiのタブを探す
    const tabs = await chrome.tabs.query({ url: 'https://claude.ai/*' });
    let claudeTab = tabs[0];
    
    if (!claudeTab || !claudeTab.id) {
      // Claude.aiを新しいタブで開く
      claudeTab = await chrome.tabs.create({
        url: 'https://claude.ai/new',
        active: false
      });
      
      // ページ読み込みを待つ
      await waitForTabLoad(claudeTab.id!);
    }
    
    // 質問をフォーマット
    const formattedQuestion = formatQuestion(word, context, videoTitle);
    
    // Claude.aiのページに質問を送信
    const response = await chrome.tabs.sendMessage(claudeTab.id!, {
      type: 'INJECT_QUESTION',
      question: formattedQuestion
    });
    
    if (response?.error) {
      throw new Error(response.error);
    }
    
    if (response?.answer) {
      sendResponse({ 
        answer: response.answer,
        source: 'claude-subscription'
      });
    } else {
      throw new Error('回答を取得できませんでした');
    }
    
  } catch (error) {
    console.error('Claude subscription error:', error);
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Claude.ai連携エラー' 
    });
  }
}

// タブの読み込み完了を待つ
function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    const checkTab = async () => {
      const tab = await chrome.tabs.get(tabId);
      if (tab.status === 'complete') {
        // Claude.aiのスクリプトが完全に読み込まれるまで少し待つ
        setTimeout(resolve, 2000);
        return;
      }
      setTimeout(checkTab, 500);
    };
    checkTab();
  });
}

// 質問をフォーマット
function formatQuestion(word: string, context: string, videoTitle?: string): string {
  const theme = detectVideoTheme(context, videoTitle);
  
  return `YouTube動画を視聴中に分からない単語がありました。

【動画情報】
- タイトル: ${videoTitle || '不明'}
- テーマ: ${theme}
- 文脈: ${context}

【質問】
「${word}」について詳しく教えてください。

以下の観点から説明してください：
1. 基本的な意味・定義
2. この動画の文脈での具体的な意味
3. 関連する知識や背景情報
4. 例文や使用例
5. ${theme}分野での専門的な意味（もしあれば）

分かりやすく、教育的な説明をお願いします。`;
}

// 動画のテーマを検出
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
  if (allText.includes('ゲーム') || allText.includes('実況')) {
    return 'ゲーム';
  }
  
  return '一般';
}