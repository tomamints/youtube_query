import React from 'react';
import { createRoot } from 'react-dom/client';
import { BottomPanel } from './components/BottomPanel';
import { ExplanationPanel } from './components/ExplanationPanel';
import { getSmartCaptions } from './youtube-caption-extractor';
import { SpeechRecognitionManager } from './speech-recognition';
import { TextSelectionHandler } from './text-selection-handler';
import { AdDetector } from './ad-detector';

console.log('🎓 YouTube Learning Assistant: Content script loaded!');

// YouTube動画ページかどうかチェック
function isYouTubeVideoPage(): boolean {
  return window.location.href.includes('youtube.com/watch');
}

// 動画情報を取得
function getVideoInfo() {
  const videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent?.trim() || 
                    document.querySelector('h1.title')?.textContent?.trim() ||
                    'タイトル不明';
  
  const videoId = new URLSearchParams(window.location.search).get('v') || '';
  
  return {
    title: videoTitle,
    id: videoId,
    url: window.location.href
  };
}

// グローバル状態
let currentCaptions: any[] = [];
let currentTime = 0;
let bottomPanelRoot: any = null;
let explanationPanelRoot: any = null;
let currentAnswer: { word: string; answer: string } | null = null;
let isLoading = false;
let selectedWord: string | null = null;
let selectedContext: string = '';
// let captionObserver: MutationObserver | null = null; // DOM監視は使わない
let speechRecognition: SpeechRecognitionManager | null = null;
let textSelectionHandler: TextSelectionHandler | null = null;
let speechCaptions: any[] = [];
let adDetector: AdDetector | null = null;

// メイン処理
async function initialize() {
  console.log('🚀 Initialize called at', new Date().toISOString());
  
  if (!isYouTubeVideoPage()) {
    console.log('❌ Not a YouTube video page, skipping initialization');
    return;
  }

  console.log('📺 Video page detected!');
  
  // 動画要素の確認
  const video = document.querySelector('video');
  const player = document.querySelector('#movie_player');
  console.log('Video element:', !!video, 'Player element:', !!player);
  
  if (!video || !player) {
    console.log('⚠️ Video or player not ready, will retry...');
    retryInitialize();
    return;
  }
  
  const videoInfo = getVideoInfo();
  console.log('Video info:', videoInfo);

  // 既存のUIをクリーンアップ
  cleanup();

  // 広告検知を初期化
  initializeAdDetector();
  
  // UIを注入
  console.log('💉 Injecting UI...');
  injectUI();

  // テキスト選択ハンドラーを初期化
  initializeTextSelection();
  
  // 広告が再生中でなければ処理を開始
  if (!adDetector || !adDetector.isShowingAd()) {
    console.log('🎬 Starting content processing...');
    startContentProcessing();
  } else {
    console.log('📢 Ad detected, waiting...');
  }
}

// 広告検知の初期化
function initializeAdDetector() {
  adDetector = new AdDetector();
  
  // 広告終了時のコールバック
  adDetector.onAdEnded(() => {
    console.log('📺 Ad ended, starting content processing');
    startContentProcessing();
  });
}

// コンテンツ処理の開始
async function startContentProcessing() {
  console.log('📊 Starting content processing...');
  const videoInfo = getVideoInfo();
  
  // 音声認識を初期化（メインの字幕取得方法として）
  console.log('🎤 Initializing speech recognition as primary caption source...');
  initializeSpeechRecognition();
  
  // 字幕の取得を試みる
  console.log('📝 Attempting to get smart captions for video:', videoInfo.id);
  try {
    const captions = await getSmartCaptions(videoInfo.id);
    console.log('📊 Smart captions result:', captions.length, 'captions');
    
    if (captions.length > 0) {
      console.log('✅ Smart captions loaded successfully');
      console.log('📝 Full transcript available from the start!');
      
      // 全字幕を保存（DOM監視は不要）
      currentCaptions = captions;
      renderBottomPanel();
      
      // デバッグ: 最初の5つの字幕を表示
      console.log('First 5 captions:', captions.slice(0, 5).map(c => ({
        text: c.text.substring(0, 50),
        start: c.start,
        duration: c.duration
      })));
    } else {
      console.log('⚠️ No smart captions available');
      // DOM監視は使わない - シンプルな字幕チェックのみ
      showDemoCaption();
      
      // 字幕が取得できない場合はリトライ
      console.log('🔄 Will retry to get captions...');
      retryInitialize();
    }
  } catch (error) {
    console.error('❌ Error loading smart captions:', error);
    // DOM監視は使わない
    showDemoCaption();
    
    // エラーの場合もリトライ
    console.log('🔄 Will retry after error...');
    retryInitialize();
  }

  // 動画の時間を追跡
  console.log('⏱️ Starting video time tracking...');
  trackVideoTime();
}

