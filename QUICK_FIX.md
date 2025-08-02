# 🚨 緊急修正手順

## 問題
- `content.js:2` でエラーが発生
- webpackのビルドが遅い/失敗する

## 解決手順

### 1. プロセスをクリーンアップ
```bash
# 既存のwebpackプロセスを終了
pkill -f webpack

# node_modulesとdistを削除
rm -rf node_modules dist
```

### 2. 依存関係を再インストール
```bash
npm install
```

### 3. シンプルなビルドを実行
```bash
# 最小構成でビルド
NODE_ENV=production npx webpack --mode production --no-devtool
```

### 4. もしまだ動かない場合

#### A. 最小限のcontent.jsを手動作成
`dist/content.js` として以下を保存：
```javascript
console.log('YouTube Learning Assistant loaded!');
```

#### B. 拡張機能を再読み込み
1. chrome://extensions/
2. 更新ボタンをクリック

#### C. YouTubeで確認
- 新しいタブでYouTube動画を開く
- コンソールでメッセージを確認

### 5. 段階的に機能を追加

問題が解決したら、少しずつ機能を追加：

1. **基本的な字幕取得**
2. **UIの表示**
3. **クリック機能**
4. **Claude連携**

## 代替案：Chrome DevToolsでデバッグ

1. **Sources タブ**
   - content.js を探す
   - エラーが起きている行を確認

2. **Network タブ**
   - 失敗しているリクエストを確認
   - CORSエラーなどをチェック

3. **Console タブ**
   - 詳細なエラーメッセージ
   - スタックトレース

## 最終手段：別のブラウザでテスト

1. **Microsoft Edge**（Chromium版）
   - 同じ拡張機能が動作
   - edge://extensions/

2. **Brave Browser**
   - プライバシー設定が原因の可能性
   - brave://extensions/