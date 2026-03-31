import { useState, useEffect, useCallback, useRef } from 'react';

// FORCER RAILWAY EN PRODUCTION - PLUS DE VARIABLES D'ENVIRONNEMENT
const API = 'https://darkvolt-backend-production.up.railway.app';

export interface StreamlabsSettings {
  enabled: boolean;
  token?: string;
  connected: boolean;
  audioSources: AudioSource[];
  videoSources: VideoSource[];
  scenes: Scene[];
  available: boolean;
}

export interface AudioSource {
  name: string;
  id: string;
  volume: number;
  muted: boolean;
  type: 'desktop' | 'microphone' | 'auxiliary';
}

export interface VideoSource {
  name: string;
  id: string;
  width: number;
  height: number;
  fps: number;
  type: 'camera' | 'display' | 'window';
}

export interface Scene {
  name: string;
  id: string;
  sources: string[];
  active: boolean;
}

export function useStreamlabs(userId: string) {
  const [settings, setSettings] = useState<StreamlabsSettings>({
    enabled: false,
    connected: false,
    audioSources: [],
    videoSources: [],
    scenes: [],
    available: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier la disponibilité de Streamlabs
  const checkAvailability = useCallback(async () => {
    try {
      console.log('🎥 Streamlabs: Checking availability...');
      const response = await fetch(`${API}/api/streamlabs/availability`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎥 Streamlabs: Availability check:', data);
        setSettings(prev => ({ ...prev, available: data.available }));
        return data.available;
      }
    } catch (error) {
      console.error('🎥 Streamlabs: Availability check failed', error);
      setSettings(prev => ({ ...prev, available: false }));
    }
    return false;
  }, []);

  // Connexion à Streamlabs
  const connect = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🎥 Streamlabs: Connecting...');
      const response = await fetch(`${API}/api/streamlabs/connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎥 Streamlabs: Connected successfully', data);
        setSettings(prev => ({
          ...prev,
          enabled: true,
          connected: true,
          token,
          ...data.settings
        }));
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Connection failed');
      }
    } catch (error: any) {
      console.error('🎥 Streamlabs: Connection failed', error);
      setError(error.message);
      setSettings(prev => ({ ...prev, enabled: false, connected: false }));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Rafraîchir les settings
  const refreshSettings = useCallback(async () => {
    try {
      console.log('🎥 Streamlabs: Refreshing settings...');
      const response = await fetch(`${API}/api/streamlabs/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎥 Streamlabs: Settings refreshed', data);
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('🎥 Streamlabs: Failed to refresh settings', error);
    }
  }, []);

  // Démarrer le stream
  const startStream = useCallback(async (streamKey: string, sceneName?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🎥 Streamlabs: Starting stream...');
      const response = await fetch(`${API}/api/streamlabs/stream/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ streamKey, sceneName })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎥 Streamlabs: Stream started', data);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Stream start failed');
      }
    } catch (error: any) {
      console.error('🎥 Streamlabs: Stream start failed', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Arrêter le stream
  const stopStream = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🎥 Streamlabs: Stopping stream...');
      const response = await fetch(`${API}/api/streamlabs/stream/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎥 Streamlabs: Stream stopped', data);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Stream stop failed');
      }
    } catch (error: any) {
      console.error('🎥 Streamlabs: Stream stop failed', error);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Contrôler le volume
  const setVolume = useCallback(async (sourceName: string, volume: number) => {
    try {
      console.log(`🎥 Streamlabs: Setting ${sourceName} volume to ${volume}`);
      const response = await fetch(`${API}/api/streamlabs/audio/volume`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sourceName, volume })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎥 Streamlabs: Volume set', data);
        
        // Mettre à jour l'état local
        setSettings(prev => ({
          ...prev,
          audioSources: prev.audioSources.map(source =>
            source.name === sourceName ? { ...source, volume } : source
          )
        }));
        
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Volume control failed');
      }
    } catch (error: any) {
      console.error('🎥 Streamlabs: Volume control failed', error);
      setError(error.message);
      return false;
    }
  }, []);

  // Mute/Unmute
  const toggleMute = useCallback(async (sourceName: string, muted: boolean) => {
    try {
      console.log(`🎥 Streamlabs: ${muted ? 'Muting' : 'Unmuting'} ${sourceName}`);
      const response = await fetch(`${API}/api/streamlabs/audio/mute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sourceName, muted })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎥 Streamlabs: Mute toggled', data);
        
        // Mettre à jour l'état local
        setSettings(prev => ({
          ...prev,
          audioSources: prev.audioSources.map(source =>
            source.name === sourceName ? { ...source, muted } : source
          )
        }));
        
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Mute control failed');
      }
    } catch (error: any) {
      console.error('🎥 Streamlabs: Mute control failed', error);
      setError(error.message);
      return false;
    }
  }, []);

  // Changer de scène
  const switchScene = useCallback(async (sceneName: string) => {
    try {
      console.log(`🎥 Streamlabs: Switching to scene ${sceneName}`);
      const response = await fetch(`${API}/api/streamlabs/scene/switch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sceneName })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🎥 Streamlabs: Scene switched', data);
        
        // Mettre à jour l'état local
        setSettings(prev => ({
          ...prev,
          scenes: prev.scenes.map(scene =>
            scene.name === sceneName ? { ...scene, active: true } : { ...scene, active: false }
          )
        }));
        
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scene switch failed');
      }
    } catch (error: any) {
      console.error('🎥 Streamlabs: Scene switch failed', error);
      setError(error.message);
      return false;
    }
  }, []);

  // Déconnexion
  const disconnect = useCallback(async () => {
    try {
      console.log('🎥 Streamlabs: Disconnecting...');
      const response = await fetch(`${API}/api/streamlabs/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('🎥 Streamlabs: Disconnected');
        setSettings({
          enabled: false,
          connected: false,
          audioSources: [],
          videoSources: [],
          scenes: [],
          available: false
        });
        return true;
      }
    } catch (error: any) {
      console.error('🎥 Streamlabs: Disconnect failed', error);
      setError(error.message);
    }
    return false;
  }, []);

  // Vérifier la disponibilité au montage
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Rafraîchir les settings périodiquement si connecté
  useEffect(() => {
    if (settings.connected) {
      const interval = setInterval(refreshSettings, 5000); // Toutes les 5 secondes
      return () => clearInterval(interval);
    }
  }, [settings.connected, refreshSettings]);

  return {
    settings,
    loading,
    error,
    checkAvailability,
    connect,
    refreshSettings,
    startStream,
    stopStream,
    setVolume,
    toggleMute,
    switchScene,
    disconnect
  };
}
