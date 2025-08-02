import React, { useState, useRef, memo } from 'react';
import { Caption, getCurrentCaption, tokenizeCaption } from '../youtube-transcript';
import './TranscriptOverlay.css';

interface TranscriptOverlayProps {
  captions: Caption[];
  currentTime: number;
  onWordClick: (word: string, context: string) => void;
}

export const TranscriptOverlay: React.FC<TranscriptOverlayProps> = memo(({
  captions,
  currentTime,
  onWordClick
}) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 現在の字幕を取得
  const currentCaption = getCurrentCaption(captions, currentTime);

  // 位置を調整（ドラッグ可能にする準備）
  const [position] = useState({ x: 0, y: 0 });

  const handleWordClick = (word: string, fullText: string) => {
    setSelectedWord(word);
    onWordClick(word, fullText);
  };

  if (!currentCaption || isMinimized) {
    return (
      <div className="transcript-overlay minimized" onClick={() => setIsMinimized(false)}>
        <span className="minimize-icon">📝</span>
      </div>
    );
  }

  // テキストを単語に分割
  const words = tokenizeCaption(currentCaption.text);

  return (
    <div 
      ref={overlayRef}
      className="transcript-overlay"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    >
      <div className="overlay-header">
        <span className="overlay-title">字幕</span>
        <button 
          className="minimize-button"
          onClick={() => setIsMinimized(true)}
          title="最小化"
        >
          _
        </button>
      </div>
      
      <div className={`transcript-content ${(currentCaption as any).source === 'speech' ? 'has-speech-caption' : ''}`}>
        {(currentCaption as any).source === 'speech' && (
          <span className="speech-indicator">🎤</span>
        )}
        {words.map((word, index) => (
          <span
            key={index}
            className={`transcript-word ${selectedWord === word ? 'selected' : ''} ${(currentCaption as any).source === 'speech' ? 'speech-caption' : ''}`}
            onClick={() => handleWordClick(word, currentCaption.text)}
            title={`${(currentCaption as any).source === 'speech' ? '音声認識: ' : ''}クリックして質問`}
          >
            {word}
          </span>
        ))}
      </div>

      <div className="overlay-footer">
        <span className="hint-text">単語をクリックして質問</span>
      </div>
    </div>
  );
});