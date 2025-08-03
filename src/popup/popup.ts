// ポップアップのメインスクリプト

// 設定の型定義
export interface Settings {
  apiKey: string;
  apiProvider: 'openai' | 'claude-api';
  language: 'ja' | 'en';
  enabled?: boolean; // 拡張機能のON/OFF状態
}

// DOMが読み込まれたら実行
document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('root');
  if (!root) return;

  // HTMLを生成
  root.innerHTML = `
    <div class="popup-container">
      <h1>🎓 YouTube学習アシスタント</h1>
      
      <div class="setting-group toggle-group">
        <label for="enabled">拡張機能:</label>
        <label class="toggle-switch">
          <input type="checkbox" id="enabled" />
          <span class="toggle-slider"></span>
          <span class="toggle-label">OFF</span>
        </label>
      </div>
      
      <div id="settingsContent">
        <div class="setting-group">
          <label for="apiProvider">APIプロバイダー:</label>
          <select id="apiProvider">
            <option value="openai">OpenAI (ChatGPT)</option>
            <option value="claude-api">Claude API</option>
          </select>
        </div>

      <div class="setting-group" id="apiKeyGroup" style="display: none;">
        <label for="apiKey">APIキー:</label>
        <input type="password" id="apiKey" placeholder="sk-..." />
        <small>OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank">APIキーを取得</a></small>
      </div>

        <div class="setting-group">
          <label for="language">言語:</label>
          <select id="language">
            <option value="ja">日本語</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <button id="saveButton">保存</button>
      <div id="status" style="display: none;"></div>
    </div>
  `;

  // スタイルを追加
  const style = document.createElement('style');
  style.textContent = `
    body {
      width: 350px;
      padding: 0;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .popup-container {
      padding: 20px;
      background: #f5f5f5;
    }
    
    h1 {
      font-size: 18px;
      margin: 0 0 20px 0;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .setting-group {
      margin-bottom: 15px;
    }
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #666;
      font-size: 14px;
    }
    
    select, input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      background: white;
      box-sizing: border-box;
    }
    
    input:focus, select:focus {
      outline: none;
      border-color: #4285f4;
      box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.1);
    }
    
    button {
      width: 100%;
      padding: 10px;
      background: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    button:hover {
      background: #3367d6;
    }
    
    #status {
      margin-top: 10px;
      padding: 8px;
      border-radius: 4px;
      font-size: 13px;
      text-align: center;
    }
    
    #status.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    
    #status.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    
    small {
      display: block;
      margin-top: 5px;
      color: #888;
      font-size: 12px;
    }
    
    a {
      color: #4285f4;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    .toggle-group {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 28px;
    }
    
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 28px;
    }
    
    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    
    input:checked + .toggle-slider {
      background-color: #4285f4;
    }
    
    input:checked + .toggle-slider:before {
      transform: translateX(32px);
    }
    
    .toggle-label {
      position: absolute;
      right: -35px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      font-weight: 500;
      min-width: 30px;
    }
    
    #settingsContent {
      opacity: 1;
      transition: opacity 0.3s ease;
    }
    
    #settingsContent.disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);

  // 要素を取得
  const enabledCheckbox = document.getElementById('enabled') as HTMLInputElement;
  const toggleLabel = document.querySelector('.toggle-label') as HTMLSpanElement;
  const settingsContent = document.getElementById('settingsContent') as HTMLDivElement;
  const apiProviderSelect = document.getElementById('apiProvider') as HTMLSelectElement;
  const apiKeyGroup = document.getElementById('apiKeyGroup') as HTMLDivElement;
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
  const languageSelect = document.getElementById('language') as HTMLSelectElement;
  const saveButton = document.getElementById('saveButton') as HTMLButtonElement;
  const statusDiv = document.getElementById('status') as HTMLDivElement;

  // 現在の設定を読み込む
  chrome.storage.local.get(['settings'], (result) => {
    const settings: Settings = result.settings || {};
    
    // デフォルトでON
    const isEnabled = settings.enabled !== false;
    enabledCheckbox.checked = isEnabled;
    toggleLabel.textContent = isEnabled ? 'ON' : 'OFF';
    settingsContent.classList.toggle('disabled', !isEnabled);
    
    if (settings.apiProvider) {
      apiProviderSelect.value = settings.apiProvider;
    }
    
    if (settings.apiKey) {
      apiKeyInput.value = settings.apiKey;
    }
    
    if (settings.language) {
      languageSelect.value = settings.language;
    }

    // APIキー入力欄の表示/非表示
    updateApiKeyVisibility();
  });

  // ON/OFFトグルの処理
  enabledCheckbox.addEventListener('change', () => {
    const isEnabled = enabledCheckbox.checked;
    toggleLabel.textContent = isEnabled ? 'ON' : 'OFF';
    settingsContent.classList.toggle('disabled', !isEnabled);
  });

  // APIプロバイダー変更時の処理
  apiProviderSelect.addEventListener('change', updateApiKeyVisibility);

  function updateApiKeyVisibility() {
    const provider = apiProviderSelect.value;
    if (provider === 'openai' || provider === 'claude-api') {
      apiKeyGroup.style.display = 'block';
      
      // プロバイダーに応じてヘルプリンクを更新
      const small = apiKeyGroup.querySelector('small');
      if (small) {
        if (provider === 'openai') {
          small.innerHTML = 'OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank">APIキーを取得</a>';
        } else {
          small.innerHTML = 'Claude: <a href="https://console.anthropic.com/settings/keys" target="_blank">APIキーを取得</a>';
        }
      }
    } else {
      apiKeyGroup.style.display = 'none';
    }
  }

  // 保存ボタンのクリック処理
  saveButton.addEventListener('click', async () => {
    const settings: Settings = {
      apiProvider: apiProviderSelect.value as Settings['apiProvider'],
      apiKey: apiKeyInput.value.trim(), // 前後の空白を削除
      language: languageSelect.value as Settings['language'],
      enabled: enabledCheckbox.checked
    };

    // APIキーが必要な場合はバリデーション
    if ((settings.apiProvider === 'openai' || settings.apiProvider === 'claude-api') && !settings.apiKey) {
      showStatus('APIキーを入力してください', 'error');
      return;
    }
    
    // APIキーの形式と長さをチェック
    if (settings.apiProvider === 'openai' && settings.apiKey) {
      if (!settings.apiKey.startsWith('sk-') || settings.apiKey.length < 40) {
        showStatus('OpenAI APIキーの形式が正しくありません', 'error');
        return;
      }
      // 危険な文字が含まれていないかチェック
      if (!/^sk-[a-zA-Z0-9-_]+$/.test(settings.apiKey)) {
        showStatus('APIキーに無効な文字が含まれています', 'error');
        return;
      }
    }
    
    if (settings.apiProvider === 'claude-api' && settings.apiKey) {
      if (!settings.apiKey.startsWith('sk-ant-') || settings.apiKey.length < 50) {
        showStatus('Claude APIキーの形式が正しくありません', 'error');
        return;
      }
      // 危険な文字が含まれていないかチェック
      if (!/^sk-ant-[a-zA-Z0-9-_]+$/.test(settings.apiKey)) {
        showStatus('APIキーに無効な文字が含まれています', 'error');
        return;
      }
    }

    // 設定を保存
    chrome.storage.local.set({ settings }, () => {
      showStatus('設定を保存しました', 'success');
      
      // 1秒後に自動的に閉じる
      setTimeout(() => {
        window.close();
      }, 1000);
    });
  });

  // ステータス表示
  function showStatus(message: string, type: 'success' | 'error') {
    statusDiv.textContent = message;
    statusDiv.className = type;
    statusDiv.style.display = 'block';
    
    // 3秒後に非表示
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
});

// 設定を取得する関数をエクスポート
export async function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      const settings: Settings = result.settings || {
        apiKey: '',
        apiProvider: 'openai',
        language: 'ja'
      };
      resolve(settings);
    });
  });
}