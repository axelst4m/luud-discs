
import './ButtonBuy.css';

const ButtonBuy = () => {
  const handleClick = () => {
    window.open('https://luuddiscs.bandcamp.com/album/f-unloved-ep', '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className="button-buy"
      type="button"
      aria-label="Buy F. Unloved EP on Bandcamp (opens in new tab)"
    >
      <span className="button-text">Buy it on Bandcamp</span>
      <svg
        className="button-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
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
    </button>
  );
};

export default ButtonBuy;
