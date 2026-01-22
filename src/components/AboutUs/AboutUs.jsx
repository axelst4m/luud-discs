
import './AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-us">
      <h2 className="section-title">About Us</h2>
      <p className="bio">
        <strong>Lüüd Discs</strong> is an electronic music label founded by KHALK in 2016,
        dedicated to exploring house, deep house, and break sounds. The label stands out
        for its artistic independence, supporting emerging artists through original
        productions and creative remixes.
      </p>
      <p className="bio">
        In 2023, Lüüd Discs launched <strong>Düül Scsid</strong>, a sub-label that focuses
        on more IDM-oriented sounds, while also offering digital and CD releases, providing
        a different approach from Lüüd Discs. This sub-label explores more abstract and
        experimental soundscapes, continually pushing the boundaries of musical creation.
      </p>
      <h2 className="section-title">Find Us Online</h2>
      <nav className="links" aria-label="Social media links">
        <a
          href="https://luuddiscs.bandcamp.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Lüüd Discs on Bandcamp"
        >
          Bandcamp
        </a>
        <a
          href="https://www.discogs.com/fr/label/1183599-L%C3%BC%C3%BCd-Discs?page=1"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Lüüd Discs on Discogs"
        >
          Discogs
        </a>
        <a
          href="https://soundcloud.com/luuddiscs"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Lüüd Discs on Soundcloud"
        >
          Soundcloud
        </a>
        <a
          href="https://www.instagram.com/luud.discs"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Lüüd Discs on Instagram"
        >
          Instagram
        </a>
        <a
          href="https://www.facebook.com/luuddiscs"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visit Lüüd Discs on Facebook"
        >
          Facebook
        </a>
      </nav>
    </div>
  );
};

export default AboutUs;