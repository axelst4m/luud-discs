import './HomePage.css';
import Header from '../components/Header/Header';
import Packshot from '../components/Packshot/Packshot';
import ButtonBuy from '../components/Button/ButtonBuy';
import LogoLuud from '../components/LogoLuud/LogoLuud';
import AboutUs from '../components/AboutUs/AboutUs';
import ListenToUs from '../components/ListenToUs/ListenToUs';
import ContactUs from '../components/ContactUs/ContactUs';
import AudioPlayer from '../components/AudioPlayer/AudioPlayer';

const HomePage = () => {
  return (
    <main className="home-container">
      <Header />
      <Packshot />
      <ButtonBuy />
      <LogoLuud />
      <AboutUs />
      <section className="releases-section" aria-labelledby="listen-heading">
        <h2 id="listen-heading" className="section-title">ls ./releases</h2>
        <ListenToUs />
      </section>
      <ContactUs />
      <AudioPlayer />
    </main>
  );
};

export default HomePage;
