import React, { useState, useEffect, useRef } from 'react';
import { getSettings } from '../../popup/popup';
import './ExplanationPanel.css';

interface ExplanationPanelProps {
  selectedWord: string | null;
  context: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ selectedWord, context }) => {
  const [currentAnswer, setCurrentAnswer] = useState<{ word: string; answer: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedWord && selectedWord !== currentAnswer?.word) {
      handleWordClick(selectedWord, context);
    }
  }, [selectedWord, context]);

  const handleWordClick = async (word: string, fullText: string) => {
    console.log('ExplanationPanel: handleWordClick called with:', word);
    setLoading(true);
    setCurrentAnswer(null); // 前の回答をクリア
    
    try {
      const settings = await getSettings();
      console.log('Settings:', settings);
      
      // 動画コンテキストでの意味を尋ねるプロンプト
      const initialPrompt = `この動画の文脈における「${word}」の意味を教えてください。動画の内容: ${fullText}`;
      
      if (settings.apiProvider === 'instant') {
        chrome.runtime.sendMessage({
          type: 'INSTANT_ANSWER',
          word: initialPrompt,
          context: fullText,
          language: settings.language
        }, (response) => {
          console.log('Instant answer response:', response);
          if (response && response.answer) {
            setCurrentAnswer({ word, answer: response.answer });
            // 最初の解説をチャット履歴に追加
            setMessages([
              { role: 'user', content: `「${word}」のこの動画での意味` },
              { role: 'assistant', content: response.answer }
            ]);
          } else {
            setCurrentAnswer({ word, answer: 'エラー: 回答を取得できませんでした' });
          }
          setLoading(false);
        });
      } else {
        chrome.runtime.sendMessage({
          type: 'ASK_AI',
          word: initialPrompt,
          context: fullText,
          language: settings.language
        }, (response) => {
          if (response && response.answer) {
            setCurrentAnswer({ word, answer: response.answer });
            // 最初の解説をチャット履歴に追加
            setMessages([
              { role: 'user', content: `「${word}」のこの動画での意味` },
              { role: 'assistant', content: response.answer }
            ]);
          } else if (response && response.error) {
            setCurrentAnswer({ word, answer: `エラー: ${response.error}` });
          }
          setLoading(false);
        });
      }
    } catch (error) {
      console.error('Error handling word click:', error);
      setLoading(false);
    }
  };

  // チャット送信処理
  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;
    
    const userMessage: Message = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    
    try {
      const settings = await getSettings();
      
      // フォローアップ質問はそのまま送信（コンテキストは会話履歴に含める）
      const conversationContext = messages.map(m => `${m.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${m.content}`).join('\n');
      const fullContext = `${conversationContext}\n\nユーザー: ${inputValue}`;
      
      chrome.runtime.sendMessage({
        type: settings.apiProvider === 'instant' ? 'INSTANT_ANSWER' : 'ASK_AI',
        word: inputValue,  // 質問をそのまま送信
        context: fullContext,
        language: settings.language
      }, (response) => {
        if (response && response.answer) {
          setMessages(prev => [...prev, { role: 'assistant', content: response.answer }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: 'エラー: 回答を取得できませんでした' }]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
    }
  };

  // 自動スクロール（チャットメッセージエリア内のみ）
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      // scrollIntoViewではなく、親要素のscrollTopを直接操作
      const chatArea = messagesEndRef.current.parentElement;
      if (chatArea) {
        chatArea.scrollTop = chatArea.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="explanation-panel">
      <div className="panel-header">
        <h3 className="panel-title">
          <span className="title-icon">🎓</span>
          AI解説
        </h3>
      </div>

      <div className="panel-chat-container">
        {/* チャットメッセージエリア */}
        <div className="chat-messages-area">
          {messages.length > 0 ? (
            <>
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.role}`}>
                  <div className="message-content">{message.content}</div>
                </div>
              ))}
              {loading && (
                <div className="message assistant">
                  <div className="loading-inline">
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                    <div className="loading-dot"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <>
              {loading && (
                <div className="initial-loading">
                  <div className="loading-spinner"></div>
                  <span>解説を生成中...</span>
                </div>
              )}
              
              {!currentAnswer && !loading && (
                <div className="answer-placeholder">
                  字幕の単語をクリックすると<br/>解説が表示されます
                </div>
              )}
            </>
          )}
        </div>
        
        {/* チャット入力欄 - 解説が表示されている時のみ表示 */}
        {(currentAnswer || messages.length > 0) && (
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="さらに質問する..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={loading}
            />
            <button 
              className="send-button"
              onClick={handleSendMessage}
              disabled={loading || !inputValue.trim()}
            >
              送信
            </button>
          </div>
        )}
      </div>
    </div>
  );
};