import React, { useState, useEffect, useRef } from 'react';
import './ExplanationPanel.css';

interface ExplanationPanelProps {
  selectedWord: string | null;
  context: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Settings {
  apiKey: string;
  apiProvider: 'openai' | 'claude-api';
  language: 'ja' | 'en';
}

// 設定を取得する関数
async function getSettings(): Promise<Settings> {
  return new Promise((resolve, reject) => {
    // 拡張機能のコンテキストが有効かチェック
    if (!chrome.runtime?.id) {
      reject(new Error('拡張機能が再読み込みされました。ページをリロードしてください。'));
      return;
    }
    
    try {
      chrome.storage.local.get(['settings'], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        
        const settings: Settings = result.settings || {
          apiKey: '',
          apiProvider: 'openai',
          language: 'ja'
        };
        resolve(settings);
      });
    } catch (error) {
      reject(new Error('設定の取得に失敗しました。ページをリロードしてください。'));
    }
  });
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ selectedWord, context }) => {
  const [currentAnswer, setCurrentAnswer] = useState<{ word: string; answer: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('ExplanationPanel rendered with:', { selectedWord, context });

  useEffect(() => {
    console.log('ExplanationPanel useEffect triggered:', { selectedWord, currentAnswer });
    if (selectedWord && selectedWord !== currentAnswer?.word) {
      handleWordClick(selectedWord, context);
    }
  }, [selectedWord, context]);

  const handleWordClick = async (word: string, fullText: string) => {
    console.log('ExplanationPanel: handleWordClick called with:', word);
    console.log('Full context:', fullText);
    setLoading(true);
    setCurrentAnswer(null); // 前の回答をクリア
    
    try {
      console.log('Getting settings...');
      const settings = await getSettings();
      console.log('Settings:', settings);
      
      // 動画コンテキストでの意味を尋ねるプロンプト
      const initialPrompt = `この動画の文脈における「${word}」の意味を教えてください。動画の内容: ${fullText}`;
      console.log('Initial prompt:', initialPrompt);
      
      console.log('About to send message, provider:', settings.apiProvider);
      
      {
        console.log('Using API provider:', settings.apiProvider);
        // コンテキストが無効でないかチェック
        if (!chrome.runtime?.id) {
          throw new Error('拡張機能が再読み込みされました。ページをリロードしてください。');
        }
        
        chrome.runtime.sendMessage({
          type: 'ASK_AI',
          word: initialPrompt,
          context: fullText,
          language: settings.language
        }, (response) => {
          console.log('ASK_AI response:', response);
          if (chrome.runtime.lastError) {
            console.error('Chrome runtime error:', chrome.runtime.lastError);
            setCurrentAnswer({ word, answer: 'エラー: 拡張機能との通信に失敗しました。ページをリロードしてください。' });
            setLoading(false);
            return;
          }
          if (response && response.answer) {
            setCurrentAnswer({ word, answer: response.answer });
            // 最初の解説をチャット履歴に追加
            setMessages([
              { role: 'user', content: `「${word}」のこの動画での意味` },
              { role: 'assistant', content: response.answer }
            ]);
          } else if (response && response.error) {
            let errorMessage = response.error;
            if (response.error.includes('429') || response.error.includes('quota')) {
              errorMessage = 'OpenAI APIの利用上限に達しました。\n\n対処方法：\n1. OpenAIアカウントにクレジットを追加\n2. または設定で「即答モード（無料）」に切り替え';
            } else if (response.error.includes('401')) {
              errorMessage = 'APIキーが無効です。設定画面で正しいAPIキーを入力してください。';
            } else if (response.error.includes('credit balance is too low')) {
              errorMessage = 'Claude APIのクレジット残高が不足しています。\n\nAnthropicアカウントでクレジットを追加してください。';
            }
            setCurrentAnswer({ word, answer: errorMessage });
          }
          setLoading(false);
        });
      }
    } catch (error) {
      console.error('Error in handleWordClick:', error);
      setCurrentAnswer({ word, answer: `エラー: ${error instanceof Error ? error.message : '不明なエラー'}` });
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
        type: 'ASK_AI',
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
              
              {currentAnswer && currentAnswer.answer.includes('拡張機能が再読み込み') && (
                <div className="error-message" style={{
                  backgroundColor: '#ffebee',
                  color: '#c62828',
                  padding: '12px',
                  borderRadius: '4px',
                  margin: '12px',
                  fontSize: '14px'
                }}>
                  {currentAnswer.answer}
                  <button 
                    onClick={() => window.location.reload()} 
                    style={{
                      display: 'block',
                      marginTop: '8px',
                      padding: '6px 12px',
                      backgroundColor: '#c62828',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ページをリロード
                  </button>
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