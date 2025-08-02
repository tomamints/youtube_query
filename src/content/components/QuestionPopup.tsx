import React, { useState, useEffect } from 'react';
import './QuestionPopup.css';

interface QuestionPopupProps {
  word: string;
  context: string;
  answer: string | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export const QuestionPopup: React.FC<QuestionPopupProps> = ({
  word,
  context,
  answer,
  loading,
  error,
  onClose
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // ESCキーで閉じる
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="question-popup-overlay" onClick={onClose}>
      <div 
        className={`question-popup ${isExpanded ? 'expanded' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="popup-header">
          <h3 className="popup-title">「{word}」について</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="popup-content">
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Claudeに質問中...</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <p className="error-message">⚠️ {error}</p>
              <p className="error-hint">
                Claude.aiにログインしているか確認してください。
              </p>
            </div>
          )}

          {answer && (
            <div className="answer-container">
              <div className="context-section">
                <h4>文脈</h4>
                <p className="context-text">{context}</p>
              </div>
              
              <div className="answer-section">
                <h4>説明</h4>
                <div className="answer-text">
                  {answer.split('\n').map((line, i) => (
                    <p key={i}>{line || '\u00A0'}</p>
                  ))}
                </div>
              </div>

              <button 
                className="expand-button"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? '簡潔に表示' : '詳しく見る'}
              </button>
            </div>
          )}
        </div>

        <div className="popup-footer">
          <span className="powered-by">Powered by Claude</span>
        </div>
      </div>
    </div>
  );
};