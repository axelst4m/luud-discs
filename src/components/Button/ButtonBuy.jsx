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
      <span className="button-text">./buy --bandcamp</span>
    </button>
  );
};

export default ButtonBuy;
