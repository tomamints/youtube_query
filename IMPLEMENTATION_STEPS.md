# 実装手順書 - ステップバイステップガイド

## Step 1: プロジェクト初期化（30分）

### 1.1 ディレクトリ構造作成
```bash
mkdir -p src/{content,background,popup,common}
mkdir -p src/content/components
mkdir -p assets/icons
mkdir -p dist
```

### 1.2 package.json作成
```json
{
  "name": "educont-youtube-learning",
  "version": "0.1.0",
  "description": "YouTube動画で学習を支援するChrome拡張機能",
  "scripts": {
    "dev": "webpack --watch --mode development",
    "build": "webpack --mode production",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/**/*.{ts,tsx}",
    "format": "prettier --write src/**/*.{ts,tsx}"
  }
}
```

### 1.3 必要なパッケージインストール
```bash
# Core dependencies
npm install react react-dom
npm install webextension-polyfill

# Dev dependencies
npm install -D typescript @types/react @types/react-dom
npm install -D webpack webpack-cli webpack-merge
npm install -D ts-loader css-loader style-loader
npm install -D @types/webextension-polyfill
npm install -D eslint prettier
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D copy-webpack-plugin
```

## Step 2: 基本設定ファイル（20分）

### 2.1 TypeScript設定（tsconfig.json）
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2.2 Webpack設定（webpack.config.js）
```javascript
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    content: './src/content/index.ts',
    background: './src/background/service-worker.ts',
    popup: './src/popup/index.tsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'assets', to: 'assets' }
      ]
    })
  ]
};
```

## Step 3: Manifest V3作成（15分）

### 3.1 manifest.json
```json
{
  "manifest_version": 3,
  "name": "YouTube学習アシスタント",
  "version": "0.1.0",
  "description": "YouTube動画を見ながら、わからない部分をAIに質問できます",
  "permissions": [
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "https://www.youtube.com/*",
    "https://api.openai.com/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [{
    "matches": ["https://www.youtube.com/watch*"],
    "js": ["content.js"],
    "css": ["content.css"],
    "run_at": "document_end"
  }],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "assets/icons/icon16.png",
      "48": "assets/icons/icon48.png",
      "128": "assets/icons/icon128.png"
    }
  },
  "icons": {
    "16": "assets/icons/icon16.png",
    "48": "assets/icons/icon48.png",
    "128": "assets/icons/icon128.png"
  }
}
```

## Step 4: 最初の動作確認（Hello World）（30分）

### 4.1 Content Script
```typescript
// src/content/index.ts
console.log('YouTube Learning Assistant: Content script loaded!');

// YouTube動画ページかどうかチェック
if (window.location.href.includes('youtube.com/watch')) {
  console.log('Video page detected!');
  
  // テスト用: 動画タイトルを取得
  const videoTitle = document.querySelector('h1.title')?.textContent;
  console.log('Video title:', videoTitle);
}
```

### 4.2 Service Worker
```typescript
// src/background/service-worker.ts
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Learning Assistant installed!');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request);
  sendResponse({ status: 'ok' });
});
```

### 4.3 Popup
```typescript
// src/popup/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';

const App = () => {
  return (
    <div style={{ width: 300, padding: 16 }}>
      <h2>YouTube学習アシスタント</h2>
      <p>設定画面（準備中）</p>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

```html
<!-- src/popup/popup.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>YouTube Learning Assistant</title>
</head>
<body>
  <div id="root"></div>
  <script src="popup.js"></script>
</body>
</html>
```

## Step 5: 拡張機能のテスト方法

1. `npm run dev` でビルド
2. Chrome で `chrome://extensions/` を開く
3. 「デベロッパーモード」をON
4. 「パッケージ化されていない拡張機能を読み込む」
5. `dist` フォルダを選択
6. YouTubeで動画を開いてコンソールを確認

## 実装の優先順位

### MVP実装順序
1. ✅ 基本構造とHello World
2. ⏳ YouTube字幕の取得
3. ⏳ 字幕の表示UI
4. ⏳ クリックイベントの処理
5. ⏳ ChatGPT API統合
6. ⏳ 設定画面

### 各フェーズの完了基準
- **Phase 1完了**: 拡張機能がYouTubeで動作し、コンソールにログ出力
- **Phase 2完了**: 字幕データを取得してコンソールに表示
- **Phase 3完了**: 字幕がオーバーレイとして画面に表示
- **Phase 4完了**: クリックした単語がポップアップに表示
- **Phase 5完了**: ChatGPTからの回答が表示
- **Phase 6完了**: 設定画面から各種設定が可能

## トラブルシューティング

### よくある問題と解決方法

1. **拡張機能が読み込まれない**
   - manifest.jsonの構文エラーをチェック
   - dist フォルダが正しくビルドされているか確認

2. **Content Scriptが動作しない**
   - YouTubeのURLパターンが正しいか確認
   - コンソールでエラーをチェック

3. **CORSエラー**
   - Service Worker経由でAPI呼び出しを行う
   - manifest.jsonの権限設定を確認

## 次のステップ
1. 基本構造の実装を完了
2. YouTube APIドキュメントの調査
3. 字幕取得ロジックの実装開始