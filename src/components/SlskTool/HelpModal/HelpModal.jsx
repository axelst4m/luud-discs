import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import './HelpModal.css';

const LANG_KEY = 'slsk.lang';

const readLang = () => {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return (v === 'en' || v === 'fr') ? v : null;
  } catch { return null; }
};
const writeLang = (v) => {
  try { localStorage.setItem(LANG_KEY, v); } catch { /* swallow */ }
};
const defaultLang = () => {
  try {
    return (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
  } catch { return 'en'; }
};

const HelpModal = ({ isOpen, onClose }) => {
  const [lang, setLang] = useState(() => readLang() ?? defaultLang());
  const closeBtnRef = useRef(null);

  // Lock background scroll, focus close button on open, listen Escape.
  useEffect(() => {
    if (!isOpen) return;
    document.body.classList.add('slsk-help-open');
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    closeBtnRef.current?.focus();
    return () => {
      document.body.classList.remove('slsk-help-open');
      document.removeEventListener('keydown', handler);
    };
  }, [isOpen, onClose]);

  const setAndPersistLang = (next) => {
    setLang(next);
    writeLang(next);
  };

  if (!isOpen) return null;

  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div
      className="slsk-help"
      role="dialog"
      aria-modal="true"
      aria-label="Help"
      onClick={onBackdropClick}
    >
      <div className="slsk-help__backdrop" />
      <div className="slsk-help__panel" role="document">
        <header className="slsk-help__header">
          <div className="slsk-help__langs" role="tablist" aria-label="Language">
            {['en', 'fr'].map((l) => (
              <button
                key={l}
                type="button"
                className={`slsk-help__lang${lang === l ? ' slsk-help__lang--active' : ''}`}
                onClick={() => setAndPersistLang(l)}
                role="tab"
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="slsk-help__close"
            onClick={onClose}
            aria-label="close"
          >
            close [esc]
          </button>
        </header>
        <div
          className="slsk-help__body"
          dangerouslySetInnerHTML={{ __html: lang === 'fr' ? FR : EN }}
        />
      </div>
    </div>,
    document.body,
  );
};

HelpModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default HelpModal;

// ---------------------------------------------------------------------------
// Tutorial content (EN / FR). Kept as raw HTML strings for simple injection.
// ---------------------------------------------------------------------------

const EN = `
  <h2 class="slsk-help__title">SLSK-TOOL</h2>

  <p>SLSK-TOOL is a tool built by the Lüüd Discs team. The starting point is simple: neither Soulseek nor Nicotine+ has built-in preview, yet those networks regularly surface users with a sharp ear and a deep catalog worth exploring. SLSK-TOOL takes a shared folder listing and outputs a list of tracks, each one paired with search links to YouTube, SoundCloud, Bandcamp and Discogs, to make previewing and discovery flow naturally.</p>

  <h3>1. Input</h3>
  <p>Three ways to feed it, pick the tab that matches your source:</p>
  <ul>
    <li><strong>TEXT</strong> : paste a block of raw filenames, one per line.</li>
    <li><strong>SCREENSHOT</strong> : the way in for Soulseek, which has no JSON export. Drop a screenshot of the user folder (filenames alone are enough). OCR runs in the browser and extracts the text. It works best on sharp monospace text. The first run fetches around 2 MB of OCR data, cached after that.</li>
    <li><strong>NICOTINE+ JSON</strong> : the most accurate source. Nicotine+ saves fetched user shares as a file with no extension. On macOS, the path is <code>/Users/&lt;your-user&gt;/.local/share/nicotine/usershares/</code>. Add <code>.json</code> to the filename, then drop the file here.</li>
  </ul>

  <h3>2. Preview and queue</h3>
  <p>Each row has a <code>+ Q</code> button. Clicking it adds the track to the preview queue. The first track starts playing in an embedded YouTube player at the bottom of the page, and when it ends the queue advances to the next one automatically. <code>PREV</code> and <code>NEXT</code> in the player let you skip manually. The queue persists across sessions.</p>
  <p>Each row also carries four search links (<code>YT</code>, <code>SC</code>, <code>BC</code>, <code>DG</code>) that open in a new tab. Useful when YouTube doesn't have the track and you'd rather check Bandcamp or Discogs directly.</p>

  <h3>3. Marks</h3>
  <p>Two independent flags on each row:</p>
  <ul>
    <li><strong>STAR</strong> : a track worth keeping an eye on, added to the footer shortlist.</li>
    <li><strong>HEARD</strong> : already previewed, can be skipped next time.</li>
  </ul>
  <p>Both flags are stored locally and persist across sessions.</p>

  <h3>4. Filters</h3>
  <p>The free-text search matches titles and folder paths. The format checkboxes (MP3, FLAC, WAV, OTHER) narrow the list, and the state selector cycles between ALL, UNHEARD, STARRED and HEARD.</p>

  <h3>5. FLAT and TREE (Nicotine+ only)</h3>
  <p><strong>TREE</strong> is a folder browser, best for going through an album or a label.</p>
  <p><strong>FLAT</strong> is a single list of every track, best for searching across the whole share.</p>

  <h3>6. Starred footer</h3>
  <p>Starring a track makes a dock slide up at the bottom of the page, holding the shortlist with the same four preview links for each entry.</p>
  <ul>
    <li><code>CP</code> copies a single filename to the clipboard.</li>
    <li><code>UN</code> drops an entry from the shortlist.</li>
    <li><code>COPY ALL</code> copies every starred filename at once.</li>
    <li><code>CLEAR</code> empties the shortlist (two-click confirm).</li>
  </ul>

  <h3>Privacy</h3>
  <p>Everything runs in the browser. Screenshots, JSON files and marks never leave the machine.</p>

  <h3>Support the artists</h3>
  <p>If a track or an artist catches your ear, the honest way is to buy the music directly: Bandcamp, Boomkat, Juno, Discogs, label websites, physical releases. Previewing is not owning.</p>
`;

const FR = `
  <h2 class="slsk-help__title">SLSK-TOOL</h2>

  <p>SLSK-TOOL est un outil développé par la team Lüüd Discs. Le constat est simple : Soulseek et Nicotine+ ne proposent pas de pré-écoute, alors qu'on tombe souvent sur des users au goût pointu dont les dossiers partagés donnent envie d'être explorés. SLSK-TOOL prend une biblio partagée et en sort une liste de morceaux, chacun accompagné de liens de recherche vers YouTube, SoundCloud, Bandcamp et Discogs, pour fluidifier la pré-écoute et la découverte.</p>

  <h3>1. Entrée</h3>
  <p>Trois modes d'entrée, à choisir selon la source disponible :</p>
  <ul>
    <li><strong>TEXT</strong> : coller un pavé de noms de fichiers bruts, un par ligne.</li>
    <li><strong>SCREENSHOT</strong> : la méthode pour Soulseek, qui n'a pas d'export JSON. Déposer une capture du dossier d'un user (les noms de fichiers suffisent). L'OCR tourne directement dans le navigateur et en extrait le texte. Fonctionne mieux sur du texte monospace net. Premier lancement, environ 2 Mo de données OCR à charger, mis en cache ensuite.</li>
    <li><strong>NICOTINE+ JSON</strong> : la source la plus précise. Nicotine+ enregistre les biblios récupérées dans un fichier sans extension. Sur macOS, le chemin est <code>/Users/&lt;votre-user&gt;/.local/share/nicotine/usershares/</code>. Il suffit d'ajouter <code>.json</code> à la fin du nom du fichier, puis de le déposer ici.</li>
  </ul>

  <h3>2. Pré-écoute et queue</h3>
  <p>Chaque ligne a un bouton <code>+ Q</code>. En cliquant, le morceau s'ajoute à la queue de pré-écoute. Le premier morceau démarre dans un player YouTube intégré en bas de page, et quand il se termine la queue passe automatiquement au suivant. <code>PREV</code> et <code>NEXT</code> dans le player permettent de naviguer manuellement. La queue persiste entre les sessions.</p>
  <p>Chaque ligne porte aussi quatre liens de recherche (<code>YT</code>, <code>SC</code>, <code>BC</code>, <code>DG</code>) qui s'ouvrent dans un nouvel onglet. Utile quand le morceau n'est pas sur YouTube et qu'on préfère aller voir directement sur Bandcamp ou Discogs.</p>

  <h3>3. Marqueurs</h3>
  <p>Deux marqueurs indépendants sur chaque ligne :</p>
  <ul>
    <li><strong>STAR</strong> : morceau à garder à l'œil, ajouté à la shortlist en bas de page.</li>
    <li><strong>HEARD</strong> : déjà pré-écouté, à ignorer la prochaine fois.</li>
  </ul>
  <p>Les deux marqueurs sont stockés localement et persistent entre les sessions.</p>

  <h3>4. Filtres</h3>
  <p>La recherche texte cible les titres et les chemins de dossiers. Les cases formats (MP3, FLAC, WAV, OTHER) affinent la liste, et le sélecteur d'état bascule entre ALL, UNHEARD, STARRED et HEARD.</p>

  <h3>5. FLAT et TREE (Nicotine+ uniquement)</h3>
  <p><strong>TREE</strong> : explorateur de dossiers, adapté pour parcourir un album ou un label.</p>
  <p><strong>FLAT</strong> : liste plate de tous les morceaux, adaptée pour chercher à travers toute la bibliothèque.</p>

  <h3>6. Footer starred</h3>
  <p>Mettre un STAR fait apparaître un dock en bas de page, contenant la shortlist avec les mêmes quatre liens de pré-écoute pour chaque entrée.</p>
  <ul>
    <li><code>CP</code> copie un filename dans le presse-papier.</li>
    <li><code>UN</code> retire une entrée de la shortlist.</li>
    <li><code>COPY ALL</code> copie tous les filenames starred d'un seul coup.</li>
    <li><code>CLEAR</code> vide la shortlist (confirmation en deux clics).</li>
  </ul>

  <h3>Vie privée</h3>
  <p>Tout tourne dans le navigateur. Screenshots, fichiers JSON et marquages ne quittent jamais la machine.</p>

  <h3>Soutenir les artistes</h3>
  <p>Si un morceau ou un artiste accroche l'oreille, la bonne démarche reste l'achat direct : Bandcamp, Boomkat, Juno, Discogs, les sites des labels, le support physique. La pré-écoute n'est pas la possession.</p>
`;
