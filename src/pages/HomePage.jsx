import './HomePage.css';
import Header from '../components/Header/Header';
import Events from '../components/Events/Events';
import Packshot from '../components/Packshot/Packshot';
import ButtonBuy from '../components/Button/ButtonBuy';
import AboutUs from '../components/AboutUs/AboutUs';
import ListenToUs from '../components/ListenToUs/ListenToUs';
import ContactUs from '../components/ContactUs/ContactUs';
import AudioPlayer from '../components/AudioPlayer/AudioPlayer';
import duulLogo from '../assets/logo-header.webp';

const HomePage = () => {
  return (
    <main className="home-container">
      <Header />
      <section className="events-section" aria-labelledby="events-heading">
        <h2 id="events-heading" className="section-title">ls ./events</h2>
        <Events />
      </section>
      <AboutUs />
      <section className="releases-section" aria-labelledby="listen-heading">
        <h2 id="listen-heading" className="section-title">ls ./releases</h2>
        <ListenToUs />
      </section>
      <section className="duul-section" aria-labelledby="duul-heading">
        <h2 id="duul-heading" className="section-title">cat ./duul-scsid</h2>
        <img src={duulLogo} alt="Düül Scsid logo" className="duul-logo" />
        <Packshot />
        <ButtonBuy />
        <div className="duul-digital">
          <h3 className="duul-digital-title">ls ./digital</h3>
          <div className="duul-digital-list">
            <a
              href="https://www.youtube.com/watch?v=U2svwLq2XQY"
              target="_blank"
              rel="noopener noreferrer"
              className="duul-digital-release"
            >
              <span className="duul-release-artist">Sportsmanship</span>
              <span className="duul-release-track">Meoreuli</span>
              <svg className="duul-yt-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </a>
            <a
              href="https://www.youtube.com/watch?v=JTZR5K99yaY"
              target="_blank"
              rel="noopener noreferrer"
              className="duul-digital-release"
            >
              <span className="duul-release-artist">B.R.U.M.E</span>
              <span className="duul-release-track">Xv1</span>
              <svg className="duul-yt-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </a>
          </div>
        </div>
      </section>
      <ContactUs />
      <AudioPlayer />
    </main>
  );
};

export default HomePage;
