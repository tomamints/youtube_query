// Claude.ai連携用ハンドラー

export async function handleClaudeRequest(
  request: { word: string; context: string; videoTitle?: string },
  sendResponse: (response: any) => void
): Promise<void> {
  try {
    // Claude.aiタブを開く/取得
    const tabs = await chrome.tabs.query({ url: 'https://claude.ai/*' });
    let claudeTabId: number;

    if (tabs.length > 0 && tabs[0].id) {
      claudeTabId = tabs[0].id;
      // 既存タブをアクティブに
      await chrome.tabs.update(claudeTabId, { active: true });
    } else {
      // 新しいタブを作成
      const newTab = await chrome.tabs.create({
        url: 'https://claude.ai/new',
        active: false
      });
      
      if (!newTab.id) {
        throw new Error('Failed to create Claude tab');
      }
      
      claudeTabId = newTab.id;
      
      // ページ読み込みを待つ
      await waitForTabLoad(claudeTabId);
    }

    // 質問をフォーマット
    const formattedQuestion = formatQuestion(request.word, request.context, request.videoTitle);

    // Claude.aiに質問を送信
    const response = await chrome.tabs.sendMessage(claudeTabId, {
      type: 'INJECT_QUESTION',
      question: formattedQuestion
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // 履歴に保存
    await saveToHistory(request.word, response.answer, request.videoTitle);

    sendResponse({ answer: response.answer });
  } catch (error) {
    console.error('Claude request error:', error);
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Claude連携エラーが発生しました' 
    });
  }
}

// タブの読み込み完了を待つ
function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    const listener = (id: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (id === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        setTimeout(resolve, 1000); // Claude.aiのJS読み込みを待つ
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// 質問をフォーマット（より詳細な文脈付き）
function formatQuestion(word: string, context: string, videoTitle?: string): string {
  // 動画のジャンルを推測
  const genre = detectVideoGenre(videoTitle || '');
  
  return `YouTube動画を見ていて、意味が分からない単語がありました。詳しく教えてください。

【動画情報】
タイトル: ${videoTitle || '不明'}
ジャンル: ${genre}

【文脈】
${context}

【質問】
「${word}」について、以下の観点から詳しく説明してください：

1. 一般的な意味・定義
2. この動画の文脈での具体的な意味
3. ${genre === 'コント・お笑い' ? 'お笑いやコントでの使われ方' : ''}
4. ${genre === 'ホラーゲーム' ? 'ホラーゲームでの意味や効果' : ''}
5. 関連する知識や背景情報
6. 類似の表現や言い換え

分かりやすく、詳しく説明してください。専門用語を使う場合は、その説明も含めてください。`;
}

// 動画のジャンルを推測
function detectVideoGenre(title: string): string {
  if (title.includes('コント') || title.includes('お笑い') || title.includes('漫才')) {
    return 'コント・お笑い';
  } else if (title.includes('ホラー') || title.includes('怖い') || title.includes('殺人')) {
    return 'ホラーゲーム';
  } else if (title.includes('料理') || title.includes('レシピ')) {
    return '料理';
  } else if (title.includes('プログラミング') || title.includes('開発')) {
    return 'プログラミング';
  } else if (title.includes('ゲーム') || title.includes('実況')) {
    return 'ゲーム実況';
  }
  return '一般';
}

// 学習履歴を保存
async function saveToHistory(word: string, answer: string, videoTitle?: string): Promise<void> {
  try {
    const { history = [] } = await chrome.storage.local.get(['history']);
    
    history.unshift({
      word,
      answer,
      videoTitle,
      timestamp: new Date().toISOString(),
      source: 'claude'
    });

    // 最新100件のみ保持
    const limitedHistory = history.slice(0, 100);
    
    await chrome.storage.local.set({ history: limitedHistory });
  } catch (error) {
    console.error('Failed to save history:', error);
  }
}