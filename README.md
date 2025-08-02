# YouTube学習アシスタント Chrome拡張機能

YouTube動画を見ながら、わからない単語や概念をその場でAIに質問できる学習支援ツールです。

## 機能

- 🎥 YouTube動画の字幕/文字起こしを取得
- 🖱️ 字幕内の単語やフレーズをクリックして質問
- 🤖 ChatGPT APIを使った即座の説明
- 📝 学習履歴の保存
- 🌙 ダーク/ライトモード対応

## 開発環境のセットアップ

### 必要なもの
- Node.js 16以上
- Chrome ブラウザ
- OpenAI APIキー（ChatGPT利用用）

### インストール手順

1. リポジトリをクローン
```bash
git clone [repository-url]
cd educont
```

2. 依存関係をインストール
```bash
npm install
```

3. 開発ビルドを実行
```bash
npm run dev
```

4. Chromeで拡張機能を読み込み
   - `chrome://extensions/` を開く
   - 「デベロッパーモード」を有効化
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `dist` フォルダを選択

## 開発コマンド

```bash
# 開発モード（ファイル変更を監視）
npm run dev

# プロダクションビルド
npm run build

# TypeScriptの型チェック
npm run type-check

# ESLintでコードチェック
npm run lint

# コードフォーマット
npm run format
```

## プロジェクト構造

```
educont/
├── src/
│   ├── content/        # YouTubeページに注入されるスクリプト
│   ├── background/     # バックグラウンドサービスワーカー
│   ├── popup/         # 拡張機能のポップアップUI
│   └── common/        # 共通ユーティリティ
├── assets/            # アイコンなどの静的ファイル
├── dist/             # ビルド出力
└── manifest.json     # 拡張機能マニフェスト
```

## 使い方

1. 拡張機能をインストール後、ポップアップからOpenAI APIキーを設定
2. YouTube動画を開く
3. 字幕が表示されたら、わからない単語をクリック
4. AIからの説明がポップアップで表示される

## トラブルシューティング

- **拡張機能が動作しない**: コンソールでエラーを確認
- **字幕が取得できない**: 動画に字幕が設定されているか確認
- **API呼び出しエラー**: APIキーが正しく設定されているか確認

## ライセンス

MIT