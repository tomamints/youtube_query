# Claude.ai サブスクリプションを使った実装案

## 現状の課題
- APIキーが必要（有料）
- ユーザーが個別にAPIキーを取得する必要がある
- API料金が別途かかる

## 解決策：Claude.aiのWebインターフェースを活用

### アプローチ1: Claude.aiタブ連携
```
YouTube Tab → Chrome Extension → Claude.ai Tab
```

1. **実装方法**
   - ユーザーがClaude.aiにログイン済みであることを前提
   - 拡張機能がClaude.aiのタブを開く/操作する
   - chrome.tabs APIを使用してメッセージを送信

2. **メリット**
   - 追加料金なし（既存のサブスク利用）
   - APIキー不要
   - 使い放題（Proプランの範囲内）

3. **デメリット**
   - Claude.aiタブが必要
   - 少し動作が遅い可能性

### アプローチ2: サイドパネル実装
```javascript
// Chrome Side Panel APIを使用
chrome.sidePanel.setOptions({
  path: 'sidepanel.html',
  enabled: true
});
```

YouTubeの横にClaude.aiを埋め込む形式

### アプローチ3: ブックマークレット風
選択したテキストをClaude.aiに送信する簡易版

## 実装プラン

### Phase 1: シンプルな連携
1. YouTube動画で単語を選択
2. 右クリックメニューから「Claudeに質問」
3. Claude.aiタブが開いて質問が自動入力

### Phase 2: スマートな連携
1. バックグラウンドでClaude.aiタブを管理
2. 質問と回答を拡張機能内で表示
3. 履歴管理

### Phase 3: 完全統合
1. Claude.aiのセッションを維持
2. シームレスな質問・回答体験
3. 学習データの蓄積

## 技術的実装

### content script (claude.ai)
```typescript
// Claude.aiページで動作するスクリプト
function injectQuestion(question: string) {
  const textarea = document.querySelector('textarea');
  if (textarea) {
    textarea.value = question;
    // 送信ボタンをクリック
    const sendButton = document.querySelector('[data-testid="send-button"]');
    sendButton?.click();
  }
}

// 回答を取得
function getResponse(): string {
  const messages = document.querySelectorAll('[data-testid="message"]');
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.textContent || '';
}
```

### メッセージパッシング
```typescript
// YouTube → Background → Claude.ai
chrome.runtime.sendMessage({
  type: 'ASK_CLAUDE',
  question: 'この単語の意味を教えて',
  context: '動画の文脈'
});
```

## ユーザー体験

1. **初回設定**
   - Claude.aiにログイン
   - 拡張機能を有効化

2. **使用方法**
   - YouTube動画で分からない部分をクリック
   - 自動的にClaude.aiが回答
   - 回答はポップアップで表示

3. **利点**
   - 追加料金なし
   - 高品質な回答（Claude-3.5）
   - 会話履歴も保持