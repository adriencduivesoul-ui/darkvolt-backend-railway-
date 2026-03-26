# DARKVOLT RADIO — Guide de configuration

Deux options disponibles, toutes les deux **gratuites**.

---

## ✅ OPTION A — Playlist sur o2switch (RECOMMANDÉ)

**La plus simple** : tu uploades les MP3 du client directement sur ton hébergement o2switch via FTP.  
Le lecteur DarkVolt lit la liste et joue les tracks automatiquement les uns après les autres.  
Zéro service externe, zéro compte à créer, zéro limite de listeners.

### Étape 1 — Préparer les fichiers MP3

Télécharge les mixes du client depuis SoundCloud ou autre source.  
Renomme-les simplement (ex: `mix-01.mp3`, `mix-02.mp3`).

Pour chaque mix, prépare aussi :
- Une image de pochette JPG (facultatif mais recommandé pour afficher dans le lecteur)

### Étape 2 — Créer la structure sur o2switch via FTP

Connecte-toi en FTP à o2switch et crée ces dossiers dans `public_html/` :

```
public_html/
└── audio/
    ├── tracks/
    │   ├── mix-01.mp3
    │   ├── mix-02.mp3
    │   └── mix-03.mp3
    ├── covers/
    │   ├── mix-01.jpg
    │   ├── mix-02.jpg
    │   └── mix-03.jpg
    └── playlist.json
```

### Étape 3 — Créer le fichier `playlist.json`

Crée un fichier texte nommé `playlist.json` avec ce format :

```json
[
  {
    "title":    "VOLTAIC PRESSURE",
    "artist":   "DARKLOUXXX",
    "file":     "mix-01.mp3",
    "art":      "/audio/covers/mix-01.jpg",
    "duration": 3600
  },
  {
    "title":    "INDUSTRIAL NOIR SESSION",
    "artist":   "DARKLOUXXX",
    "file":     "mix-02.mp3",
    "art":      "/audio/covers/mix-02.jpg",
    "duration": 4200
  },
  {
    "title":    "DEAD SIGNAL TRANSMISSION",
    "artist":   "DARKLOUXXX",
    "file":     "mix-03.mp3",
    "art":      "/audio/covers/mix-03.jpg",
    "duration": 3900
  }
]
```

> `duration` est en secondes. 3600 = 1h, 4200 = 1h10, etc. Facultatif (enlève la ligne si tu ne sais pas).

### Étape 4 — Configurer le lecteur DarkVolt

Crée le fichier `client/.env.local` (jamais commité) :

```env
VITE_PLAYLIST_URL=https://darkvolt.fr/audio/playlist.json
VITE_AUDIO_BASE_URL=https://darkvolt.fr/audio/tracks
```

Remplace `darkvolt.fr` par ton vrai domaine o2switch.

### Étape 5 — Rebuild et déployer

```bash
npm run build
```

Uploade `dist/public/` sur o2switch → **c'est prêt**.

### Ce que le lecteur fait automatiquement

- Charge la `playlist.json` au démarrage de la page
- Quand le visiteur clique Play → démarre à un track aléatoire
- Affiche le titre, l'artiste et la pochette du track en cours
- Affiche la barre de progression avec la durée
- Passe automatiquement au track suivant à la fin
- Le spectre s'anime avec les vraies données audio (Web Audio API)

---

## État du lecteur sans configuration

Tant que `VITE_PLAYLIST_URL` n'est pas configuré :
- Le bouton Play est **grisé** avec le message "Configure VITE_PLAYLIST_URL dans .env"
- Zéro erreur dans la console
