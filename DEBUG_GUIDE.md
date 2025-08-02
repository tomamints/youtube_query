# デバッグガイド

## 現在の状態確認

### 1. コンソールで確認すべきログ

YouTubeの動画ページで開発者ツールを開き、以下を確認：

```javascript
// 拡張機能が読み込まれているか
"🎓 YouTube Learning Assistant: Content script loaded!"

// 動画が検出されているか
"📺 Video page detected!"

// 字幕取得の状態
"Getting captions for video: [VIDEO_ID]"
"Found caption tracks: [数]"
"Selected track: [トラック情報]"
"Caption response length: [長さ]"
"Loaded [数] captions via smart extraction"
```

### 2. よくあるエラーと対処法

#### A. "Error parsing caption JSON"
- 原因：字幕データが空または不正な形式
- 対処：
  1. 動画に字幕があるか確認（設定→字幕）
  2. 別の動画で試す
  3. 手動で字幕をONにしてから再読み込み

#### B. "ytInitialPlayerResponse not found"
- 原因：YouTubeのページ構造が変更された
- 対処：ページを再読み込みして再試行

#### C. 字幕が表示されない
- 原因：
  1. 字幕データの取得失敗
  2. UIの描画エラー
  3. CSSの読み込み失敗

### 3. 手動テスト手順

1. **拡張機能の状態確認**
   ```
   chrome://extensions/
   - エラーが表示されていないか
   - 「Service Worker」をクリックしてログ確認
   ```

2. **簡単な動画でテスト**
   - 短い動画
   - 日本語字幕がある動画
   - 例：YouTube公式チャンネルの動画

3. **段階的な確認**
   - まず字幕の取得を確認
   - 次にUIの表示を確認
   - 最後にクリック機能を確認

### 4. 緊急時の対処

もし何も動作しない場合：

1. **拡張機能をリロード**
   ```
   chrome://extensions/ → 更新ボタン
   ```

2. **キャッシュクリア**
   ```
   Ctrl+Shift+R（Windows）
   Cmd+Shift+R（Mac）
   ```

3. **拡張機能を削除して再インストール**
   ```
   1. chrome://extensions/で削除
   2. npm run build
   3. 再度「Load unpacked」
   ```

### 5. ログ収集用コード

コンソールで以下を実行して状態を確認：

```javascript
// 現在の字幕データを確認
console.log('Current captions:', window.currentCaptions);

// YouTube APIの状態を確認
console.log('YouTube player:', document.querySelector('video'));

// 拡張機能のDOM要素を確認
console.log('Overlay:', document.getElementById('youtube-learning-overlay'));
console.log('Popup:', document.getElementById('youtube-learning-popup'));
```