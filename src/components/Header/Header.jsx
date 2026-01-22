
import logo from '../../assets/logo-header.webp';
import './Header.css';

const Header = () => {
  return (
    <header className="main-header">
      <img src={logo} alt="Lüüd Discs logo" className="logo" />
    </header>
  );
};

export default Header;