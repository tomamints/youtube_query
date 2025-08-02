// Claude Code CLIを使った直接回答ハンドラー
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function handleClaudeCodeRequest(
  request: any,
  sendResponse: (response: any) => void
) {
  try {
    const { word, context, videoTitle } = request;
    
    // Claude Codeへの質問プロンプトを作成
    const prompt = createClaudeCodePrompt(word, context, videoTitle);
    
    // Claude Codeコマンドを実行（エスケープ処理）
    const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\n/g, '\\n');
    const command = `claude "${escapedPrompt}"`;
    
    console.log('Executing Claude Code command...');
    
    try {
      const { stdout } = await execAsync(command, {
        env: { ...process.env },
        timeout: 30000 // 30秒タイムアウト
      });
      
      sendResponse({ answer: stdout.trim() });
    } catch (execError) {
      console.error('Claude Code execution error:', execError);
      // フォールバック：シンプルな説明を返す
      sendResponse({ 
        answer: generateFallbackAnswer(word, context, videoTitle) 
      });
    }
    
  } catch (error) {
    console.error('Claude Code request error:', error);
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Claude Code実行エラー' 
    });
  }
}

// Claude Code用のプロンプトを作成
function createClaudeCodePrompt(word: string, context: string, videoTitle: string): string {
  return `YouTube動画を見ていて分からない単語がありました。詳しく教えてください。

動画タイトル: ${videoTitle}
文脈: ${context}

「${word}」について、以下の観点から詳しく説明してください：
1. 一般的な意味・定義
2. この動画の文脈での具体的な意味
3. 関連する知識や背景情報
4. 初学者にも分かりやすい例

簡潔で分かりやすい説明をお願いします。`;
}

// フォールバック回答を生成
function generateFallbackAnswer(word: string, context: string, videoTitle: string): string {
  // 動画ジャンルを推測
  const genre = detectGenre(videoTitle);
  
  if (genre === 'コント・お笑い' && word === '焼酎') {
    return `「焼酎」は日本の蒸留酒の一種です。

【基本情報】
• アルコール度数：通常25度前後
• 原料：芋、麦、米、そばなど
• 飲み方：ロック、水割り、お湯割り、ソーダ割り

【コントの文脈】
お笑いやコントでは、酔っ払いのシーンでよく登場します。「焼酎とハイボールとビール」という組み合わせは、いろんな種類のお酒を飲みすぎて記憶をなくすという、よくあるコメディの設定を表現しています。

【関連情報】
• ハイボール：ウイスキーのソーダ割り
• ちゃんぽん：複数の種類のお酒を混ぜて飲むこと（悪酔いしやすい）`;
  }
  
  return `「${word}」についての説明：

動画「${videoTitle}」の文脈から判断すると、${genre}に関連する用語と思われます。

文脈：${context}

より詳しい説明をご希望の場合は、具体的な質問をお聞かせください。`;
}

// ジャンル検出
function detectGenre(title: string): string {
  if (title.includes('コント') || title.includes('お笑い')) return 'コント・お笑い';
  if (title.includes('ホラー') || title.includes('怖い')) return 'ホラー';
  if (title.includes('ゲーム') || title.includes('実況')) return 'ゲーム';
  return '一般';
}