import { useState, useCallback, useRef } from 'react';
import { useStreamlabs } from './useStreamlabs';
import { useWebRTCBroadcaster } from './useWebRTCBroadcaster';

export interface HybridAudioConfig {
  mode: 'webrtc' | 'streamlabs' | 'hybrid';
  video: boolean;
  audio: boolean;
  microphone?: boolean;
  streamlabs?: {
    enabled: boolean;
    scene?: string;
  };
}

export function useHybridAudioStreamer(userId: string, username: string) {
  const [mode, setMode] = useState<HybridAudioConfig['mode']>('webrtc');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const streamlabs = useStreamlabs(userId);
  const webrtc = useWebRTCBroadcaster();

  // Détecter automatiquement le meilleur mode
  const detectOptimalMode = useCallback((): HybridAudioConfig['mode'] => {
    // Si Streamlabs est disponible et connecté, l'utiliser
    if (streamlabs.settings.connected) {
      return 'streamlabs';
    }
    
    // Sinon, utiliser WebRTC
    return 'webrtc';
  }, [streamlabs.settings.connected]);

  // Démarrer le stream avec le mode optimal
  const startStream = useCallback(async (config: Partial<HybridAudioConfig> = {}) => {
    setError(null);
    setIsStreaming(true);

    try {
      const finalMode = config.mode || detectOptimalMode();
      console.log(`🎥 Hybrid Audio: Starting stream in ${finalMode} mode`);

      switch (finalMode) {
        case 'streamlabs':
          return await startStreamlabsStream(config);
        case 'webrtc':
          return await startWebRTCStream(config);
        case 'hybrid':
          return await startHybridStream(config);
        default:
          throw new Error(`Unknown mode: ${finalMode}`);
      }
    } catch (error: any) {
      console.error('🎥 Hybrid Audio: Stream start failed', error);
      setError(error.message);
      setIsStreaming(false);
      throw error;
    }
  }, [detectOptimalMode]);

  // Stream via Streamlabs (audio pro)
  const startStreamlabsStream = useCallback(async (config: Partial<HybridAudioConfig>) => {
    console.log('🎥 Streamlabs: Starting professional audio stream');
    
    if (!streamlabs.settings.connected) {
      throw new Error('Streamlabs non connecté');
    }

    // Utiliser les sources Streamlabs configurées
    await streamlabs.startStream(
      '', // La clé de stream sera récupérée automatiquement
      config.streamlabs?.scene
    );

    setMode('streamlabs');
    console.log('🎥 Streamlabs: Professional stream started');
    return true;
  }, [streamlabs]);

  // Stream via WebRTC (fallback)
  const startWebRTCStream = useCallback(async (config: Partial<HybridAudioConfig>) => {
    console.log('🎥 WebRTC: Starting fallback stream');
    
    await webrtc.startBroadcast({
      video: config.video ?? true,
      audio: config.audio ?? true,
      microphone: config.microphone ?? true
    });

    setMode('webrtc');
    console.log('🎥 WebRTC: Fallback stream started');
    return true;
  }, [webrtc]);

  // Stream hybride (les deux)
  const startHybridStream = useCallback(async (config: Partial<HybridAudioConfig>) => {
    console.log('🎥 Hybrid: Starting dual stream');
    
    // Démarrer WebRTC pour la vidéo
    await webrtc.startBroadcast({
      video: config.video ?? true,
      audio: false, // Audio géré par Streamlabs
      microphone: false
    });

    // Démarrer Streamlabs pour l'audio pro
    await streamlabs.startStream(
      '',
      config.streamlabs?.scene
    );

    setMode('hybrid');
    console.log('🎥 Hybrid: Dual stream started (WebRTC video + Streamlabs audio)');
    return true;
  }, [webrtc, streamlabs]);

  // Arrêter le stream
  const stopStream = useCallback(async () => {
    console.log(`🎥 Hybrid Audio: Stopping ${mode} stream`);
    
    try {
      switch (mode) {
        case 'streamlabs':
          await streamlabs.stopStream();
          break;
        case 'webrtc':
          await webrtc.stopBroadcast();
          break;
        case 'hybrid':
          await Promise.all([
            streamlabs.stopStream(),
            webrtc.stopBroadcast()
          ]);
          break;
      }
      
      setIsStreaming(false);
      console.log('🎥 Hybrid Audio: Stream stopped');
    } catch (error: any) {
      console.error('🎥 Hybrid Audio: Stop failed', error);
      setError(error.message);
      throw error;
    }
  }, [mode, streamlabs, webrtc]);

  // Contrôles audio (uniquement pour Streamlabs)
  const setAudioVolume = useCallback(async (sourceName: string, volume: number) => {
    if (mode === 'streamlabs' || mode === 'hybrid') {
      return await streamlabs.setVolume(sourceName, volume);
    }
    return false;
  }, [mode, streamlabs]);

  const toggleAudioMute = useCallback(async (sourceName: string, muted: boolean) => {
    if (mode === 'streamlabs' || mode === 'hybrid') {
      return await streamlabs.toggleMute(sourceName, muted);
    }
    return false;
  }, [mode, streamlabs]);

  // Changer de scène (Streamlabs uniquement)
  const switchScene = useCallback(async (sceneName: string) => {
    if (mode === 'streamlabs' || mode === 'hybrid') {
      return await streamlabs.switchScene(sceneName);
    }
    return false;
  }, [mode, streamlabs]);

  // Obtenir les informations sur le mode actuel
  const getModeInfo = useCallback(() => {
    switch (mode) {
      case 'streamlabs':
        return {
          name: 'Streamlabs Pro',
          description: 'Audio studio quality via Streamlabs Desktop',
          features: ['Audio professionnel', 'Contrôle total des sources', 'Qualité studio'],
          status: streamlabs.settings.connected ? 'Actif' : 'Non connecté'
        };
      case 'webrtc':
        return {
          name: 'WebRTC Direct',
          description: 'Streaming direct via navigateur',
          features: ['Vidéo HD', 'Audio natif', 'Pas d\'installation'],
          status: webrtc.broadcasting ? 'Actif' : 'Inactif'
        };
      case 'hybrid':
        return {
          name: 'Hybrid Pro',
          description: 'Le meilleur des deux mondes',
          features: ['Vidéo WebRTC', 'Audio Streamlabs', 'Qualité maximale'],
          status: 'Premium'
        };
      default:
        return {
          name: 'Inconnu',
          description: 'Mode non détecté',
          features: [],
          status: 'Erreur'
        };
    }
  }, [mode, streamlabs.settings.connected, webrtc.broadcasting]);

  return {
    mode,
    isStreaming,
    error,
    streamlabsAvailable: streamlabs.settings.available,
    streamlabsConnected: streamlabs.settings.connected,
    webrtcActive: webrtc.broadcasting,
    
    // Actions
    startStream,
    stopStream,
    detectOptimalMode,
    setMode,
    
    // Contrôles audio
    setAudioVolume,
    toggleAudioMute,
    switchScene,
    
    // Infos
    getModeInfo,
    
    // Sources disponibles
    audioSources: streamlabs.settings.audioSources,
    scenes: streamlabs.settings.scenes,
    
    // WebRTC controls (backup)
    webrtcStart: webrtc.startBroadcast,
    webrtcStop: webrtc.stopBroadcast,
    webrtcToggleVideo: webrtc.toggleVideo,
    webrtcToggleAudio: webrtc.toggleAudio
  };
}
