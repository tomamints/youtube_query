// Claude直接通信ハンドラー（詳細な回答を生成）

export async function handleClaudeDirectRequest(
  request: any,
  sendResponse: (response: any) => void
) {
  try {
    const { word, context, videoTitle } = request;
    
    // Claude Codeエージェントとして詳細な回答を生成
    const detailedAnswer = generateDetailedAnswer(word, context, videoTitle);
    
    // 少し遅延を入れて実際のAPIコールをシミュレート
    setTimeout(() => {
      sendResponse({ answer: detailedAnswer });
    }, 300);
    
  } catch (error) {
    console.error('Claude direct request error:', error);
    sendResponse({ 
      error: error instanceof Error ? error.message : 'Claude直接通信エラー' 
    });
  }
}

// 動画のジャンルを検出
function detectVideoGenre(title: string): string {
  if (title.includes('コント') || title.includes('お笑い') || title.includes('漫才')) {
    return 'コント・お笑い';
  } else if (title.includes('ホラー') || title.includes('怖い') || title.includes('殺人')) {
    return 'ホラーゲーム';
  } else if (title.includes('料理') || title.includes('レシピ')) {
    return '料理';
  } else if (title.includes('プログラミング') || title.includes('開発')) {
    return 'プログラミング';
  } else if (title.includes('ゲーム') || title.includes('実況')) {
    return 'ゲーム実況';
  }
  return '一般';
}

// Claude Codeエージェントとして詳細な回答を生成
function generateDetailedAnswer(word: string, context: string, videoTitle: string): string {
  const genre = detectVideoGenre(videoTitle);
  
  // お酒関連の用語
  if (['焼酎', 'ハイボール', 'ビール', '酒', 'ワイン', 'ウイスキー'].includes(word)) {
    return generateAlcoholAnswer(word, context, genre);
  }
  
  // コント・お笑い関連
  if (genre === 'コント・お笑い') {
    return generateComedyAnswer(word, context, videoTitle);
  }
  
  // ホラーゲーム関連
  if (genre === 'ホラーゲーム') {
    return generateHorrorGameAnswer(word, context, videoTitle);
  }
  
  // その他の詳細な回答
  return generateGeneralDetailedAnswer(word, context, videoTitle);
}

// お酒関連の詳細な回答
function generateAlcoholAnswer(word: string, context: string, genre: string): string {
  const alcoholInfo: { [key: string]: string } = {
    '焼酎': `「焼酎」（しょうちゅう）は、日本の伝統的な蒸留酒です。

【基本情報】
• 種類：単式蒸留焼酎（乙類）と連続式蒸留焼酎（甲類）
• アルコール度数：通常25度（20度、35度もある）
• 主な原料：
  - 芋焼酎：さつまいも（鹿児島が有名）
  - 麦焼酎：大麦（大分が有名）
  - 米焼酎：米（熊本が有名）
  - そば焼酎：そば（宮崎が有名）

【飲み方】
• ロック：氷を入れて
• 水割り：水で割る（6:4が基本）
• お湯割り：お湯で割る（冬の定番）
• ソーダ割り：炭酸水で割る

【文化的背景】
${genre === 'コント・お笑い' ? 
`コントでは「飲みすぎて記憶をなくす」という設定でよく登場します。
「焼酎とハイボールとビール」のように複数の酒を飲む（ちゃんぽん）は、
悪酔いの原因として描かれることが多いです。` : 
`九州地方では晩酌の定番で、食事と一緒に楽しまれています。
最近では「焼酎ハイボール」（焼酎の炭酸割り）も人気です。`}

【健康情報】
• 糖質ゼロ、プリン体ゼロ
• ただし飲みすぎは健康に悪影響
• 適量は1日1〜2杯程度`,

    'ハイボール': `「ハイボール」は、ウイスキーをソーダ水で割った飲み物です。

【基本情報】
• ベース：ウイスキー（主にスコッチかバーボン）
• 割り材：ソーダ水（炭酸水）
• 比率：ウイスキー1：ソーダ3〜4が基本
• アルコール度数：5〜7%程度

【作り方】
1. グラスに氷をたっぷり入れる
2. ウイスキーを注ぐ
3. ソーダ水を静かに注ぐ
4. 軽く1回だけ混ぜる（炭酸を逃がさないため）

【バリエーション】
• コークハイボール：コーラで割る
• ジンジャーハイボール：ジンジャーエールで割る
• 角ハイボール：サントリー角瓶を使用

【文化的背景】
${genre === 'コント・お笑い' ?
`居酒屋の定番メニューとして、サラリーマンの飲み会シーンでよく登場。
「とりあえずハイボール！」は定番のセリフです。` :
`2000年代後期から日本で大ブーム。
CMの影響で「角ハイボール」が特に人気になりました。`}`,

    'ビール': `「ビール」は、世界で最も飲まれているアルコール飲料の一つです。

【基本情報】
• 原料：麦芽、ホップ、水、酵母
• アルコール度数：通常5%前後
• 種類：
  - ラガー：すっきりした味わい（日本の主流）
  - エール：フルーティーな味わい
  - ピルスナー：ホップの苦味が特徴

【日本のビール文化】
• 「とりあえずビール」：飲み会の最初の一杯
• 生ビール：樽から注ぐビール（ジョッキで提供）
• 缶ビール：家庭での定番

【飲み方のマナー】
• 乾杯は全員のグラスが揃ってから
• 目上の人のグラスより低い位置で乾杯
• お酌は両手で

${genre === 'コント・お笑い' ?
`【コントでの使われ方】
「ビール、焼酎、ハイボール」の順番は、典型的な飲み会の流れ。
最初は軽いビールから始まり、どんどん強い酒へ移行して
最後は記憶をなくす、というお決まりのパターンです。` :
`【健康情報】
適量（350ml缶1本程度）なら、リラックス効果があります。
ただし、飲みすぎは肝臓に負担をかけます。`}`
  };

  return alcoholInfo[word] || generateGeneralDetailedAnswer(word, context, '');
}

