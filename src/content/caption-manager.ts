// 字幕管理マネージャー（複数の取得方法を統合）

import { Caption, observeCaptions, getCaptionsFromDOM } from './youtube-transcript';
import { getSmartCaptions } from './youtube-caption-extractor';

export class CaptionManager {
  private captions: Caption[] = [];
  private captionObserver: MutationObserver | null = null;
  private updateCallback: ((captions: Caption[]) => void) | null = null;
  private loadingState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';

  constructor() {
    console.log('CaptionManager initialized');
  }

  // 字幕の読み込みを開始
  async loadCaptions(videoId: string, callback: (captions: Caption[]) => void) {
    this.updateCallback = callback;
    this.loadingState = 'loading';

    // まずスマート取得を試みる
    try {
      console.log('🔍 Attempting smart caption extraction...');
      const smartCaptions = await getSmartCaptions(videoId);
      
      if (smartCaptions.length > 0) {
        console.log(`✅ Loaded ${smartCaptions.length} captions via smart extraction`);
        this.captions = smartCaptions;
        this.loadingState = 'loaded';
        this.notifyUpdate();
        return;
      }
    } catch (error) {
      console.warn('Smart caption extraction failed:', error);
    }

    // スマート取得が失敗したらDOM監視にフォールバック
    console.log('📝 Falling back to DOM observation...');
    this.startDOMObservation();
  }

  // DOM監視を開始
  private startDOMObservation() {
    if (this.captionObserver) {
      this.captionObserver.disconnect();
    }

    // 即座に現在の字幕を取得
    const currentCaptions = getCaptionsFromDOM();
    if (currentCaptions.length > 0) {
      this.captions = currentCaptions;
      this.loadingState = 'loaded';
      this.notifyUpdate();
    }

    // 字幕の変更を監視
    this.captionObserver = observeCaptions((newCaptions) => {
      if (newCaptions.length > 0) {
        // 新しい字幕を既存の字幕に追加（重複を避ける）
        const existingTexts = new Set(this.captions.map(c => c.text));
        const uniqueNewCaptions = newCaptions.filter(c => !existingTexts.has(c.text));
        
        if (uniqueNewCaptions.length > 0) {
          this.captions = [...this.captions, ...uniqueNewCaptions];
          this.loadingState = 'loaded';
          this.notifyUpdate();
        }
      }
    });
  }

  // 更新を通知
  private notifyUpdate() {
    if (this.updateCallback) {
      this.updateCallback(this.captions);
    }
  }

  // 現在の字幕を取得
  getCaptions(): Caption[] {
    return this.captions;
  }

  // 読み込み状態を取得
  getLoadingState(): string {
    return this.loadingState;
  }

  // クリーンアップ
  cleanup() {
    if (this.captionObserver) {
      this.captionObserver.disconnect();
      this.captionObserver = null;
    }
    this.captions = [];
    this.updateCallback = null;
    this.loadingState = 'idle';
  }
}

// シングルトンインスタンス
export const captionManager = new CaptionManager();