// UIを注入
function injectUI() {
  console.log('🎨 Injecting UI...');
  
  // 既存のパネルがあれば削除
  const existingPanel = document.getElementById('youtube-learning-panel');
  if (existingPanel) {
    existingPanel.remove();
  }
  
  // 底部パネル用コンテナ
  const bottomPanelContainer = document.createElement('div');
  bottomPanelContainer.id = 'youtube-learning-bottom-panel';
  document.body.appendChild(bottomPanelContainer);
  
  try {
    bottomPanelRoot = createRoot(bottomPanelContainer);
    console.log('✅ Bottom panel root created');
  } catch (error) {
    console.error('❌ Failed to create bottom panel root:', error);
    return;
  }
  
  // YouTubeの関連動画エリアを探す
  const secondary = document.querySelector('#secondary.ytd-watch-flexy');
  if (!secondary) {
    console.log('⚠️ Secondary container not found, waiting...');
    setTimeout(() => injectExplanationPanel(), 1000);
  } else {
    injectExplanationPanel();
  }
  
  // ページレイアウトを調整
  adjustPageLayout();
  
  // 底部パネルをレンダー
  renderBottomPanel();
}

// 解説パネルを挿入
function injectExplanationPanel() {
  const secondary = document.querySelector('#secondary.ytd-watch-flexy');
  if (!secondary) {
    console.log('⚠️ Secondary container still not found');
    return;
  }
  
  // 既存の解説パネルがあれば削除
  const existingPanel = document.getElementById('youtube-learning-explanation-panel');
  if (existingPanel) {
    existingPanel.remove();
  }
  
  // 解説パネル用コンテナ
  const explanationPanelContainer = document.createElement('div');
  explanationPanelContainer.id = 'youtube-learning-explanation-panel';
  
  // 関連動画エリアの最初に挿入
  secondary.insertBefore(explanationPanelContainer, secondary.firstChild);
  
  try {
    explanationPanelRoot = createRoot(explanationPanelContainer);
    console.log('✅ Explanation panel root created');
    renderExplanationPanel();
  } catch (error) {
    console.error('❌ Failed to create explanation panel root:', error);
  }
}

