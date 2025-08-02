const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const app = express();
const PORT = 3456;

// CORS設定
app.use(cors({
  origin: ['chrome-extension://*', 'https://www.youtube.com'],
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Claude Codeへの質問エンドポイント
app.post('/ask-claude', async (req, res) => {
  try {
    const { word, context, videoTitle } = req.body;
    
    // プロンプトを作成
    const prompt = `YouTube動画を見ていて分からない単語がありました。詳しく教えてください。

動画タイトル: ${videoTitle}
文脈: ${context}

「${word}」について、以下の観点から詳しく説明してください：
1. 一般的な意味・定義
2. この動画の文脈での具体的な意味
3. 関連する知識や背景情報
4. 初学者にも分かりやすい例

簡潔で分かりやすい説明をお願いします。`;

    console.log(`[Claude Code Server] 質問を受信: "${word}"`);
    
    // Claude Codeコマンドを実行
    const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const command = `claude "${escapedPrompt}"`;
    
    const { stdout, stderr } = await execAsync(command, {
      env: { ...process.env },
      timeout: 30000 // 30秒タイムアウト
    });
    
    if (stderr) {
      console.error('[Claude Code Server] エラー:', stderr);
    }
    
    const answer = stdout.trim();
    console.log(`[Claude Code Server] 回答生成完了`);
    
    res.json({ answer });
    
  } catch (error) {
    console.error('[Claude Code Server] エラー:', error);
    res.status(500).json({ 
      error: 'Claude Codeの実行に失敗しました',
      details: error.message 
    });
  }
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Claude Code Server is running' });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`[Claude Code Server] ポート ${PORT} で起動しました`);
  console.log(`[Claude Code Server] YouTube動画の単語クリックを待機中...`);
});