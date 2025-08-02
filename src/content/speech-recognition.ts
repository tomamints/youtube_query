// Web Speech APIを使った高精度音声認識

export class SpeechRecognitionManager {
  private recognition: any;
  private _isListening: boolean = false;
  private onTranscript: (text: string, isFinal: boolean) => void;
  
  get isListening(): boolean {
    return this._isListening;
  }
  // private videoElement: HTMLVideoElement | null = null;
  // private lastTranscriptTime: number = 0;
  
  constructor(onTranscript: (text: string, isFinal: boolean) => void) {
    this.onTranscript = onTranscript;
    
    // Web Speech APIのチェック
    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Web Speech API is not supported');
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.setupRecognition();
  }
  
  private setupRecognition() {
    // 日本語に設定
    this.recognition.lang = 'ja-JP';
    
    // 連続認識を有効化
    this.recognition.continuous = true;
    
    // 中間結果も取得
    this.recognition.interimResults = true;
    
    // 最大の候補数
    this.recognition.maxAlternatives = 1;
    
    // 認識結果のハンドラー
    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const currentIndex = results.length - 1;
      const transcript = results[currentIndex][0].transcript;
      const isFinal = results[currentIndex].isFinal;
      
      // 動画の現在時刻を取得（将来使用予定）
      // const currentTime = this.videoElement?.currentTime || 0;
      
      console.log('🎤 Speech recognition:', transcript, isFinal ? '(final)' : '(interim)');
      
      // 中間結果も含めて表示
      if (transcript.trim().length > 0) {
        this.onTranscript(transcript, isFinal);
      }
    };
    
    // エラーハンドラー
    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      // 自動的に再起動
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setTimeout(() => {
          if (this._isListening) {
            this.restart();
          }
        }, 1000);
      }
    };
    
    // 終了ハンドラー
    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // 自動的に再起動
      if (this._isListening) {
        setTimeout(() => this.restart(), 100);
      }
    };
  }
  
  async start(_videoElement: HTMLVideoElement) {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return;
    }
    
    // マイクの権限をリクエスト
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎤 Microphone permission granted');
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return;
    }
    
    // this.videoElement = videoElement;
    this._isListening = true;
    
    try {
      this.recognition.start();
      console.log('🎤 Speech recognition started successfully');
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      // 既に開始されている場合は再起動
      if (error instanceof Error && error.message.includes('already started')) {
        this.recognition.stop();
        setTimeout(() => {
          this.recognition.start();
          console.log('🎤 Speech recognition restarted');
        }, 100);
      }
    }
  }
  
  stop() {
    this._isListening = false;
    
    if (this.recognition) {
      try {
        this.recognition.stop();
        console.log('Speech recognition stopped');
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
      }
    }
  }
  
  private restart() {
    if (!this._isListening) return;
    
    try {
      this.recognition.start();
      console.log('Speech recognition restarted');
    } catch (error) {
      console.error('Failed to restart speech recognition:', error);
    }
  }
  
  isAvailable(): boolean {
    return !!this.recognition;
  }
}

// 音声認識による字幕生成
export interface SpeechCaption {
  text: string;
  start: number;
  duration: number;
  isFinal: boolean;
}