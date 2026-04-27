/**
 * lib/platforms.js
 *
 * Static list of search platforms shown on each track row. Each entry
 * has a key matching the cleaner's `links` shape (cf. lib/cleaner.js).
 */

export const PLATFORMS = [
  { key: 'youtube',    label: 'YT', title: 'Open on YouTube'      },
  { key: 'soundcloud', label: 'SC', title: 'Search on SoundCloud' },
  { key: 'bandcamp',   label: 'BC', title: 'Search on Bandcamp'   },
  { key: 'discogs',    label: 'DG', title: 'Search on Discogs'    },
];
