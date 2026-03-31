import { useState, useRef, useCallback } from 'react';

// Vérification de la disponibilité de navigator.mediaDevices
const isMediaDevicesAvailable = () => {
  return typeof navigator !== 'undefined' && 
         navigator.mediaDevices && 
         typeof navigator.mediaDevices.getUserMedia === 'function' && 
         typeof navigator.mediaDevices.getDisplayMedia === 'function' &&
         typeof navigator.mediaDevices.enumerateDevices === 'function';
};

export interface AudioCaptureOptions {
  includeMicrophone: boolean;
  includeSystemAudio: boolean;
}

// Déclarations pour l'extension DarkVolt
declare global {
  interface Window {
    DarkVoltAudio?: {
      captureSystemAudio(): Promise<{ success: boolean; data?: any; error?: string }>;
      stopStream(): Promise<{ success: boolean; data?: any; error?: string }>;
      getStatus(): Promise<{ active: boolean; connectedTab?: number }>;
    };
    
    DarkVoltAudioPro?: {
      captureSystemAudio(options?: {
        sampleRate?: number;
        channelCount?: number;
        autoGainControl?: boolean;
        echoCancellation?: boolean;
        noiseSuppression?: boolean;
      }): Promise<{ 
        success: boolean; 
        stream?: MediaStream; 
        tracks?: MediaStreamTrack[]; 
        original?: any; 
        settings?: any; 
        quality?: any; 
        error?: string 
      }>;
      stopCapture(): Promise<{ success: boolean; data?: any; error?: string }>;
      getStatus(): { isCapturing: boolean; hasStream: boolean; settings: any; extensionAvailable: boolean };
    };
  }
}

// Capture audio système natif avec getDisplayMedia (2024)
async function captureNativeSystemAudio(): Promise<MediaStream | null> {
  if (!isMediaDevicesAvailable()) {
    console.warn('🎛️ navigator.mediaDevices not available');
    return null;
  }
  
  try {
    console.log('🚀 Capture audio système natif...');
    
    // Essayer d'abord avec la nouvelle syntaxe Chrome 2024
    try {
      const displayMediaOptions = {
        video: false,
        audio: true as any  // Forcer l'audio pour Chrome 2024
      };
      
      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      
      // Garder seulement les pistes audio
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        const audioStream = new MediaStream(audioTracks);
        console.log('✅ Audio système capturé nativement:', audioStream);
        return audioStream;
      }
    } catch (chromeError) {
      console.log('🔍 Chrome 2024 syntax failed, trying fallback...');
    }
    
    // Fallback: Capture avec vidéo puis extraire audio
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true
    });
    
    // Garder seulement les pistes audio
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('Aucune piste audio trouvée');
    }
    
    // Arrêter les pistes vidéo
    stream.getVideoTracks().forEach(track => track.stop());
    
    const audioStream = new MediaStream(audioTracks);
    console.log('✅ Audio système capturé (fallback):', audioStream);
    
    return audioStream;
    
  } catch (error) {
    console.error('❌ Erreur capture audio natif:', error);
    return null;
  }
}

// Vérifier si l'extension DarkVolt est disponible
async function checkDarkVoltExtension(): Promise<boolean> {
  return new Promise((resolve) => {
    // Vérifier si l'API est injectée
    if (window.DarkVoltAudio || window.DarkVoltAudioPro) {
      console.log('🚀 DarkVolt Audio Extension détectée');
      resolve(true);
      return;
    }
    
    // Attendre un peu pour l'injection
    setTimeout(() => {
      if (window.DarkVoltAudio || window.DarkVoltAudioPro) {
        console.log('🚀 DarkVolt Audio Extension détectée (délai)');
        resolve(true);
      } else {
        console.log('❌ DarkVolt Audio Extension non détectée');
        resolve(false);
      }
    }, 2000);
  });
}

