// 即座に回答する高速ハンドラー

// よく使われる単語の事前定義回答（即座に返答）
const instantAnswers: { [key: string]: string } = {
  // 技術用語
  'AI': 'Artificial Intelligence（人工知能）。コンピュータが人間のような知的活動を行う技術。',
  'Google': '世界最大の検索エンジン会社。AI開発でも最先端を走る。',
  'OpenAI': 'ChatGPTを開発したAI研究企業。',
  'API': 'Application Programming Interface。プログラム同士が通信するための仕組み。',
  'GitHub': 'ソースコードを共有・管理するプラットフォーム。',
  'ChatGPT': 'OpenAIが開発した対話型AI。自然な会話ができる。',
  'Claude': 'Anthropic社が開発したAI。安全性を重視。',
  
  // 日本語の一般用語
  'ファインチューニング': 'AIモデルを特定の目的に合わせて追加学習すること。',
  'プロンプト': 'AIに指示を与えるための入力文。',
  'トレーニング': 'AIモデルを学習させること。',
  '学習': 'AIがデータからパターンを見つけ出すプロセス。',
  '人工知能': 'AI。人間の知能を模倣するコンピュータ技術。',
  
  // ビジネス用語
  'リサーチ': '調査・研究。新しい知識や情報を得るための活動。',
  'マーケティング': '商品やサービスを売るための戦略的活動。',
  'プロジェクト': '特定の目標を達成するための計画的な活動。',
  
  // 略語・スラング
  'OP': 'Original Poster（投稿者）またはOpening（オープニング）。',
  'OPAI': 'OpenAIの誤記か造語の可能性。',
  'gg': 'Good Game。ゲームでよく使われる挨拶。',
  'lol': 'Laugh Out Loud。大笑いを表すネット用語。',
  
  // AI・機械学習関連
  'ニューラルネットワーク': '脳の神経回路を模倣したAIの仕組み。層状に繋がったノード（ニューロン）で情報を処理。',
  'ディープラーニング': '深層学習。多層のニューラルネットワークを使った高度な機械学習手法。',
  '機械学習': 'Machine Learning。データから自動的にパターンを学習するAI技術。',
  'モデル': 'AIの学習結果を表現したもの。学習したパターンや知識が保存されている。',
  'パラメータ': 'AIモデルの重みやバイアスなどの調整可能な値。学習で最適化される。',
  'エポック': 'Epoch。学習データ全体を1回通して学習すること。',
  'バッチ': 'Batch。学習時に一度に処理するデータのまとまり。',
  '損失関数': 'Loss Function。AIの予測と正解の差を数値化する関数。',
  '勾配降下法': 'Gradient Descent。損失を最小化するための最適化手法。',
  'オーバーフィッティング': '過学習。訓練データに過度に適応し、新しいデータで性能が落ちる現象。',
  
  // プログラミング関連
  'Python': 'AI開発で最も人気のプログラミング言語。読みやすく、豊富なライブラリが特徴。',
  'JavaScript': 'Web開発の主要言語。ブラウザで動作し、Node.jsでサーバーサイドも可能。',
  'React': 'Facebookが開発したJavaScriptのUIライブラリ。コンポーネントベースが特徴。',
  'Git': 'バージョン管理システム。コードの変更履歴を管理し、チーム開発を支援。',
  'Docker': 'コンテナ型仮想化技術。アプリケーションを環境ごとパッケージ化。',
  'Kubernetes': 'コンテナオーケストレーション。大規模なコンテナ管理を自動化。',
  'REST API': 'RESTful API。Web APIの設計思想。HTTPメソッドでリソースを操作。',
  'JSON': 'JavaScript Object Notation。データ交換フォーマット。軽量で人間にも読みやすい。',
  'SQL': 'Structured Query Language。データベースを操作するための言語。',
  'NoSQL': '非リレーショナルデータベース。柔軟なデータ構造が特徴。',
  
  // ビジネス・テクノロジー
  'DX': 'Digital Transformation。デジタル技術による業務・ビジネスの変革。',
  'SaaS': 'Software as a Service。クラウド上で提供されるソフトウェアサービス。',
  'IoT': 'Internet of Things。あらゆるモノがインターネットに接続される概念。',
  'ブロックチェーン': '分散型台帳技術。改ざんが困難で、仮想通貨の基盤技術。',
  'メタバース': '仮想空間上の3D世界。VR/ARで実現される次世代インターネット。',
  '5G': '第5世代移動通信システム。高速・大容量・低遅延が特徴。',
  
  // 数学・統計
  '確率': 'Probability。事象が起こる可能性を0〜1の数値で表現。',
  '統計': 'Statistics。データの収集・分析・解釈を行う学問。',
  '平均': 'Mean/Average。データの中心的な値。全体を個数で割った値。',
  '分散': 'Variance。データのばらつきを表す指標。',
  '標準偏差': 'Standard Deviation。分散の平方根。データのばらつきの尺度。',
  '相関': 'Correlation。2つの変数間の関係の強さ。',
  '回帰': 'Regression。変数間の関係を数式で表現する手法。',
  
  // 日常会話
  'そう': '肯定や同意を表す言葉。',
  'はい': '肯定の返事。Yes。',
  'うん': 'カジュアルな肯定の返事。',
  'ああ': '理解や納得を示す感嘆詞。',
  'え': '驚きや疑問を表す感嘆詞。',
  'なんで': '理由を尋ねる疑問詞。なぜ。',
  'どうして': '理由や方法を尋ねる疑問詞。',
  
  // 助詞・接続詞
  'けど': '逆接の接続助詞。しかし。',
  'でも': '逆接の接続詞。しかし。',
  'から': '理由を表す接続助詞。',
  'ので': '理由を表す接続助詞（丁寧）。',
  'たり': '並列や例示を表す助詞。',
};

