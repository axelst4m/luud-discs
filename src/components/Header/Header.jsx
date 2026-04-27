
import { Link } from 'react-router-dom';
import logo from '../../assets/logo-luud.webp';
import './Header.css';

const Header = () => {
  return (
    <header className="main-header">
      <img src={logo} alt="Lüüd Discs logo" className="logo" />
      <Link to="/slsk-tool" className="header-tool-link" title="SLSK-TOOL">
        &gt; ./slsk-tool
      </Link>
    </header>
  );
};

export default Header;