// Capturer l'audio avec l'extension DarkVolt
async function captureWithDarkVoltExtension(): Promise<MediaStream | null> {
  try {
    console.log('🚀 Capture audio avec extension DarkVolt...');
    
    // Utiliser l'API de l'extension
    let response;
    
    if (window.DarkVoltAudioPro) {
      // Version pro avec effets
      response = await window.DarkVoltAudioPro.captureSystemAudio({
        sampleRate: 44100,
        channelCount: 2,
        autoGainControl: false,
        echoCancellation: false,
        noiseSuppression: false
      });
    } else if (window.DarkVoltAudio) {
      // Version standard
      response = await window.DarkVoltAudio.captureSystemAudio();
    } else {
      throw new Error('Extension API non disponible');
    }
    
    if (response && response.success) {
      console.log('✅ Extension DarkVolt capture réussie');
      
      // Créer un MediaStream à partir de la réponse
      if ('stream' in response && response.stream) {
        return response.stream;
      } else if ('tracks' in response && response.tracks) {
        // Créer un stream à partir des pistes
        return new MediaStream(response.tracks);
      } else if ('data' in response && response.data && response.data.tracks) {
        // Version standard avec data.tracks
        return new MediaStream(response.data.tracks);
      } else {
        throw new Error('Aucune piste audio dans la réponse');
      }
    } else {
      throw new Error(response?.error || 'Échec de la capture');
    }
    
  } catch (error) {
    console.error('❌ Erreur capture extension DarkVolt:', error);
    return null;
  }
}

