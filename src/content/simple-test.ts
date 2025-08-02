// シンプルなテストスクリプト
console.log('🔧 Simple test script loaded!');

// 基本的な動作確認
try {
  console.log('URL:', window.location.href);
  console.log('Video element:', !!document.querySelector('video'));
  console.log('Chrome runtime:', typeof chrome.runtime);
  
  // 5秒後に字幕コンテナを確認
  setTimeout(() => {
    const captionContainer = document.querySelector('.ytp-caption-window-container');
    console.log('Caption container found:', !!captionContainer);
    
    if (captionContainer) {
      console.log('Caption container classes:', captionContainer.className);
      console.log('Caption text:', captionContainer.textContent);
    }
  }, 5000);
  
} catch (error) {
  console.error('Test script error:', error);
}