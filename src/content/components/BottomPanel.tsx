import React, { useState, useRef } from 'react';
import { Caption, tokenizeCaption } from '../youtube-transcript';
import './BottomPanel.css';

interface BottomPanelProps {
  captions: Caption[];
  currentTime: number;
  onWordClick: (word: string, context: string) => void;
  currentAnswer: { word: string; answer: string } | null;
  loading: boolean;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  captions,
  onWordClick
}) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const captionSectionRef = useRef<HTMLDivElement>(null);
  
  const handleWordClick = (word: string, fullText: string) => {
    setSelectedWord(word);
    onWordClick(word, fullText);
  };
  
  // テキスト選択のハンドラー
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      setSelectedWord(selectedText);
      
      // 選択されたテキストの文脈を取得
      const captionElement = selection.anchorNode?.parentElement?.closest('.caption-line');
      const context = captionElement?.textContent || selectedText;
      
      onWordClick(selectedText, context);
    }
  };
  
  return (
    <div className={`bottom-panel ${isCompact ? 'compact' : ''}`} ref={panelRef}>
      <div className="panel-header">
        <span className="panel-title">🎓 学習アシスタント</span>
        <div className="panel-controls">
          <button 
            className="compact-toggle"
            onClick={() => setIsCompact(!isCompact)}
            title={isCompact ? "通常表示" : "コンパクト表示"}
          >
            {isCompact ? "⬆️" : "⬇️"}
          </button>
          {!isCompact && <span className="panel-hint">単語をクリック or 範囲選択して質問</span>}
        </div>
      </div>
      
      <div className="panel-content">
        <div className="caption-section" ref={captionSectionRef} onMouseUp={handleTextSelection}>
          <h3 className="section-title">字幕</h3>
          {captions.length > 0 ? (
            <div className="caption-content">
              {captions.map((caption, index) => (
                <div key={index} className={`caption-line ${(caption as any).isCurrent ? 'current-caption' : ''} ${(caption as any).isHistory ? 'history-caption' : ''}`}>
                  {tokenizeCaption(caption.text).map((word, wordIndex) => (
                    <span
                      key={`${index}-${wordIndex}`}
                      className={`caption-word ${selectedWord === word ? 'selected' : ''}`}
                      onClick={() => handleWordClick(word, caption.text)}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-caption">字幕を待っています...</div>
          )}
        </div>
      </div>
    </div>
  );
};