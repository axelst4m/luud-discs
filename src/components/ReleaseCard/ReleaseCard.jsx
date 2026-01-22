import PropTypes from 'prop-types';
import "./ReleaseCard.css";

const ReleaseCard = ({ release }) => {
  const { catalogNumber, title, cover, url, tracklist, id } = release;

  const handleClick = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
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
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={`View ${title} on external site`}
        type="button"
      >
        <img
          src={cover}
          alt={`${title} cover art`}
          className="release-cover"
          loading="lazy"
        />
        <span className="cover-overlay">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </span>
      </button>

      <ul className="tracklist" aria-label={`Tracklist for ${title}`}>
        {tracklist.map((track, index) => (
          <li key={`${id}-track-${index}`} className="track">
            {track}
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
    tracklist: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};

export default ReleaseCard;