// ページレイアウトの調整
function adjustPageLayout() {
  // 既存のスタイルを削除
  const existingStyle = document.getElementById('youtube-learning-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // CSSでレイアウトを調整
  const style = document.createElement('style');
  style.id = 'youtube-learning-styles';
  style.textContent = `
    /* 底部パネルの位置 */
    #youtube-learning-bottom-panel {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 2000;
    }
    
    /* フルスクリーン時はパネル非表示 */
    .ytp-fullscreen #youtube-learning-bottom-panel,
    ytd-app[fullscreen] #youtube-learning-bottom-panel,
    .ytp-fullscreen #youtube-learning-explanation-panel,
    ytd-app[fullscreen] #youtube-learning-explanation-panel {
      display: none;
    }
    
    /* YouTubeの字幕を上にシフト（パネルと重ならないように） */
    .caption-window {
      transform: translateY(-100px) !important;
    }
    
    .ytp-caption-window-container {
      transform: translateY(-100px) !important;
    }
  `;
  document.head.appendChild(style);
  
  // bodyにクラスを追加
  document.body.classList.add('youtube-learning-active');
  
  // 動画プレイヤーをビューポートに収める（コメントアウト - ページジャンプの原因）
  // setTimeout(() => {
  //   const player = document.querySelector('#movie_player');
  //   if (player) {
  //     player.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //   }
  // }, 500);
}

// 底部パネルのレンダー
let renderTimeout: NodeJS.Timeout | null = null;
function renderBottomPanel() {
  // デバウンス処理：連続したレンダリング要求をまとめる
  if (renderTimeout) {
    clearTimeout(renderTimeout);
  }
  
  renderTimeout = setTimeout(() => {
    actuallyRenderBottomPanel();
  }, 50); // 50ms後にレンダリング
}

function actuallyRenderBottomPanel() {
  if (!bottomPanelRoot) {
    // 再度作成を試みる
    const container = document.getElementById('youtube-learning-bottom-panel');
    if (container) {
      try {
        bottomPanelRoot = createRoot(container);
      } catch (e) {
        console.error('❌ Failed to recreate root:', e);
        return;
      }
    } else {
      return;
    }
  }

  try {
    bottomPanelRoot.render(
      React.createElement(BottomPanel, {
        captions: currentCaptions,
        currentTime: currentTime,
        onWordClick: handleWordClick,
        currentAnswer: currentAnswer,
        loading: isLoading
      })
    );
  } catch (error) {
    console.error('❌ Failed to render bottom panel:', error);
  }
}

// 解説パネルのレンダー  
function renderExplanationPanel() {
  console.log('🎓 Rendering explanation panel...');
  
  if (!explanationPanelRoot) {
    console.error('❌ explanationPanelRoot is null');
    return;
  }

  try {
    explanationPanelRoot.render(
      React.createElement(ExplanationPanel, {
        selectedWord: selectedWord,
        context: selectedContext
      })
    );
    console.log('✅ Explanation panel rendered');
  } catch (error) {
    console.error('❌ Failed to render explanation panel:', error);
  }
}

// 単語クリックハンドラ
function handleWordClick(word: string, context: string) {
  console.log('Word clicked:', word);
  selectedWord = word;
  selectedContext = context;
  
  // 回答をリセット
  currentAnswer = null;
  isLoading = true;
  renderBottomPanel();
  renderExplanationPanel();
}


// 字幕の監視を開始（削除 - DOM監視は使わない）
// function startCaptionObserver() {
//   // DOM監視は使わない
// }

// 動画の時間を追跡
function trackVideoTime() {
  const video = document.querySelector('video');
  if (!video) return;

  let lastUpdateTime = 0;
  let captionCheckInterval: any = null;
  
  video.addEventListener('timeupdate', () => {
    currentTime = video.currentTime;
    
    // 0.5秒ごとに更新（レンダリング頻度を減らす）
    if (Math.abs(currentTime - lastUpdateTime) >= 0.5) {
      lastUpdateTime = currentTime;
      renderBottomPanel();
    }
  });
  
  // 動画再生中は定期的に字幕をチェック
  video.addEventListener('play', () => {
    console.log('▶️ Video playing, starting caption check');
    if (!captionCheckInterval) {
      captionCheckInterval = setInterval(() => {
        simpleCheckCaptions();
      }, 250); // 0.25秒ごとにチェック
    }
  });
  
  video.addEventListener('pause', () => {
    console.log('⏸️ Video paused, stopping caption check');
    if (captionCheckInterval) {
      clearInterval(captionCheckInterval);
      captionCheckInterval = null;
    }
  });
  
  // 初回チェック
  if (!video.paused) {
    captionCheckInterval = setInterval(() => {
      simpleCheckCaptions();
    }, 250); // 0.25秒ごとにチェック
  }
}


// 音声認識を初期化
function initializeSpeechRecognition() {
  const video = document.querySelector('video');
  if (!video) return;
  
  let interimCaption: any = null;
  
  speechRecognition = new SpeechRecognitionManager((text, isFinal) => {
    const currentTime = video.currentTime;
    
    if (isFinal) {
      const newCaption = {
        text: text,
        start: currentTime - 3,
        duration: 5,
        source: 'speech'
      };
      
      if (interimCaption) {
        speechCaptions = speechCaptions.filter(c => c !== interimCaption);
        interimCaption = null;
      }
      
      speechCaptions.push(newCaption);
      
      if (speechCaptions.length > 20) {
        speechCaptions = speechCaptions.slice(-20);
      }
    } else {
      if (interimCaption) {
        interimCaption.text = text;
      } else {
        interimCaption = {
          text: text,
          start: currentTime - 1,
          duration: 3,
          source: 'speech',
          interim: true
        };
        speechCaptions.push(interimCaption);
      }
    }
    
    updateCaptionsWithSpeech();
    console.log('🎤 Speech recognition update:', text, 'Final:', isFinal);
  });
  
  // 音声認識の開始（権限確認なし版）
  if (speechRecognition.isAvailable()) {
    console.log('🎤 Speech recognition available');
    // 自動開始はしない（ユーザーが手動で開始）
  }
}

// テキスト選択を初期化
function initializeTextSelection() {
  textSelectionHandler = new TextSelectionHandler((selectedText) => {
    console.log('Text selected from page:', selectedText);
    // TODO: 選択されたテキストの処理をSidePanelに連携する機能を追加
  });
  
  textSelectionHandler.makeYouTubeTextSelectable();
}

// 音声認識の字幕と既存の字幕を統合
function updateCaptionsWithSpeech() {
  const allCaptions = [...currentCaptions, ...speechCaptions];
  
  allCaptions.sort((a, b) => a.start - b.start);
  
  const uniqueCaptions = allCaptions.filter((caption, index, self) =>
    index === self.findIndex((c) => c.text === caption.text && Math.abs(c.start - caption.start) < 1)
  );
  
  currentCaptions = uniqueCaptions;
  renderBottomPanel();
}

// クリーンアップ
function cleanup() {
  if (bottomPanelRoot) {
    bottomPanelRoot.unmount();
    bottomPanelRoot = null;
  }
  
  if (explanationPanelRoot) {
    explanationPanelRoot.unmount();
    explanationPanelRoot = null;
  }

  const bottomPanelContainer = document.getElementById('youtube-learning-bottom-panel');
  if (bottomPanelContainer) {
    bottomPanelContainer.remove();
  }
  
  const explanationPanelContainer = document.getElementById('youtube-learning-explanation-panel');
  if (explanationPanelContainer) {
    explanationPanelContainer.remove();
  }

  // DOM監視は使わないので削除
  // if (captionObserver) {
  //   captionObserver.disconnect();
  //   captionObserver = null;
  // }
  
  
  if (speechRecognition) {
    speechRecognition.stop();
    speechRecognition = null;
  }
  
  if (textSelectionHandler) {
    textSelectionHandler.destroy();
    textSelectionHandler = null;
  }
  
  if (adDetector) {
    adDetector.destroy();
    adDetector = null;
  }
  
  // スタイルを削除
  const style = document.getElementById('youtube-learning-styles');
  if (style) {
    style.remove();
  }
  
  // bodyクラスを削除
  document.body.classList.remove('youtube-learning-active');
}

// デモ字幕を表示
function showDemoCaption() {
  console.log('📋 Simple caption check will be started by trackVideoTime');
  // デモ字幕は追加しない
  // 字幕チェックはtrackVideoTime内で管理される
}

// 句点で区切られた文章の履歴を保持
let sentenceHistory: string[] = [];
let lastSeenCaption = ''; // 前回見た字幕テキスト
let accumulatedText = ''; // 累積テキスト（全体を保持）

// YouTubeの字幕をそのまま表示（句点で履歴化）
function simpleCheckCaptions() {
  // YouTubeの字幕コンテナを取得
  const captionWindow = document.querySelector('.ytp-caption-window-container');
  
  if (!captionWindow) {
    // 字幕がない場合は履歴のみ表示
    currentCaptions = sentenceHistory.map((text) => ({
      text: text,
      start: 0,
      duration: 5,
      isHistory: true
    } as any));
    renderBottomPanel();
    return;
  }
  
  // 現在YouTubeが表示している全文を取得
  const captionText = captionWindow.textContent?.trim() || '';
  
  if (!captionText) {
    // テキストがない場合は履歴のみ
    currentCaptions = sentenceHistory.map((text) => ({
      text: text,
      start: 0,
      duration: 5,
      isHistory: true
    } as any));
    renderBottomPanel();
    return;
  }
  
  // デバッグログ
  console.log('🎬 Caption:', captionText, '| Last:', lastSeenCaption, '| Accumulated:', accumulatedText);
  
  // 字幕が変わった場合の処理
  if (captionText !== lastSeenCaption) {
    // 前の字幕が現在の字幕に含まれている場合（継続）
    if (lastSeenCaption && captionText.startsWith(lastSeenCaption)) {
      // 新しい部分だけを追加
      const newPart = captionText.substring(lastSeenCaption.length);
      accumulatedText += newPart;
      console.log('📝 継続: 新しい部分を追加:', newPart);
    } 
    // 現在の字幕が前の字幕に含まれている場合（部分的な繰り返し）
    else if (lastSeenCaption && lastSeenCaption.includes(captionText)) {
      // 既に累積済みなので何もしない
      console.log('🔄 部分的な繰り返し: スキップ');
    }
    // 累積テキストの一部が現在の字幕と一致する場合
    else if (accumulatedText && captionText && findOverlap(accumulatedText, captionText)) {
      // 重複部分を見つけて、新しい部分だけを追加
      const overlap = findOverlap(accumulatedText, captionText);
      const newPart = captionText.substring(overlap.length);
      accumulatedText += newPart;
      console.log('🔗 重複検出: overlap=', overlap, '新しい部分=', newPart);
    }
    // 完全に新しい字幕の場合
    else {
      // 短い字幕で句点で終わる場合は、前の累積と結合を試みる
      if (captionText.length < 20 && captionText.match(/[。？！]$/)) {
        // 累積テキストの最後の文と結合できるかチェック
        const lastSentence = extractSentences(accumulatedText).current;
        if (lastSentence && !lastSentence.match(/[。？！]$/)) {
          // 前の未完成文と結合
          accumulatedText += captionText;
          console.log('🔀 短い文を前の文と結合:', captionText);
        } else {
          // 前の累積テキストを処理
          processAccumulatedText();
          // 新しい累積を開始
          accumulatedText = captionText;
          console.log('🆕 新しい短い字幕: 累積リセット');
        }
      } else {
        // 前の累積テキストを処理
        processAccumulatedText();
        // 新しい累積を開始
        accumulatedText = captionText;
        console.log('🆕 新しい字幕: 累積リセット');
      }
    }
    
    lastSeenCaption = captionText;
  } else {
    console.log('♻️ 同じ字幕が再表示されました');
  }
  
  // 累積テキストから完成した文と現在進行中の文を抽出
  const { completed, current } = extractSentences(accumulatedText);
  
  // 完成した文を累積テキストから削除
  let processedText = accumulatedText;
  completed.forEach(sentence => {
    processedText = processedText.replace(sentence, '').trim();
  });
  
  // 累積テキストを更新（完成文を削除して現在進行中の文のみ残す）
  if (processedText !== accumulatedText) {
    console.log('🧹 累積テキストをクリーンアップ:', accumulatedText, '→', processedText);
    accumulatedText = processedText;
  }
  
  // 新しい完成文を履歴に追加
  completed.forEach(sentence => {
    if (!sentenceHistory.includes(sentence)) {
      sentenceHistory.push(sentence);
      console.log('✅ 履歴に追加:', sentence);
    } else {
      console.log('⏭️ 重複をスキップ:', sentence);
    }
  });
  
  // 履歴が長すぎる場合は古いものを削除
  if (sentenceHistory.length > 20) {
    sentenceHistory = sentenceHistory.slice(-15);
  }
  
  // 現在の表示 = 履歴 + 現在進行中の文
  const allCaptions = sentenceHistory.map((text) => ({
    text: text,
    start: 0,
    duration: 5,
    isHistory: true
  } as any));
  
  if (current) {
    allCaptions.push({
      text: current,
      start: 0,
      duration: 5,
      isCurrent: true
    } as any);
  }
  
  currentCaptions = allCaptions;
  
  // レンダリング
  renderBottomPanel();
}

// 重複部分を見つける
function findOverlap(text1: string, text2: string): string {
  // text1の末尾とtext2の先頭で最長の一致を探す
  let maxOverlap = '';
  const minLength = Math.min(text1.length, text2.length);
  
  for (let i = 1; i <= minLength; i++) {
    const end = text1.substring(text1.length - i);
    const start = text2.substring(0, i);
    if (end === start) {
      maxOverlap = end;
    }
  }
  
  return maxOverlap;
}

// 文を抽出
function extractSentences(text: string): { completed: string[], current: string } {
  console.log('📄 extractSentences input:', text);
  const completed: string[] = [];
  let current = '';
  
  const sentences = text.split(/([。？！])/);
  console.log('📄 split result:', sentences);
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i];
    const punctuation = sentences[i + 1] || '';
    
    if (sentence || punctuation) {
      const fullSentence = (sentence + punctuation).trim();
      
      if (punctuation) {
        // 句点で終わる完成文
        completed.push(fullSentence);
        console.log('📄 完成文を抽出:', fullSentence);
      } else if (i === sentences.length - 1) {
        // 最後の文で句点がない（現在進行中）
        current = fullSentence;
        console.log('📄 現在進行中の文:', current);
      }
    }
  }
  
  console.log('📄 extractSentences output:', { completed, current });
  return { completed, current };
}

