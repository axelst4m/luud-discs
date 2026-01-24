import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import './AudioPlayer.css';

// Playlist of YouTube IDs from releases (27 tracks)
const DEFAULT_PLAYLIST = [
  // LÜÜD001 - Southside Touch
  { id: 'ifk9af3uzF8', title: 'Southside Touch' },
  { id: '_FO3QEVE_SQ', title: 'Bwi-Bwi - Insight' },
  { id: 'H_3cAYBTgxI', title: 'Mangabey - K129' },
  { id: 'kOjDJDutyEY', title: 'KHALK - Yu All MF' },
  // LÜÜD002 - Luvless - Misunderstood EP
  { id: 'oSnEf3pr_Z8', title: 'Luvless - Misunderstood' },
  { id: 'AleWjHtHY2c', title: 'Luvless - Slightly Different' },
  { id: 'Q7pA392Q9Kc', title: 'Luvless - Happiness' },
  { id: 'UsPdxdwp_4A', title: 'Luvless - Easy & Fun' },
  // LÜÜD003 - Javonntte - From Paris to the World EP
  { id: 'k5HUdSW14gE', title: 'Javonntte - Rock With It' },
  { id: 'EuiW_AbHsl8', title: 'Javonntte - Jmix' },
  { id: 'BJSauG8lOrQ', title: 'Javonntte - Romance' },
  { id: 'FU4Q_WCiUxs', title: 'Javonntte - Rock With It (Bwi-Bwi Remix)' },
  // LÜÜD004 - 55 EP
  { id: 'hfF8mFMYgE8', title: 'Cosmonection - Bir Hakeim' },
  { id: 'XP-yaG9vrE8', title: 'Dj Performance - RER A.cid' },
  { id: 'JXljwrBO-w8', title: 'Lastvuska - Crimée' },
  { id: 'wc0OPhy0ZSI', title: 'Mjog - Pantruche Beurrée' },
  // LÜÜD005 - Share the Wax EP
  { id: 'c5iSWMul--E', title: 'AES - Jhonedo' },
  { id: 'flEUR4e101I', title: 'AES - WAYD' },
  { id: 'tDyPLImJN6o', title: 'Armless Kid - 603' },
  { id: '8MqLuULS0zs', title: 'Armless Kid - 604' },
  // LÜÜD006 - Bwi-Bwi - Canto Soulèu EP
  { id: 'DZD4Hgmj8bQ', title: 'Bwi-Bwi - Canto Soulèu' },
  { id: 'V1LKJ7iVT7w', title: 'Bwi-Bwi - Canto Soulèu (A.M. Mix)' },
  { id: 's4ogL957HhI', title: 'Bwi-Bwi - The Truth Is Out There' },
  { id: 'LGw_Ezpjflg', title: 'Bwi-Bwi - Retool' },
  // LÜÜD007 - GAMBLER EP
  { id: 'oda87h9f7pU', title: 'B.R.U.M.E - Badman' },
  { id: 'JOyHXKXXRQ0', title: 'B.R.U.M.E - Gambler' },
  { id: 'OkybypQ3a9c', title: 'B.R.U.M.E - Roll Em Up' },
  { id: 'Cg-tT-f5hwA', title: 'B.R.U.M.E - Doomed' },
  { id: '_NYO2P592-g', title: 'B.R.U.M.E - Kord Punch' },
  { id: 'wLttnyxlF74', title: 'B.R.U.M.E - Gambler (Fluctuosa Remix)' },
  { id: 'TEgWkCleQCc', title: 'B.R.U.M.E - Gambler (François Ier Remix)' },
];

const AudioPlayer = ({ playlist = DEFAULT_PLAYLIST }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  // Shuffle playlist on mount
  const [shuffledPlaylist] = useState(() => {
    return [...playlist].sort(() => Math.random() - 0.5);
  });

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) {
      setIsReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsReady(true);
    };

    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  // Handle playing next track
  const handlePlayNext = useCallback(() => {
    setCurrentTrack((prev) => {
      const nextIndex = (prev + 1) % shuffledPlaylist.length;
      if (playerRef.current) {
        playerRef.current.loadVideoById(shuffledPlaylist[nextIndex].id);
      }
      return nextIndex;
    });
  }, [shuffledPlaylist]);

  // Initialize player when API is ready
  useEffect(() => {
    if (!isReady || playerRef.current) return;

    playerRef.current = new window.YT.Player('yt-player', {
      height: '0',
      width: '0',
      videoId: shuffledPlaylist[0].id,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onStateChange: (event) => {
          // When video ends, play next
          if (event.data === window.YT.PlayerState.ENDED) {
            handlePlayNext();
          }
        },
        onError: () => {
          // Skip to next on error
          handlePlayNext();
        },
      },
    });
  }, [isReady, shuffledPlaylist, handlePlayNext]);

  const playNext = useCallback(() => {
    const nextIndex = (currentTrack + 1) % shuffledPlaylist.length;
    setCurrentTrack(nextIndex);
    if (playerRef.current) {
      playerRef.current.loadVideoById(shuffledPlaylist[nextIndex].id);
    }
  }, [currentTrack, shuffledPlaylist]);

  const playPrev = useCallback(() => {
    const prevIndex = currentTrack === 0 ? shuffledPlaylist.length - 1 : currentTrack - 1;
    setCurrentTrack(prevIndex);
    if (playerRef.current) {
      playerRef.current.loadVideoById(shuffledPlaylist[prevIndex].id);
    }
  }, [currentTrack, shuffledPlaylist]);

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`audio-player ${isPlaying ? 'playing' : ''}`} ref={containerRef}>
      {/* Hidden YouTube player */}
      <div id="yt-player" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />

      {/* Radio header */}
      <div className="radio-header">
        <span className="radio-name">📻 Lüüd Discs Radio</span>
      </div>

      {/* Track title - always visible */}
      <div className="track-display">
        <span className="track-prefix">{isPlaying ? '▶' : '■'}</span>
        <span className={`track-title ${isPlaying ? 'scrolling' : ''}`}>
          {shuffledPlaylist[currentTrack]?.title || 'Ready'}
        </span>
      </div>

      {/* Player UI */}
      <div className="player-controls">
        <button
          className="player-btn prev-btn"
          onClick={playPrev}
          disabled={!isReady}
          aria-label="Previous track"
          title="Previous"
        >
          ⏮
        </button>

        <button
          className={`player-btn play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
          disabled={!isReady}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <button
          className="player-btn next-btn"
          onClick={playNext}
          disabled={!isReady}
          aria-label="Next track"
          title="Next"
        >
          ⏭
        </button>
      </div>
    </div>
  );
};

AudioPlayer.propTypes = {
  playlist: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    })
  ),
};

export default AudioPlayer;
