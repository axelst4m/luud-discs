import './ContactUs.css';

const ContactUs = () => {
  return (
    <footer className="contact-us">
      <div className="contact-prompt">
        <span className="prompt-symbol">$</span>
        <span className="prompt-command">contact</span>
        <span className="prompt-flag">--email</span>
      </div>
      <a
        href="mailto:&#108;&#117;&#117;&#100;&#46;&#100;&#105;&#115;&#99;&#115;&#64;&#103;&#109;&#97;&#105;&#108;&#46;&#99;&#111;&#109;"
        className="contact-email"
      >
        luud.discs@gmail.com
      </a>
      <div className="copyright">
        <span>© 2016-2026 Lüüd Discs</span>
        <span className="divider">|</span>
        <span>All rights reserved</span>
      </div>
    </footer>
  );
};

export default ContactUs;