// 累積テキストを処理
function processAccumulatedText() {
  if (!accumulatedText) return;
  
  console.log('🔥 processAccumulatedText called with:', accumulatedText);
  const { completed } = extractSentences(accumulatedText);
  
  completed.forEach(sentence => {
    if (!sentenceHistory.includes(sentence)) {
      sentenceHistory.push(sentence);
      console.log('🔥 履歴に追加 (processAccumulated):', sentence);
    } else {
      console.log('🔥 既に履歴にある (processAccumulated):', sentence);
    }
  });
  
  // 履歴が長すぎる場合は古いものを削除
  if (sentenceHistory.length > 20) {
    sentenceHistory = sentenceHistory.slice(-15);
  }
}

// YouTube SPAのナビゲーションに対応
let lastUrl = location.href;
let retryCount = 0;
const maxRetries = 5;  // リトライ回数を増やす
let initializationTimeout: NodeJS.Timeout | null = null;

// より確実な初期化タイミング検出
function waitForVideo(callback: () => void, maxWait = 10000) {
  const startTime = Date.now();
  
  const checkVideo = () => {
    const video = document.querySelector('video');
    const player = document.querySelector('#movie_player');
    
    if (video && player) {
      console.log('✅ Video element found, initializing...');
      callback();
    } else if (Date.now() - startTime < maxWait) {
      console.log('⏳ Waiting for video element...');
      setTimeout(checkVideo, 500);
    } else {
      console.log('❌ Video element not found after timeout');
      callback(); // タイムアウトしても初期化を試みる
    }
  };
  
  checkVideo();
}

