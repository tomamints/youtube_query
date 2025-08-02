import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './popup.css';

interface Settings {
  apiKey: string;
  language: string;
  theme: string;
  apiProvider: 'instant' | 'anthropic' | 'openai' | 'claude-subscription' | 'claude-local' | 'claude-screenshot' | 'mock';
}

const App: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    apiKey: '',
    language: 'ja',
    theme: 'light',
    apiProvider: 'instant'
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // 設定を読み込む
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (response) {
        // デフォルト値とマージ（保存された設定に欠けているプロパティを補完）
        setSettings({
          apiKey: response.apiKey || '',
          language: response.language || 'ja',
          theme: response.theme || 'light',
          apiProvider: response.apiProvider || 'instant'
        });
      }
    });
  }, []);

  const handleSave = () => {
    chrome.runtime.sendMessage(
      { type: 'SAVE_SETTINGS', settings },
      () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    );
  };

  return (
    <div className="popup-container">
      <h2>YouTube学習アシスタント</h2>
      
      <div className="settings-section">
        <label>
          APIプロバイダー:
          <select
            value={settings.apiProvider}
            onChange={(e) => setSettings({ ...settings, apiProvider: e.target.value as any })}
          >
            <option value="instant">⚡ 即答モード（最速）</option>
            <option value="claude-screenshot">Claude.ai + スクリーンショット</option>
            <option value="claude-local">Claude Code (ローカル)</option>
            <option value="claude-subscription">Claude.ai (サブスク版)</option>
            <option value="anthropic">Claude API (Anthropic)</option>
            <option value="openai">ChatGPT API (OpenAI)</option>
            <option value="mock">モック版（デモ）</option>
          </select>
        </label>

        {settings.apiProvider === 'instant' && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#e3f2fd', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
              ⚡ 即答モード
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
              単語をクリックすると即座に説明が表示されます。
            </p>
            <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '11px', color: '#888' }}>
              <li>最速レスポンス（0.1秒以内）</li>
              <li>よく使われる単語は事前定義済み</li>
              <li>ネットワーク接続不要</li>
            </ul>
          </div>
        )}

        {settings.apiProvider === 'claude-screenshot' && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#fef3c7', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
              📸 Claude.ai + スクリーンショット
            </p>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>
              単語をクリックすると：
            </p>
            <ol style={{ margin: '0', paddingLeft: '20px', fontSize: '12px', color: '#666' }}>
              <li>動画のスクリーンショットを撮影</li>
              <li>Claude.aiが新しいタブで開く</li>
              <li>画像と質問が自動入力される</li>
              <li>送信ボタンを押すだけ！</li>
            </ol>
            <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#999' }}>
              ※ Claude.aiにログインしている必要があります
            </p>
          </div>
        )}

        {settings.apiProvider === 'claude-local' && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
              Claude Code ローカルサーバー
            </p>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#666' }}>
              ローカルサーバーを起動してください：
            </p>
            <pre style={{ 
              margin: '0', 
              padding: '8px', 
              backgroundColor: '#1e293b', 
              color: '#e2e8f0',
              borderRadius: '4px',
              fontSize: '11px',
              overflow: 'auto'
            }}>
              <code>cd ~/educont/server{'\n'}npm install{'\n'}npm start</code>
            </pre>
          </div>
        )}

        {(settings.apiProvider === 'anthropic' || settings.apiProvider === 'openai') && (
          <label>
            APIキー:
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
              placeholder={settings.apiProvider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
            />
            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
              {settings.apiProvider === 'anthropic' ? (
                <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">
                  Anthropic ConsoleでAPIキーを取得
                </a>
              ) : (
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                  OpenAIでAPIキーを取得
                </a>
              )}
            </small>
          </label>
        )}
        
        {settings.apiProvider === 'claude-subscription' && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#e8f4fd', 
            borderRadius: '4px',
            marginBottom: '15px'
          }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
              Claude.aiサブスクリプションを使用
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
              事前にClaude.aiにログインしてください。
            </p>
            <a 
              href="https://claude.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ fontSize: '12px' }}
            >
              Claude.aiを開く
            </a>
          </div>
        )}

        <label>
          言語:
          <select
            value={settings.language}
            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
          >
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </label>

        <label>
          テーマ:
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
          >
            <option value="light">ライト</option>
            <option value="dark">ダーク</option>
          </select>
        </label>
      </div>

      <button onClick={handleSave} className="save-button">
        保存
      </button>
      
      {saved && <div className="success-message">保存しました！</div>}
      
      <div className="info-section">
        <p>使い方:</p>
        <ol>
          <li>YouTube動画を開く</li>
          <li>字幕の単語をクリック</li>
          <li>AIが説明します</li>
        </ol>
      </div>
    </div>
  );
};

// DOMがロードされたら実行
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
});