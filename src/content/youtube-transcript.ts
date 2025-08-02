// YouTube字幕取得モジュール

export interface Caption {
  text: string;
  start: number; // 開始時間（秒）
  duration: number; // 表示時間（秒）
}

export interface TranscriptData {
  captions: Caption[];
  language: string;
}

// YouTube Player APIから字幕を取得する試み
export async function getTranscriptFromPlayer(): Promise<TranscriptData | null> {
  try {
    // YouTube's player APIをチェック
    const player = (window as any).ytplayer?.player;
    if (!player?.getOption) {
      console.log('YouTube Player API not available');
      return null;
    }

    // 利用可能な字幕トラックを取得
    const captionTracks = player.getOption('captions', 'tracklist');
    if (!captionTracks || captionTracks.length === 0) {
      console.log('No caption tracks available');
      return null;
    }

    console.log('Available caption tracks:', captionTracks);
    
    // 最初の字幕トラックを選択（後で言語選択機能を追加）
    // const track = captionTracks[0];
    
    // TODO: 実際の字幕データを取得する方法を実装
    return null;
  } catch (error) {
    console.error('Error getting transcript from player:', error);
    return null;
  }
}

// DOM から字幕要素を取得
export function getCaptionsFromDOM(): Caption[] {
  const captions: Caption[] = [];
  
  // YouTube の字幕表示要素を探す
  const captionWindow = document.querySelector('.ytp-caption-window-container');
  if (!captionWindow) {
    console.log('Caption window not found');
    return captions;
  }

  // 現在表示されている字幕テキストを取得
  const captionElements = captionWindow.querySelectorAll('.ytp-caption-segment');
  captionElements.forEach((element) => {
    const text = element.textContent?.trim();
    if (text) {
      // 現在の動画時間を取得
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        captions.push({
          text,
          start: video.currentTime,
          duration: 3 // デフォルト3秒（実際の値は取得困難）
        });
      }
    }
  });

  return captions;
}

// 字幕の変更を監視
export function observeCaptions(callback: (captions: Caption[]) => void): MutationObserver {
  const observer = new MutationObserver(() => {
    const captions = getCaptionsFromDOM();
    if (captions.length > 0) {
      callback(captions);
    }
  });

  // 字幕コンテナを監視
  const captionContainer = document.querySelector('.ytp-caption-window-container');
  if (captionContainer) {
    observer.observe(captionContainer, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  return observer;
}

// 動画IDから字幕を取得（バックアップ方法）
export async function getTranscriptFromAPI(videoId: string): Promise<TranscriptData | null> {
  try {
    // YouTubeの内部APIエンドポイント（非公式）
    const response = await fetch(`https://www.youtube.com/api/timedtext?v=${videoId}&lang=ja`);
    if (!response.ok) {
      throw new Error('Failed to fetch transcript');
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const captions: Caption[] = [];
    const textElements = xmlDoc.querySelectorAll('text');
    
    textElements.forEach((element) => {
      const text = element.textContent?.trim();
      const start = parseFloat(element.getAttribute('start') || '0');
      const duration = parseFloat(element.getAttribute('dur') || '0');
      
      if (text) {
        captions.push({ text, start, duration });
      }
    });

    return {
      captions,
      language: 'ja'
    };
  } catch (error) {
    console.error('Error fetching transcript from API:', error);
    return null;
  }
}

// 現在の動画時間に対応する字幕を取得
export function getCurrentCaption(captions: Caption[], currentTime: number): Caption | null {
  // 少し余裕を持たせる（自動生成字幕はタイミングがずれることがある）
  const buffer = 0.5; // 0.5秒のバッファ
  return captions.find(caption => 
    currentTime >= caption.start - buffer && 
    currentTime <= caption.start + caption.duration + buffer
  ) || null;
}

// 字幕テキストを単語に分割（クリック可能にするため）
export function tokenizeCaption(text: string): string[] {
  // 日本語と英語の両方に対応
  if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text)) {
    // 日本語の場合：形態素解析が理想的だが、簡易的に文字種で分割
    return text.match(/[\u4e00-\u9faf]+|[\u3040-\u309f]+|[\u30a0-\u30ff]+|[a-zA-Z]+|[0-9]+|./g) || [];
  } else {
    // 英語の場合：スペースで分割
    return text.split(/\s+/);
  }
}