// 動画のテーマを推測
function detectVideoTheme(context: string, videoTitle?: string): string {
  const allText = `${context} ${videoTitle || ''}`.toLowerCase();
  
  if (allText.includes('ai') || allText.includes('人工知能') || allText.includes('機械学習')) {
    return 'AI・機械学習';
  }
  if (allText.includes('プログラ') || allText.includes('コード') || allText.includes('開発')) {
    return 'プログラミング';
  }
  if (allText.includes('ビジネス') || allText.includes('マーケ') || allText.includes('経営')) {
    return 'ビジネス';
  }
  if (allText.includes('英語') || allText.includes('english') || allText.includes('言語')) {
    return '語学学習';
  }
  if (allText.includes('数学') || allText.includes('算数') || allText.includes('計算')) {
    return '数学';
  }
  
  return '一般';
}

// 文脈に応じて回答を充実させる
function enrichAnswerWithContext(baseAnswer: string, word: string, context: string, theme: string): string {
  let enrichedAnswer = baseAnswer;
  
  // テーマに応じた追加情報
  if (theme === 'AI・機械学習' && word.toLowerCase().includes('train')) {
    enrichedAnswer += '\n\nAIの文脈では、大量のデータを使ってモデルのパラメータを最適化するプロセスを指します。';
  } else if (theme === 'プログラミング' && word === 'API') {
    enrichedAnswer += '\n\n例：TwitterのAPIを使えば、プログラムから自動的にツイートを投稿できます。';
  }
  
  // 文脈に含まれる関連語を検出
  const contextWords = context.split(/\s+/);
  const relatedTerms = contextWords.filter(w => 
    w.length > 3 && w !== word && /[A-Z]/.test(w[0])
  );
  
  if (relatedTerms.length > 0) {
    enrichedAnswer += `\n\n関連用語: ${relatedTerms.slice(0, 3).join(', ')}`;
  }
  
  return enrichedAnswer;
}

