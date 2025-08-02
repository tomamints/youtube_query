// デバッグ用スクリプト - コンソールで実行してください

console.log('=== YouTube Caption Debug ===');

// 1. 字幕ボタンの状態を確認
const captionButton = document.querySelector('.ytp-subtitles-button');
if (captionButton) {
  console.log('Caption button found:', {
    pressed: captionButton.getAttribute('aria-pressed'),
    disabled: captionButton.disabled,
    visible: window.getComputedStyle(captionButton).display !== 'none'
  });
} else {
  console.log('Caption button not found');
}

// 2. 実際の字幕要素を確認
const captionSegments = document.querySelectorAll('.ytp-caption-segment');
console.log('Caption segments found:', captionSegments.length);
if (captionSegments.length > 0) {
  captionSegments.forEach((seg, i) => {
    console.log(`Caption ${i}:`, seg.textContent);
  });
}

// 3. 字幕ウィンドウを確認
const captionWindow = document.querySelector('.caption-window');
console.log('Caption window:', captionWindow ? 'Found' : 'Not found');

// 4. プレイヤーAPIの確認
const player = document.querySelector('#movie_player');
if (player && player.getOption) {
  try {
    const tracks = player.getOption('captions', 'tracklist');
    console.log('Available caption tracks:', tracks);
    
    const currentTrack = player.getOption('captions', 'track');
    console.log('Current track:', currentTrack);
  } catch (e) {
    console.log('Error accessing player API:', e);
  }
}

// 5. ytInitialPlayerResponseの確認
if (window.ytInitialPlayerResponse) {
  console.log('ytInitialPlayerResponse found');
  const captions = window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  console.log('Caption tracks in playerResponse:', captions);
} else {
  console.log('ytInitialPlayerResponse not found');
}

console.log('=== End Debug ===');