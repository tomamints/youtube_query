# YouTube Learning Assistant 拡張機能テストガイド

## 修正内容

### 1. 字幕取得の改善
- YouTubeのytInitialPlayerResponseを複数の方法で検索
- 空のレスポンスに対するエラーハンドリング追加
- DOM監視による字幕取得のフォールバック実装
- 自動的に字幕を有効にする機能追加

### 2. Claude.ai連携の改善
- 複数のセレクタパターンで入力欄を検索
- ProseMirrorエディタのサポート追加
- ページ読み込み待機機能追加
- より詳細なエラーメッセージ

### 3. バックグラウンドスクリプトの改善
- CORS回避のための字幕取得機能
- デバッグ用の詳細なログ出力

## テスト手順

### 1. 拡張機能の再読み込み
1. `chrome://extensions/` を開く
2. 「YouTube Learning Assistant」を見つける
3. 「更新」ボタンをクリック（または削除して再度読み込み）

### 2. YouTubeでの字幕テスト
1. 字幕がある動画を開く（日本語字幕推奨）
2. F12でデベロッパーツールを開く
3. Consoleタブを確認
4. 以下のログを確認：
   - "Found ytInitialPlayerResponse"
   - "Found caption tracks: [数]"
   - "Starting DOM-based caption observation"（フォールバックの場合）

### 3. Claude.ai連携テスト
1. https://claude.ai にログインする
2. YouTubeで動画を開き、字幕の単語をクリック
3. Consoleで以下を確認：
   - "Found input with selector: [セレクタ名]"
   - エラーが出る場合は具体的なセレクタ情報を確認

## トラブルシューティング

### "Empty caption data received" エラー
- 動画に字幕がない可能性
- 字幕が自動生成のみの場合、手動で字幕ボタンをクリックしてオンにする

### "Claude input not found" エラー
1. Claude.aiにログインしているか確認
2. https://claude.ai/new を開いて新しい会話を開始
3. ページを更新してから再試行

### デバッグ情報の収集
Consoleで以下のコマンドを実行：
```javascript
// YouTube字幕情報の確認
console.log(window.ytInitialPlayerResponse);

// DOM要素の確認
console.log(document.querySelector('.ytp-caption-segment'));
console.log(document.querySelector('.ytp-subtitles-button'));

// Claude.ai要素の確認
console.log(document.querySelector('.ProseMirror'));
console.log(document.querySelector('div[contenteditable="true"]'));
```

## 期待される動作

1. **字幕表示**: YouTubeの動画下部に字幕オーバーレイが表示される
2. **単語クリック**: 字幕の任意の単語をクリックできる
3. **AI回答**: Claude.aiが新しいタブで開き、自動的に質問が入力・送信される
4. **回答表示**: Claude.aiの回答がポップアップで表示される

## フィードバック

問題が解決しない場合は、以下の情報を提供してください：
1. Consoleのエラーメッセージ全文
2. 使用しているYouTube動画のURL
3. ブラウザのバージョン（chrome://version/）