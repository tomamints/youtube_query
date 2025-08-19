# 🚀 Chrome Web Store 公開前チェックリスト

## ✅ 必須項目

### 1. アイコン
- [ ] icon16.png (16x16px)
- [ ] icon48.png (48x48px)
- [ ] icon128.png (128x128px)
- [ ] すべてPNG形式で実際の画像

### 2. パッケージ作成
```bash
# ビルド
npm run build

# zipファイル作成
cd educont
zip -r educont-extension.zip dist/
```

### 3. スクリーンショット（最低1枚）
- [ ] 1280x800px または 640x400px
- [ ] 実際の動作画面をキャプチャ

### 4. 説明文
- [ ] 短い説明（132文字以内）
- [ ] 詳細な説明（store-listing.md参照）

### 5. Developer登録
- [ ] $5の登録料支払い
- [ ] 本人確認

## 📋 あると良いもの

### プライバシーポリシー
- GitHubにprivacy-policy.htmlをアップロード
- またはGitHub Pagesで公開

### README.md の更新
```markdown
## インストール

### Chrome Web Store から（推奨）
[Chrome Web Storeでインストール](https://chrome.google.com/webstore/detail/あなたの拡張機能ID)

### 開発者向け
1. このリポジトリをクローン
2. `npm install && npm run build`
3. Chrome拡張機能ページで「パッケージ化されていない拡張機能を読み込む」
```

## 🎉 公開後にやること

1. **SNSで告知**
   - Twitter/X
   - Reddit (r/chrome_extensions)
   - Qiita記事

2. **フィードバック収集**
   - GitHub Issuesを活用
   - レビューに返信

3. **定期アップデート**
   - バグ修正
   - ユーザー要望の実装

## 💡 Tips

- **最初のレビューが重要** → 友達に頼んで使ってもらう
- **説明は具体的に** → 「AIが解説」より「ChatGPTが文脈に合わせて解説」
- **スクショは綺麗に** → 実際の学習シーンを撮影

## 🚨 注意点

- APIキーは絶対に含めない
- 著作権のある画像は使わない
- YouTubeの規約を守る（ダウンロード機能など禁止）

---

準備ができたら公開しましょう！
無料でも多くの人に使ってもらえる良いツールです。