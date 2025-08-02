// YouTubeのコンソールで実行してください
console.log('=== YouTube API Test ===');

// 1. 動画プレイヤーのAPIを確認
const player = document.querySelector('#movie_player');
if (player && player.getVideoData) {
  const videoData = player.getVideoData();
  console.log('Video Data:', videoData);
}

// 2. 字幕トラックを確認
if (player && player.getOption) {
  try {
    const tracks = player.getOption('captions', 'tracklist');
    console.log('Caption tracks:', tracks);
    
    const currentTrack = player.getOption('captions', 'track');
    console.log('Current track:', currentTrack);
  } catch (e) {
    console.log('Error getting caption options:', e);
  }
}

// 3. ytInitialPlayerResponseを確認
if (window.ytInitialPlayerResponse) {
  const captions = window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  console.log('Caption tracks from ytInitialPlayerResponse:', captions);
}

// 4. プレイヤーの状態を確認
if (player) {
  console.log('Player state:', {
    currentTime: player.getCurrentTime(),
    duration: player.getDuration(),
    playbackRate: player.getPlaybackRate()
  });
}

console.log('=== End Test ===');