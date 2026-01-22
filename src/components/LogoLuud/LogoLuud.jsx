
import logoluud from '../../assets/logo-luud.webp';
import './LogoLuud.css';

const LogoLuud = () => {
  return (
    <div className="luuud-logo-container">
      <img src={logoluud} alt="Lüüd Discs logo" className="logo-luud" />
    </div>
  );
};

export default LogoLuud;