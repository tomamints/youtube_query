# トラブルシューティング

## 確認手順

### 1. コンソールエラーの確認

YouTubeの動画ページで：
1. F12キーで開発者ツールを開く
2. Consoleタブを選択
3. 赤いエラーメッセージを探す

よくあるエラー：
- `Uncaught TypeError: Cannot read property...`
- `Failed to fetch`
- `CORS policy`
- `Extension context invalidated`

### 2. 拡張機能のエラー確認

1. `chrome://extensions/` を開く
2. あなたの拡張機能の「エラー」ボタンがあれば、クリック
3. Service Workerの「詳細を表示」をクリック

### 3. 簡単な診断テスト

コンソールで以下を実行：

```javascript
// 拡張機能が読み込まれているか
console.log('Extension loaded?', typeof chrome.runtime.id !== 'undefined');

// 動画要素があるか
console.log('Video element:', document.querySelector('video'));

// 字幕コンテナがあるか
console.log('Caption container:', document.querySelector('.ytp-caption-window-container'));

// 拡張機能のUI要素
console.log('Our overlay:', document.getElementById('youtube-learning-overlay'));
```

### 4. 最小限のテスト

1. **シンプルな動画で試す**
   - 短い動画（5分以内）
   - 確実に字幕がある動画
   - 例：YouTube Creator チャンネルの動画

2. **字幕を手動でONにする**
   - 動画プレイヤーの設定ボタン
   - 字幕 → 日本語（自動生成）を選択

3. **ページを完全にリロード**
   - Ctrl+F5 (Windows) / Cmd+Shift+R (Mac)

### 5. よくある問題と解決策

| 問題 | 原因 | 解決策 |
|------|------|--------|
| 字幕が表示されない | 字幕データの取得失敗 | 1. 動画に字幕があるか確認<br>2. ページをリロード |
| クリックが反応しない | イベントリスナーの問題 | 拡張機能を再読み込み |
| Claude.aiタブが開かない | 権限の問題 | 拡張機能の権限を確認 |
| エラー: "Cannot read property" | DOM要素が見つからない | YouTubeの読み込み完了を待つ |

### 6. デバッグ情報の収集

問題が解決しない場合、以下の情報を収集：

```javascript
// コンソールで実行
const debugInfo = {
  url: window.location.href,
  videoId: new URLSearchParams(window.location.search).get('v'),
  hasVideo: !!document.querySelector('video'),
  hasCaptions: !!document.querySelector('.ytp-caption-window-container'),
  extensionUI: !!document.getElementById('youtube-learning-overlay'),
  errors: [] // ここに赤いエラーメッセージをコピー
};
console.log(JSON.stringify(debugInfo, null, 2));
```

### 7. 完全リセット手順

どうしても動かない場合：

1. **拡張機能を削除**
   - chrome://extensions/ で削除

2. **ビルドし直し**
   ```bash
   rm -rf dist/
   npm run build
   ```

3. **再インストール**
   - chrome://extensions/
   - Load unpacked → distフォルダ選択

4. **Claude.aiに再ログイン**
   - https://claude.ai でログイン

5. **新しいYouTubeタブで試す**
   - 既存のタブは閉じる
   - 新しいタブで動画を開く