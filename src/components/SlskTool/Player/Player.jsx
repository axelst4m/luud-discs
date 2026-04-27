import { useEffect, useRef, useState } from 'react';
import { searchFirstVideo, youtubeEmbedUrl, youtubeSearchUrl } from '../../../lib/youtube.js';
import { useQueue } from '../../../hooks/useQueue.js';
import './Player.css';

/**
 * Sticky preview player. Driven by the queue store: whenever the user
 * picks a track in the queue, we resolve `query → videoId` via our
 * Worker, then load the YouTube iframe with autoplay.
 *
 * When the iframe ends, we ask the queue to advance to the next track.
 *
 * The iframe is recreated on every track change so the YT player picks
 * up the new src cleanly. We use postMessage from the iframe (YouTube
 * IFrame API enabled by `?enablejsapi=1`) to detect end-of-video.
 */
const Player = () => {
  const { current, currentIndex, items, playNext, playPrev, stop } = useQueue();

  const [hit, setHit]       = useState(null); // { videoId, title }
  const [phase, setPhase]   = useState('idle'); // idle | searching | playing | failed
  const tokenRef            = useRef(0);
  const iframeRef           = useRef(null);

  // Resolve the current track to a videoId whenever it changes.
  useEffect(() => {
    if (!current) {
      setHit(null);
      setPhase('idle');
      return;
    }
    const myToken = ++tokenRef.current;
    setPhase('searching');
    setHit(null);
    let cancelled = false;
    (async () => {
      const found = await searchFirstVideo(current.title);
      if (cancelled || tokenRef.current !== myToken) return;
      if (found) {
        setHit(found);
        setPhase('playing');
      } else {
        setHit(null);
        setPhase('failed');
      }
    })();
    return () => { cancelled = true; };
  }, [current?.filename]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen to YouTube IFrame API messages (state 0 = ENDED).
  useEffect(() => {
    function onMessage(event) {
      if (event.origin !== 'https://www.youtube.com') return;
      let data = event.data;
      if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (data?.event === 'onStateChange' && data?.info === 0) {
        playNext();
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [playNext]);

  // Tell the iframe to listen for state changes once it's loaded.
  useEffect(() => {
    if (phase !== 'playing' || !iframeRef.current) return;
    const iframe = iframeRef.current;
    function onLoad() {
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening' }),
        'https://www.youtube.com',
      );
      iframe.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }),
        'https://www.youtube.com',
      );
    }
    iframe.addEventListener('load', onLoad);
    return () => iframe.removeEventListener('load', onLoad);
  }, [phase, hit?.videoId]);

  // Toggle a body-level class so the rest of the layout (starred footer)
  // can shift out of the way while the player is on screen.
  useEffect(() => {
    if (items.length > 0 && currentIndex >= 0) {
      document.body.classList.add('slsk-player-open');
    } else {
      document.body.classList.remove('slsk-player-open');
    }
    return () => document.body.classList.remove('slsk-player-open');
  }, [items.length, currentIndex]);

  if (items.length === 0 || currentIndex < 0) return null;

  const queueLabel = `${currentIndex + 1} / ${items.length}`;
  const ytExternal = hit
    ? `https://www.youtube.com/watch?v=${hit.videoId}`
    : youtubeSearchUrl(current?.title || '');

  return (
    <div className="slsk-player">
      <div className="slsk-player__header">
        <span className={`slsk-player__status slsk-player__status--${phase}`}>
          {phase === 'searching' && 'SEARCHIN'}
          {phase === 'playing'   && 'PLAYIN'}
          {phase === 'failed'    && 'NOT FOUND'}
          {phase === 'idle'      && 'IDLE'}
        </span>
        <span className="slsk-player__title" title={current?.title}>
          {current?.title}
        </span>
        <span className="slsk-player__count">[{queueLabel}]</span>
        <span className="slsk-player__controls">
          <button
            type="button"
            className="slsk-player__btn"
            onClick={playPrev}
            disabled={currentIndex <= 0}
            title="Previous in queue"
          >
            PREV
          </button>
          <button
            type="button"
            className="slsk-player__btn"
            onClick={playNext}
            disabled={currentIndex >= items.length - 1}
            title="Next in queue"
          >
            NEXT
          </button>
          <a
            className="slsk-player__btn slsk-player__btn--link"
            href={ytExternal}
            target="_blank"
            rel="noopener noreferrer"
            title="Open on YouTube"
          >
            ↗
          </a>
          <button
            type="button"
            className="slsk-player__btn slsk-player__btn--danger"
            onClick={stop}
            title="Stop and close player"
          >
            ×
          </button>
        </span>
      </div>

      <div className="slsk-player__body">
        {phase === 'searching' && (
          <div className="slsk-player__placeholder">
            <span className="slsk-player__spinner" /> resolving track on YouTube…
          </div>
        )}
        {phase === 'playing' && hit && (
          <iframe
            ref={iframeRef}
            key={hit.videoId}
            className="slsk-player__frame"
            src={youtubeEmbedUrl(hit.videoId)}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            title={current?.title || 'YouTube preview'}
          />
        )}
        {phase === 'failed' && (
          <div className="slsk-player__placeholder slsk-player__placeholder--failed">
            <p>Couldn&apos;t resolve this one. Try the YouTube search:</p>
            <a className="slsk-player__btn" href={ytExternal} target="_blank" rel="noopener noreferrer">
              search on YouTube ↗
            </a>
            <button type="button" className="slsk-player__btn" onClick={playNext}>
              skip to next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;
