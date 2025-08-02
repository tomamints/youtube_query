// Claude.ai連携モジュール

export class ClaudeConnector {

  // Claude.aiタブを開く/取得
  async getOrCreateClaudeTab(): Promise<number> {
    // 既存のClaude.aiタブを探す
    const tabs = await chrome.tabs.query({ url: 'https://claude.ai/*' });
    
    if (tabs.length > 0 && tabs[0].id) {
      return tabs[0].id;
    }

    // なければ新しいタブを作成
    const newTab = await chrome.tabs.create({
      url: 'https://claude.ai/new',
      active: false // バックグラウンドで開く
    });

    if (newTab.id) {
      // ページの読み込みを待つ
      await this.waitForTabLoad(newTab.id);
      
      return newTab.id;
    }

    throw new Error('Failed to create Claude tab');
  }

  // タブの読み込み完了を待つ
  private waitForTabLoad(tabId: number): Promise<void> {
    return new Promise((resolve) => {
      const listener = (id: number, changeInfo: chrome.tabs.TabChangeInfo) => {
        if (id === tabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
  }

  // Claude.aiに質問を送信
  async askQuestion(question: string, context: string): Promise<string> {
    const tabId = await this.getOrCreateClaudeTab();
    
    // フォーマットされた質問を作成
    const formattedQuestion = this.formatQuestion(question, context);
    
    // Claude.aiタブにメッセージを送信
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'INJECT_QUESTION',
      question: formattedQuestion
    });

    return response.answer || 'No response received';
  }

  // 質問をフォーマット
  private formatQuestion(word: string, context: string): string {
    return `YouTube動画の学習中に出てきた以下の内容について説明してください：

対象: "${word}"
文脈: "${context}"

初学者にもわかりやすく、簡潔に説明してください。`;
  }
}

// シングルトンインスタンス
export const claudeConnector = new ClaudeConnector();