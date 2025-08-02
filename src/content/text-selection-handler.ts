// YouTube動画上のテキスト選択ハンドラー

export class TextSelectionHandler {
  private overlay: HTMLDivElement | null = null;
  private isSelecting: boolean = false;
  private startPoint: { x: number; y: number } | null = null;
  private selectionBox: HTMLDivElement | null = null;
  private onTextSelected: (text: string) => void;
  
  constructor(onTextSelected: (text: string) => void) {
    this.onTextSelected = onTextSelected;
    this.setupOverlay();
    this.setupEventListeners();
  }
  
  private setupOverlay() {
    // 透明なオーバーレイを作成（テキスト選択用）
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9998;
      pointer-events: none;
      user-select: none;
    `;
    
    // 選択ボックス
    this.selectionBox = document.createElement('div');
    this.selectionBox.style.cssText = `
      position: absolute;
      border: 2px dashed #4285f4;
      background: rgba(66, 133, 244, 0.1);
      display: none;
      pointer-events: none;
    `;
    this.overlay.appendChild(this.selectionBox);
  }
  
  private setupEventListeners() {
    // Ctrlキーまたは⌘キーを押しながらの選択
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        this.enableSelection();
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (!e.ctrlKey && !e.metaKey) {
        this.disableSelection();
      }
    });
    
    // 通常のテキスト選択
    document.addEventListener('mouseup', () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const selectedText = selection.toString().trim();
        console.log('Text selected:', selectedText);
        this.onTextSelected(selectedText);
        
        // 選択をハイライト
        this.highlightSelection(selection);
      }
    });
  }
  
  private enableSelection() {
    const videoContainer = document.querySelector('.html5-video-player');
    if (!videoContainer || !this.overlay) return;
    
    // オーバーレイを動画コンテナに追加
    videoContainer.appendChild(this.overlay);
    this.overlay.style.pointerEvents = 'auto';
    
    // マウスイベントを設定
    this.overlay.addEventListener('mousedown', this.handleMouseDown);
    this.overlay.addEventListener('mousemove', this.handleMouseMove);
    this.overlay.addEventListener('mouseup', this.handleMouseUp);
  }
  
  private disableSelection() {
    if (this.overlay) {
      this.overlay.style.pointerEvents = 'none';
      this.overlay.removeEventListener('mousedown', this.handleMouseDown);
      this.overlay.removeEventListener('mousemove', this.handleMouseMove);
      this.overlay.removeEventListener('mouseup', this.handleMouseUp);
    }
    
    if (this.selectionBox) {
      this.selectionBox.style.display = 'none';
    }
    
    this.isSelecting = false;
  }
  
  private handleMouseDown = (e: MouseEvent) => {
    this.isSelecting = true;
    this.startPoint = { x: e.clientX, y: e.clientY };
    
    if (this.selectionBox) {
      this.selectionBox.style.display = 'block';
      this.selectionBox.style.left = e.clientX + 'px';
      this.selectionBox.style.top = e.clientY + 'px';
      this.selectionBox.style.width = '0';
      this.selectionBox.style.height = '0';
    }
  };
  
  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isSelecting || !this.startPoint || !this.selectionBox) return;
    
    const width = Math.abs(e.clientX - this.startPoint.x);
    const height = Math.abs(e.clientY - this.startPoint.y);
    const left = Math.min(e.clientX, this.startPoint.x);
    const top = Math.min(e.clientY, this.startPoint.y);
    
    this.selectionBox.style.left = left + 'px';
    this.selectionBox.style.top = top + 'px';
    this.selectionBox.style.width = width + 'px';
    this.selectionBox.style.height = height + 'px';
  };
  
  private handleMouseUp = async (e: MouseEvent) => {
    if (!this.isSelecting || !this.startPoint) return;
    
    this.isSelecting = false;
    
    // 選択範囲をキャプチャしてOCR処理（将来的な実装用）
    const rect = {
      x: Math.min(e.clientX, this.startPoint.x),
      y: Math.min(e.clientY, this.startPoint.y),
      width: Math.abs(e.clientX - this.startPoint.x),
      height: Math.abs(e.clientY - this.startPoint.y)
    };
    
    console.log('Selection rectangle:', rect);
    
    // TODO: OCR処理を実装
    // this.performOCR(rect);
    
    if (this.selectionBox) {
      this.selectionBox.style.display = 'none';
    }
  };
  
  private highlightSelection(selection: Selection) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // ハイライト要素を作成
    const highlight = document.createElement('div');
    highlight.style.cssText = `
      position: fixed;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      background: rgba(255, 235, 59, 0.3);
      pointer-events: none;
      z-index: 9999;
      animation: fadeOut 2s ease-out forwards;
    `;
    
    // アニメーションスタイルを追加
    if (!document.querySelector('#text-selection-styles')) {
      const style = document.createElement('style');
      style.id = 'text-selection-styles';
      style.textContent = `
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(highlight);
    
    // 2秒後に削除
    setTimeout(() => {
      highlight.remove();
    }, 2000);
  }
  
  // YouTube動画ページのテキスト要素を選択可能にする
  makeYouTubeTextSelectable() {
    const selectors = [
      '#title h1',  // 動画タイトル
      '#info',      // 動画情報
      '#description',  // 説明文
      '.ytd-comment-renderer',  // コメント
      '.ytd-video-primary-info-renderer',  // プライマリ情報
      '.ytd-video-secondary-info-renderer'  // セカンダリ情報
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        (element as HTMLElement).style.userSelect = 'text';
        (element as HTMLElement).style.cursor = 'text';
      });
    });
    
    // 動画プレイヤー内のテキストも選択可能に
    const style = document.createElement('style');
    style.textContent = `
      .ytp-caption-segment {
        user-select: text !important;
        cursor: text !important;
      }
      
      .transcript-word {
        user-select: text !important;
      }
      
      /* Ctrl/Cmd押下時のカーソル */
      body.text-selection-mode * {
        cursor: crosshair !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // クリーンアップ
  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }
  
  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      document.body.classList.add('text-selection-mode');
    }
  };
  
  private handleKeyUp = (e: KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey) {
      document.body.classList.remove('text-selection-mode');
    }
  };
}