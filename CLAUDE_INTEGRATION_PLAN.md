# Claude統合計画 - Chrome拡張機能

## 問題点
- Claude Code SDKはNode.js環境が必要
- Chrome拡張機能はブラウザ環境で動作
- APIキーをクライアントサイドに置くのは危険

## 解決策

### オプション1: Anthropic Claude API（推奨）
直接Anthropic APIを使用する方法：

```typescript
// background/service-worker.ts
async function callClaude(prompt: string, context: string) {
  const apiKey = await getStoredApiKey(); // ユーザーが設定したAPIキー
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `動画の文脈: ${context}\n\n質問: ${prompt}`
      }]
    })
  });
  
  return response.json();
}
```

### オプション2: プロキシサーバー（より安全）
自分のサーバーを経由する方法：

```
Chrome拡張機能 → プロキシサーバー（Node.js） → Claude API
```

プロキシサーバーの利点：
- APIキーをサーバー側で管理
- レート制限の実装
- 使用量の追跡
- キャッシュの実装

### オプション3: ローカルサーバー（開発用）
開発中はローカルでNode.jsサーバーを立てる：

```typescript
// local-server.js
import { query } from "@anthropic-ai/claude-code";

app.post('/api/ask', async (req, res) => {
  const { prompt, context } = req.body;
  
  const messages = [];
  for await (const message of query({
    prompt: `${context}\n\n${prompt}`,
    options: { maxTurns: 1 }
  })) {
    messages.push(message);
  }
  
  res.json({ answer: messages });
});
```

## 実装手順

### 1. まずはAnthropic APIで直接実装
- ユーザーが自分のAPIキーを設定
- Chrome拡張機能から直接API呼び出し
- シンプルで素早く動作確認可能

### 2. 将来的にプロキシサーバー化
- セキュリティ向上
- 無料枠の提供も可能
- 使用統計の収集

## APIキー管理のベストプラクティス

1. **暗号化して保存**
```typescript
// 簡易的な暗号化（実際はもっと強固な方法を使用）
function encryptApiKey(apiKey: string): string {
  return btoa(apiKey); // Base64エンコード
}

function decryptApiKey(encrypted: string): string {
  return atob(encrypted); // Base64デコード
}
```

2. **権限の最小化**
- 必要な時だけAPIキーを取得
- メモリに長時間保持しない

3. **ユーザーへの説明**
- APIキーの取得方法を明確に説明
- セキュリティリスクを説明
- 自己責任での使用を明記