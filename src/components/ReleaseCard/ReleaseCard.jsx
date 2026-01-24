import PropTypes from 'prop-types';
import "./ReleaseCard.css";

const ReleaseCard = ({ release }) => {
  const { catalogNumber, title, cover, url, tracklist, id } = release;

  const handleCoverClick = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCoverKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCoverClick();
    }
  };

  return (
    <article className="release-card">
      <header className="release-header">
        <span className="catalog-number">{catalogNumber}</span>
        <h3 className="release-title">{title}</h3>
      </header>

      <button
        className="release-cover-btn"
        onClick={handleCoverClick}
        onKeyDown={handleCoverKeyDown}
        aria-label={`View ${title} on external site`}
        type="button"
      >
        <img
          src={cover}
          alt={`${title} cover art`}
          className="release-cover"
          loading="lazy"
        />
        <span className="cover-overlay" aria-hidden="true" />
      </button>

      <ul className="tracklist" aria-label={`Tracklist for ${title}`}>
        {tracklist.map((track, index) => (
          <li key={`${id}-track-${index}`} className="track">
            {track.youtubeId ? (
              <a
                href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="track-link"
                aria-label={`Watch ${track.name} on YouTube`}
              >
                <span className="track-name">{track.name}</span>
                <svg
                  className="youtube-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </a>
            ) : (
              <span className="track-name">{track.name}</span>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
};

ReleaseCard.propTypes = {
  release: PropTypes.shape({
    id: PropTypes.string.isRequired,
    catalogNumber: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    cover: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    tracklist: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        youtubeId: PropTypes.string,
      })
    ).isRequired,
  }).isRequired,
};

export default ReleaseCard;