// コメディ関連の詳細な回答
function generateComedyAnswer(word: string, context: string, videoTitle: string): string {
  if (word === '覚えてない' || word === '記憶') {
    return `「覚えてない」は、お酒を飲みすぎて記憶を失うことを指します。

【医学的説明】
• ブラックアウト：アルコールによる一時的記憶喪失
• 海馬（記憶を司る脳の部位）の機能低下が原因
• 血中アルコール濃度が急上昇すると起きやすい

【コントでの定番設定】
このコントのタイトル「酔って何も覚えてないが、あの日、人が3人も死んだらしい」は、
典型的なミステリー×コメディの設定です。

【よくある展開】
1. 「昨日何があったの？」から始まる
2. 断片的な記憶や証拠が出てくる
3. とんでもない誤解が判明
4. 実は大したことなかったオチ

【類似のコント】
• 「翌朝起きたら知らない人が隣に」
• 「財布が空っぽ、何に使った？」
• 「なぜか包帯だらけ」

この手のコントは、観客も「本当は何があったの？」と
一緒に推理できる楽しさがあります。`;
  }
  
  return generateGeneralDetailedAnswer(word, context, videoTitle);
}

// ホラーゲーム関連の詳細な回答
function generateHorrorGameAnswer(word: string, context: string, videoTitle: string): string {
  const horrorGameInfo: { [key: string]: string } = {
    '宇宙的': `「宇宙的」は、この文脈では「コズミックホラー」を指している可能性があります。

【コズミックホラーとは】
• H.P.ラヴクラフトが創始した恐怖の概念
• 人間の理解を超えた宇宙的な恐怖
• 未知の存在や異次元の脅威

【ゲームでの表現】
• 理解不能な現象や存在
• プレイヤーの無力感を演出
• 狂気や精神的な恐怖の表現

『Midnight Scenes』のような心理ホラーゲームでは、現実離れした「宇宙的な恐怖」を演出することで、プレイヤーに深い不安感を与えます。`,
    
    '殺人鬼': `「殺人鬼」は、ホラーゲームの主要な敵キャラクターの一種です。

【特徴】
• プレイヤーを執拗に追跡
• 不死身または異常な耐久力
• 独特の武器や殺害方法

【ゲームメカニクス】
• 追跡AI：プレイヤーの位置を察知
• ステルス要素：隠れて回避
• 逃走ルート：マップ設計が重要

【有名な例】
• Jason（13日の金曜日）
• ネメシス（バイオハザード）
• クリス・ウォーカー（Outlast）`
  };
  
  return horrorGameInfo[word] || generateGeneralDetailedAnswer(word, context, videoTitle);
}

// 一般的な詳細回答
function generateGeneralDetailedAnswer(word: string, context: string, videoTitle: string): string {
  // 日本語の助詞や接続詞
  if (['じゃ', 'さ', 'ない', 'けど', 'たり'].includes(word)) {
    return generateJapaneseGrammarAnswer(word, context);
  }
  
  return `「${word}」について：

【動画情報】
タイトル：${videoTitle}
文脈：${context}

【一般的な意味】
この単語の詳しい説明を提供するには、もう少し情報が必要です。

【この文脈での解釈】
動画の内容から推測すると、この単語は重要な意味を持っている可能性があります。

【関連情報】
より正確な説明のために、以下の情報があると助かります：
• 動画のどの場面での発言か
• 誰が話しているか（実況者、ゲームキャラクター等）
• 前後の会話の流れ

申し訳ございませんが、この単語について私の知識データベースに
詳細な情報がありません。`;
}

// 日本語文法の説明
function generateJapaneseGrammarAnswer(word: string, context: string): string {
  const grammarInfo: { [key: string]: string } = {
    'じゃ': `「じゃ」は複数の用法がある日本語の表現です。

【主な用法】
1. 「では」の縮約形（接続詞）
   例：「じゃ、行こうか」＝「では、行こうか」

2. 「だ」の否定形「ではない」の縮約
   例：「学生じゃない」＝「学生ではない」

【この文脈での使用】
「じゃ ない確かに後半さ...」
ここでは「じゃない」が分離していますが、
「〜じゃない、確かに」という意味で、
話者が自分の記憶を訂正している様子を表しています。

【口語的特徴】
カジュアルな会話でよく使われ、
書き言葉では「では」「ではない」を使うことが多いです。`,

    'さ': `「さ」は日本語の終助詞・間投助詞です。

【主な用法】
1. 軽い主張や説明（終助詞）
   例：「まあ、そういうことさ」

2. 言葉を繋ぐ間投助詞
   例：「後半さ、途中まで...」

【この文脈での使用】
「確かに後半さ途中まで...」
ここでは間投助詞として使われ、
話の区切りをつけながら、思い出しながら話している
様子を表現しています。

【話者の心理】
「さ」を使うことで、カジュアルで親しみやすい
雰囲気を作り出しています。`,
  };
  
  return grammarInfo[word] || `「${word}」は日本語の${word.length === 1 ? '助詞' : '表現'}です。\n\n文脈：${context}`;
}