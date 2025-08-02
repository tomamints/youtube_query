// YouTube広告検出ユーティリティ

export class AdDetector {
  private isAdPlaying: boolean = false;
  private adEndCallbacks: (() => void)[] = [];
  private observer: MutationObserver | null = null;
  
  constructor() {
    this.setupAdDetection();
  }
  
  private setupAdDetection() {
    // 広告要素の監視
    this.observer = new MutationObserver(() => {
      this.checkAdStatus();
    });
    
    // YouTubeプレイヤーの監視開始
    const playerContainer = document.querySelector('#movie_player');
    if (playerContainer) {
      this.observer.observe(playerContainer, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
      });
    }
    
    // 定期的なチェック
    setInterval(() => this.checkAdStatus(), 1000);
  }
  
  private checkAdStatus() {
    const player = document.querySelector('.video-stream') as HTMLVideoElement;
    if (!player) return;
    
    // 広告の検出方法
    const adIndicators = [
      // 広告スキップボタンの存在
      document.querySelector('.ytp-ad-skip-button'),
      // 広告オーバーレイ
      document.querySelector('.ytp-ad-overlay-container'),
      // 広告バッジ
      document.querySelector('.ytp-ad-badge'),
      // プレイヤーのクラス名
      document.querySelector('.ad-showing'),
      // 広告の残り時間表示
      document.querySelector('.ytp-ad-duration-remaining')
    ];
    
    const wasAdPlaying = this.isAdPlaying;
    this.isAdPlaying = adIndicators.some(indicator => indicator !== null);
    
    // 広告が終了した時
    if (wasAdPlaying && !this.isAdPlaying) {
      console.log('📺 Ad ended, video content starting');
      this.onAdEnd();
    }
    
    // 広告が開始した時
    if (!wasAdPlaying && this.isAdPlaying) {
      console.log('📺 Ad detected, waiting for it to end...');
    }
  }
  
  private onAdEnd() {
    // 少し待ってから本編の処理を開始
    setTimeout(() => {
      this.adEndCallbacks.forEach(callback => callback());
    }, 500);
  }
  
  onAdEnded(callback: () => void) {
    this.adEndCallbacks.push(callback);
  }
  
  isShowingAd(): boolean {
    return this.isAdPlaying;
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
  
  // 広告スキップボタンを自動クリック（オプション）
  autoSkipAds() {
    setInterval(() => {
      const skipButton = document.querySelector('.ytp-ad-skip-button-container button') as HTMLButtonElement;
      if (skipButton && skipButton.offsetParent !== null) {
        console.log('🎯 Auto-skipping ad');
        skipButton.click();
      }
    }, 1000);
  }
}