// URL変更を監視
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    retryCount = 0;
    console.log('🔄 URL changed, reinitializing...');
    
    // 既存の初期化をキャンセル
    if (initializationTimeout) {
      clearTimeout(initializationTimeout);
    }
    
    // クリーンアップしてから再初期化
    cleanup();
    
    // 動画要素を待ってから初期化
    if (isYouTubeVideoPage()) {
      waitForVideo(() => {
        initializationTimeout = setTimeout(initialize, 500) as any;
      });
    }
  }
}).observe(document, { subtree: true, childList: true });

// 字幕取得のリトライ機能（改善版）
function retryInitialize() {
  if (retryCount < maxRetries) {
    retryCount++;
    console.log(`🔄 Retrying initialization (${retryCount}/${maxRetries})...`);
    
    // リトライ間隔を調整（最初は早く、後は遅く）
    const retryDelay = retryCount <= 2 ? 1000 : 2000 * (retryCount - 1);
    
    setTimeout(() => {
      // 動画要素の存在を確認してから初期化
      const video = document.querySelector('video');
      if (video) {
        initialize();
      } else {
        console.log('⚠️ Video not ready, waiting...');
        waitForVideo(initialize);
      }
    }, retryDelay);
  } else {
    console.log('❌ Max retries reached, showing demo caption');
    // 最大リトライ後もデモ字幕を表示
    showDemoCaption();
  }
}