// キーワードベースの説明生成
function generateQuickExplanation(word: string, context: string, theme: string): string {
  // 技術系のキーワード
  if (word.toLowerCase().includes('ai') || word.includes('人工知能')) {
    let explanation = `「${word}」はAI（人工知能）に関連する用語です。`;
    
    if (theme === 'AI・機械学習') {
      if (context.includes('学習') || context.includes('トレーニング')) {
        explanation += '\n\n文脈から、AIモデルの学習プロセスについて説明されています。大量のデータを使ってパターンを学習させることで、AIは賢くなっていきます。';
      } else if (context.includes('推論') || context.includes('予測')) {
        explanation += '\n\n文脈から、学習済みAIモデルが新しいデータに対して予測や判断を行うプロセスについて話されています。';
      } else {
        explanation += '\n\nこの動画では、AIの基本的な概念や仕組みについて解説されているようです。';
      }
    }
    
    return explanation;
  }
  
  if (word.includes('Google') || word.includes('グーグル')) {
    let explanation = `「${word}」は世界最大の検索エンジン・IT企業です。`;
    
    if (theme === 'AI・機械学習') {
      explanation += '\n\nGoogleは、検索エンジンだけでなく、TensorFlowなどのAIフレームワークや、BERTやGeminiなどの大規模言語モデルの開発でも知られています。';
    } else if (theme === 'プログラミング') {
      explanation += '\n\nGoogleは多くのオープンソースプロジェクトを公開しており、開発者向けのツールやAPIも提供しています。';
    } else {
      explanation += '\n\n検索エンジンの他、Gmail、YouTube、Google Maps、Android OSなど、様々なサービスを提供しています。';
    }
    
    return explanation;
  }
  
  if (word.includes('学習') || word.includes('トレーニング')) {
    let explanation = `「${word}」は学習・訓練を意味する言葉です。`;
    
    if (theme === 'AI・機械学習') {
      explanation += '\n\n機械学習の文脈では、AIモデルが大量のデータからパターンを見つけ出し、予測能力を獲得するプロセスを指します。';
      explanation += '\n\n主な学習方法：\n• 教師あり学習：正解データを使って学習\n• 教師なし学習：パターンを自動発見\n• 強化学習：試行錯誤で最適解を学習';
    } else if (theme === '語学学習') {
      explanation += '\n\n言語学習の文脈では、新しい言語の文法、語彙、発音などを習得するプロセスを指します。';
    } else {
      explanation += '\n\n新しい知識やスキルを身につけるプロセス全般を指します。';
    }
    
    return explanation;
  }
  
  // 日付や数字
  if (word.match(/\d+月\d+日/)) {
    return `「${word}」は日付を表しています。\n\n最近の出来事について話されているようです。`;
  }
  
  // プログラミング関連
  if (word.match(/^[A-Z][a-zA-Z]*$/) && theme === 'プログラミング') {
    return `「${word}」はプログラミング用語のようです。\n\n大文字で始まる単語は、クラス名、定数、または特定の技術を指すことが多いです。\n\n文脈：${context.substring(0, 100)}...`;
  }
  
  // 英語の一般的な単語
  if (word.match(/^[a-z]+$/)) {
    return `「${word}」は英語の単語です。\n\n動画のテーマ「${theme}」の文脈で使われています。\n\nより詳しい説明が必要な場合は、もう一度クリックしてください。`;
  }
  
  // 数字や記号を含む場合
  if (word.match(/[0-9]/) || word.match(/[!@#$%^&*()]/)) {
    return `「${word}」は特殊な識別子または記号のようです。\n\n${theme}の分野では、このような表記は特定の意味を持つことがあります。`;
  }
  
  // デフォルト回答（より詳細に）
  return `「${word}」についての説明：\n\n動画のテーマ：${theme}\n\nこの単語は、${context.length > 50 ? '現在話されている内容の重要な部分' : 'キーワード'}のようです。\n\n文脈から推測すると、${theme}に関連する専門用語または概念の可能性があります。`;
}

export async function handleInstantAnswer(
  request: any,
  sendResponse: (response: any) => void
) {
  const { word, context, videoTitle } = request;
  
  // 動画のテーマを検出
  const theme = detectVideoTheme(context, videoTitle);
  
  // 1. 事前定義された回答をチェック（最速）
  if (instantAnswers[word]) {
    const enrichedAnswer = enrichAnswerWithContext(instantAnswers[word], word, context, theme);
    sendResponse({ 
      answer: enrichedAnswer,
      instant: true 
    });
    return;
  }
  
  // 2. 部分一致をチェック
  const partialMatch = Object.keys(instantAnswers).find(key => 
    word.includes(key) || key.includes(word)
  );
  
  if (partialMatch) {
    const baseAnswer = instantAnswers[partialMatch] + `\n\n※「${word}」は「${partialMatch}」に関連する用語です。`;
    const enrichedAnswer = enrichAnswerWithContext(baseAnswer, word, context, theme);
    sendResponse({ 
      answer: enrichedAnswer,
      instant: true 
    });
    return;
  }
  
  // 3. 即座に生成された説明を返す
  const quickAnswer = generateQuickExplanation(word, context, theme);
  sendResponse({ 
    answer: quickAnswer,
    instant: true 
  });
  
  // 4. バックグラウンドでより詳しい説明を準備（オプション）
  // 後で詳しい説明に更新することも可能
}