export function useAudioCapture() {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioSources, setAudioSources] = useState<string[]>([]);

  const captureAudio = useCallback(async (options: AudioCaptureOptions): Promise<MediaStream> => {
    if (!isMediaDevicesAvailable()) {
      const error = '🎛️ navigator.mediaDevices not available - HTTPS required';
      setError(error);
      setCapturing(false);
      throw new Error(error);
    }
    
    setError(null);
    setCapturing(true);
    
    try {
      const tracks: MediaStreamTrack[] = [];
      const sources: string[] = [];

      // 1. Capturer le micro si demandé
      if (options.includeMicrophone) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              autoGainControl: true,
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
              channelCount: 1
            },
            video: false
          });
          
          tracks.push(...micStream.getAudioTracks());
          sources.push('Microphone');
          console.log('🎤 Microphone captured successfully');
        } catch (micError) {
          console.warn('🎤 Microphone capture failed:', micError);
          throw new Error('Impossible d\'accéder au micro');
        }
      }

      // 2. DarkVolt Native Audio Engine - Approche révolutionnaire
      if (options.includeSystemAudio) {
        let systemAudioCaptured = false;
        let captureMethod = '';
        
        console.log('🚀 DarkVolt Native Audio Engine - Recherche audio DJ...');
        
        // Étape 1: Permissions et détection des périphériques
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } catch (permError) {
          console.warn('🎵 Permission audio refusée, tentative alternative...');
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        console.log('🔍 Périphériques audio natifs:', audioInputs.map(d => d.label));
        
        // Étape 2: DarkVolt Native Detection (Audio Interfaces prioritaires)
        const audioInterfaces = audioInputs.filter(device => {
          const label = device.label.toLowerCase();
          return label.includes('focusrite') || 
                 label.includes('scarlett') || 
                 label.includes('behringer') || 
                 label.includes('uca') || 
                 label.includes('umc') || 
                 label.includes('line') || 
                 label.includes('usb audio codec') ||
                 label.includes('audio interface') ||
                 label.includes('native') ||
                 label.includes('darkvolt');
        });
        
        // Étape 3: Virtual Audio Detection (si installé)
        const virtualDevices = audioInputs.filter(device => {
          const label = device.label.toLowerCase();
          return label.includes('voicemeeter') || 
                 label.includes('voice meeter') ||
                 label.includes('virtual') ||
                 label.includes('cable') ||
                 label.includes('vac');
        });
        
        // Étape 4: System Audio Detection (fallback)
        const systemDevices = audioInputs.filter(device => {
          const label = device.label.toLowerCase();
          return label.includes('stereo mix') || 
                 label.includes('what u hear') || 
                 label.includes('wave out') || 
                 label.includes('loopback') ||
                 label.includes('système') ||
                 label.includes('system');
        });
        
        console.log('🎯 DarkVolt Audio Detection:', {
          audioInterfaces: audioInterfaces.length,
          virtualDevices: virtualDevices.length,
          systemDevices: systemDevices.length,
          native: audioInterfaces.length > 0 ? '✅ NATIF' : '📦 EXTENSION REQUISE'
        });
        
        // Priorité 0: Native System Audio (getDisplayMedia) - 100% NAVIGATEUR
        if (!systemAudioCaptured) {
          try {
            console.log('🚀 Tentative capture audio système natif (getDisplayMedia)...');
            const nativeStream = await captureNativeSystemAudio();
            
            if (nativeStream) {
              tracks.push(...nativeStream.getAudioTracks());
              sources.push('🚀 Native System Audio (getDisplayMedia)');
              systemAudioCaptured = true;
              captureMethod = 'Native System Audio';
              console.log('✅ Native System Audio capturé - 100% NAVIGATEUR SANS EXTENSION');
            }
          } catch (nativeError) {
            console.warn('❌ Échec Native System Audio:', nativeError);
          }
        }
        
        // Priorité 1: DarkVolt Native Audio Interfaces
        if (audioInterfaces.length > 0 && !systemAudioCaptured) {
          try {
            const interfaceDevice = audioInterfaces[0];
            console.log('🚀 DarkVolt Native Audio Interface:', interfaceDevice.label);
            
            const interfaceStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: interfaceDevice.deviceId,
                autoGainControl: false,
                echoCancellation: false,
                noiseSuppression: false,
                sampleRate: 44100,
                channelCount: 2
              },
              video: false
            });
            
            tracks.push(...interfaceStream.getAudioTracks());
            sources.push(`🚀 DarkVolt Native (${interfaceDevice.label})`);
            systemAudioCaptured = true;
            captureMethod = 'DarkVolt Native';
            console.log('✅ DarkVolt Native Audio capturé - 100% NAVIGATEUR');
            
          } catch (interfaceError) {
            console.warn('❌ Échec Native Audio:', interfaceError);
          }
        }
        
        // Priorité 2: Virtual Audio (extension ou logiciel tiers)
        if (virtualDevices.length > 0 && !systemAudioCaptured) {
          try {
            const virtualDevice = virtualDevices[0];
            console.log('📦 Virtual Audio Device:', virtualDevice.label);
            
            const virtualStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: virtualDevice.deviceId,
                autoGainControl: false,
                echoCancellation: false,
                noiseSuppression: false,
                sampleRate: 44100,
                channelCount: 2
              },
              video: false
            });
            
            tracks.push(...virtualStream.getAudioTracks());
            sources.push(`📦 Virtual Audio (${virtualDevice.label})`);
            systemAudioCaptured = true;
            captureMethod = 'Virtual Audio';
            console.log('✅ Virtual Audio capturé - EXTENSION REQUISE');
            
          } catch (virtualError) {
            console.warn('❌ Échec Virtual Audio:', virtualError);
          }
        }
        
        // Priorité 3: System Audio (fallback)
        if (systemDevices.length > 0 && !systemAudioCaptured) {
          try {
            const systemDevice = systemDevices[0];
            console.log('🔧 System Audio Fallback:', systemDevice.label);
            
            const systemStream = await navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: systemDevice.deviceId,
                autoGainControl: false,
                echoCancellation: false,
                noiseSuppression: false,
                sampleRate: 44100,
                channelCount: 2
              },
              video: false
            });
            
            tracks.push(...systemStream.getAudioTracks());
            sources.push(`🔧 System Audio (${systemDevice.label})`);
            systemAudioCaptured = true;
            captureMethod = 'System Audio';
            console.log('✅ System Audio capturé - FALLBACK');
            
          } catch (systemError) {
            console.warn('❌ Échec System Audio:', systemError);
          }
        }
        
        // Étape 5: Détection Extension DarkVolt Audio
        const darkVoltExtensionAvailable = await checkDarkVoltExtension();
        
        if (darkVoltExtensionAvailable && !systemAudioCaptured) {
          try {
            console.log('🚀 DarkVolt Audio Extension détectée - Capture système...');
            
            // Utiliser l'extension pour capturer le son système
            const extensionStream = await captureWithDarkVoltExtension();
            
            if (extensionStream) {
              tracks.push(...extensionStream.getAudioTracks());
              sources.push('🚀 DarkVolt Extension (System Audio)');
              systemAudioCaptured = true;
              captureMethod = 'DarkVolt Extension';
              console.log('✅ DarkVolt Extension Audio capturé - SOLUTION PARFAITE');
            }
            
          } catch (extensionError) {
            console.warn('❌ Échec Extension DarkVolt:', extensionError);
          }
        }
        
        // Étape 6: Feedback DarkVolt Native
        if (systemAudioCaptured) {
          console.log(`🎵 DARKVOLT AUDIO SUCCESS: ${captureMethod}`);
          console.log('🚀 DarkVolt Native Audio Engine: Configuration optimisée');
          
          const qualityIndicators: Record<string, string> = {
            'DarkVolt Native': '🏆 NATIF 100% - Aucun logiciel requis',
            'DarkVolt Extension': '🚀 EXTENSION PRO - Son système parfait',
            'Virtual Audio': '📦 EXTENSION - Installation 1-click',
            'System Audio': '🔧 FALLBACK - Configuration système'
          };
          
          console.log('📊 Qualité DarkVolt:', qualityIndicators[captureMethod] || 'Qualité inconnue');
          
        } else {
          console.log('❌ DarkVolt Audio: Aucune source détectée');
          console.log('🚀 SOLUTIONS DARKVOLT:');
          
          if (darkVoltExtensionAvailable) {
            console.log('📦 1️⃣ Extension DarkVolt disponible - Activez-la!');
          } else {
            console.log('📦 1️⃣ Installez l\'extension DarkVolt Audio (Chrome/Firefox)');
            console.log('🔗 Lien: chrome.google.com/webstore/darkvolt-audio');
          }
          
          console.log('🎛️ 2️⃣ Connectez votre audio interface (Focusrite, Behringer)');
          console.log('🔧 3️⃣ Activez le son système dans votre OS');
          console.log('🌐 DarkVolt = ZÉRO installation obligatoire');
          
          if (options.includeMicrophone) {
            console.log('🎵 Fallback micro disponible - Voix uniquement');
            console.log('⚠️ Pour votre platine: Extension DarkVolt Audio requise');
          } else {
            throw new Error('🚀 DarkVolt Native Audio: Installez l\'extension pour votre platine DJ');
          }
        }
      }

      if (tracks.length === 0) {
        throw new Error('Aucune piste audio capturée');
      }

      setAudioSources(sources);
      const combinedStream = new MediaStream(tracks);
      
      console.log('🎵 Audio capture successful:', {
        tracks: tracks.length,
        sources,
        trackKinds: tracks.map(t => t.kind)
      });

      return combinedStream;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('🎵 Audio capture error:', err);
      throw err;
    } finally {
      setCapturing(false);
    }
  }, []);

  const stopAllTracks = useCallback((stream: MediaStream) => {
    stream.getTracks().forEach(track => {
      track.stop();
      console.log('🛑 Track stopped:', track.kind);
    });
  }, []);

  return {
    captureAudio,
    stopAllTracks,
    capturing,
    error,
    audioSources
  };
}
