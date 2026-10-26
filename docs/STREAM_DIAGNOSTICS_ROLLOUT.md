# DarkVolt Stream Diagnostics — déploiement contrôlé

Cette branche est une préparation NON DÉPLOYÉE. Le frontend servi sur darkvolt.fr en juillet 2026 n'est plus dans main. NE PAS fusionner les anciennes sources client/ ni déployer aveuglément.

## Backend ajouté
- Socket.IO diagnostics:sample, seulement pour un socket diffuseur ou auditeur enregistré, au plus une mesure toutes les 3 secondes.
- Mesures: état WebRTC, jitter, RTT, pertes, débits, audio masqué/reconstruit, niveaux et réglages audio.
- Les champs hors schéma sont supprimés; pas d'audio brut, pas d'IP, pas de SDP ni deviceId.
- Conservation de 2 500 événements / 60 minutes en mémoire ; logs structurés des incidents Railway.
- Consultation de /api/internal/stream-diagnostics protégée par ADMIN_DIAGNOSTICS_TOKEN de 24 caractères minimum.

## À réaliser avant mise en ligne
1. Récupérer la source exacte du frontend actuellement déployé sur o2switch. L'historique du dépôt contient une ancienne version, incompatible avec un remplacement complet.
2. Brancher getStats() sur les pairs WebRTC de useWebRTCBroadcaster et useWebRTCViewer. Nettoyer les timers lors de la fermeture du pair.
3. Intégrer la capture USB strictement identifiée, sans remplacement silencieux par le microphone Android ; contrôler les réglages getSettings().
4. Corriger le double playback de StreamAudioPlayer. Les flux de sortie HTMLAudioElement et WebAudio doivent être mutuellement exclusifs.
5. Afficher les mesures dans le dashboard administrateur via un endpoint protégé. Ne jamais inclure le secret admin dans le bundle client.
6. Tester Android Chrome / PWA / Discord / 1 puis 3 auditeurs. Vérifier l'absence de régression chat, vidéo, lecteur radio et archives.
7. Déployer sur une copie de préproduction, sauvegarder, puis organiser un rollback avant toute modification live.

## Interprétation
Ce module corrèle le son capturé et les pertes réseau, mais ne prouve pas la cause matérielle d'un grésillement. Données WebRTC non disponibles selon navigateur, conservation RAM perdue au restart ; les logs Railway ont une rétention indépendante.