// ページ読み込み時の初期化（改善版）
function initializeOnPageLoad() {
  console.log('📄 Page load initialization check...');
  if (isYouTubeVideoPage()) {
    console.log('📺 YouTube video page detected on load');
    
    // すぐに試みる
    const video = document.querySelector('video');
    const player = document.querySelector('#movie_player');
    
    if (video && player) {
      console.log('✅ Video and player already available, initializing immediately');
      initialize();
    } else {
      console.log('⏳ Waiting for video and player elements...');
      waitForVideo(() => {
        initialize();
      });
    }
  } else {
    console.log('❌ Not a YouTube video page on load');
  }
}

// DOMContentLoadedとload両方で初期化を試みる
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeOnPageLoad);
} else if (document.readyState === 'interactive') {
  // DOMContentLoadedは既に発生しているが、loadはまだ
  window.addEventListener('load', initializeOnPageLoad);
  // すぐに試みる
  initializeOnPageLoad();
} else {
  // 完全に読み込まれている
  initializeOnPageLoad();
}

// ページ表示時にも初期化（リロード対策）
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && isYouTubeVideoPage()) {
    const video = document.querySelector('video');
    const panel = document.getElementById('youtube-learning-bottom-panel');
    
    // パネルがなく、動画がある場合は初期化
    if (video && !panel) {
      console.log('📺 Page became visible, initializing...');
      waitForVideo(initialize);
    }
  }
});