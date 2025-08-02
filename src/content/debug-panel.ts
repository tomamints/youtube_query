// デバッグパネル（開発用）

export function createDebugPanel() {
  // 既存のパネルがあれば削除
  const existing = document.getElementById('yt-learning-debug');
  if (existing) {
    existing.remove();
  }

  // デバッグパネルを作成
  const panel = document.createElement('div');
  panel.id = 'yt-learning-debug';
  panel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10001;
    max-width: 300px;
    max-height: 400px;
    overflow-y: auto;
  `;

  // 状態を表示
  const updatePanel = () => {
    const video = document.querySelector('video') as HTMLVideoElement;
    const captionContainer = document.querySelector('.ytp-caption-window-container');
    const overlay = document.getElementById('youtube-learning-overlay');
    
    panel.innerHTML = `
      <h3 style="margin: 0 0 10px 0; font-size: 14px;">🔍 Debug Panel</h3>
      <div style="line-height: 1.5;">
        <strong>Video:</strong> ${video ? '✅ Found' : '❌ Not found'}<br>
        ${video ? `Time: ${video.currentTime.toFixed(2)}s` : ''}<br>
        <strong>Caption Container:</strong> ${captionContainer ? '✅ Found' : '❌ Not found'}<br>
        <strong>Our Overlay:</strong> ${overlay ? '✅ Injected' : '❌ Not injected'}<br>
        <strong>URL:</strong> ${window.location.pathname}<br>
        <strong>Video ID:</strong> ${new URLSearchParams(window.location.search).get('v') || 'N/A'}<br>
        <br>
        <button onclick="window.dispatchEvent(new Event('yt-learning-reload'))" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        ">Reload Extension</button>
      </div>
    `;
  };

  // 初回更新
  updatePanel();

  // 定期的に更新
  const interval = setInterval(updatePanel, 1000);

  // クリーンアップ
  window.addEventListener('yt-learning-cleanup', () => {
    clearInterval(interval);
    panel.remove();
  });

  document.body.appendChild(panel);
}

// グローバルに公開（デバッグ用）
(window as any).ytLearningDebug = {
  showPanel: createDebugPanel,
  hidePanel: () => {
    const panel = document.getElementById('yt-learning-debug');
    if (panel) panel.remove();
  },
  getCaptions: () => {
    return (window as any).currentCaptions || [];
  },
  getState: () => {
    return {
      video: !!document.querySelector('video'),
      captions: (window as any).currentCaptions?.length || 0,
      overlay: !!document.getElementById('youtube-learning-overlay'),
      popup: !!document.getElementById('youtube-learning-popup')
    };
  }
};