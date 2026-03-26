/* ============================================================
   DARKVOLT — RADIO CONFIG
   Lecteur custom — playlist MP3 hébergée sur o2switch.

   Crée un fichier .env à la racine du projet avec :
     VITE_PLAYLIST_URL=https://darkvolt.fr/audio/playlist.json
     VITE_AUDIO_BASE_URL=https://darkvolt.fr/audio/tracks
   Consulte SETUP_RADIO.md pour le guide complet.
   ============================================================ */

export const RADIO_CONFIG = {
  // ── Playlist MP3 sur o2switch ───────────────────────────────
  // 1. Uploadez vos MP3 sur https://darkvolt.fr/audio/tracks/
  // 2. Uploadez un fichier audio/playlist.json (voir SETUP_RADIO.md)
  playlistUrl:   import.meta.env.VITE_PLAYLIST_URL   ?? '',
  audioBaseUrl:  import.meta.env.VITE_AUDIO_BASE_URL ?? '',

  // ── Infos station ──────────────────────────────────────────
  stationName:   'DARKVOLT RADIO',
  stationSlogan: 'LA FRÉQUENCE UNDERGROUND',
  bitrate:       '320 kbps',
  format:        'MP3',
} as const;
