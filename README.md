# Lüüd Discs

Site vitrine du label de musique électronique **Lüüd Discs**, fondé en 2016 par KHALK.

## Stack technique

- **React 18** avec Vite
- **CSS** vanilla (pas de framework)
- **ESLint** pour le linting

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

Le site sera accessible sur `http://localhost:5173`

## Build production

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`.

## Structure du projet

```
src/
├── assets/              # Images (WebP optimisées)
├── components/
│   ├── AboutUs/         # Section à propos + liens sociaux
│   ├── Button/          # Bouton d'achat Bandcamp
│   ├── ContactUs/       # Formulaire de contact
│   ├── Header/          # En-tête avec logo
│   ├── ListenToUs/      # Grille des releases
│   ├── LogoLuud/        # Logo du label
│   ├── Packshot/        # Visuel produit featured
│   └── ReleaseCard/     # Carte release réutilisable
├── data/
│   └── releases.js      # Données centralisées des releases
├── pages/
│   └── HomePage.jsx     # Page principale
├── App.jsx
├── App.css
├── index.css            # Styles globaux + reset
└── main.jsx
```

## Ajouter une release

Modifier le fichier `src/data/releases.js` :

```javascript
{
  id: "luud008",
  catalogNumber: "LÜÜD008",
  title: "Artiste - Titre EP",
  cover: importedCover,
  url: "https://lien-vers-la-release",
  tracklist: [
    "A1 - Track 1",
    "A2 - Track 2",
    "B1 - Track 3",
  ],
}
```

## Liens

- [Bandcamp](https://luuddiscs.bandcamp.com)
- [Discogs](https://www.discogs.com/fr/label/1183599-Lüüd-Discs)
- [Soundcloud](https://soundcloud.com/luuddiscs)
- [Instagram](https://www.instagram.com/luud.discs)
