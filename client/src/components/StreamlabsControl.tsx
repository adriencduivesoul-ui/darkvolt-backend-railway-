import React, { useState, useEffect } from 'react';
import { useStreamlabs, AudioSource, Scene } from '../hooks/useStreamlabs';
import { useAuth } from '../contexts/AuthContext';
import { useStreamApi } from '../hooks/useStreamApi';

interface StreamlabsControlProps {
  className?: string;
}

export function StreamlabsControl({ className = '' }: StreamlabsControlProps) {
  const { user } = useAuth();
  const { status, streamKey } = useStreamApi(user?.id);
  const {
    settings,
    loading,
    error,
    checkAvailability,
    connect,
    startStream,
    stopStream,
    setVolume,
    toggleMute,
    switchScene,
    disconnect
  } = useStreamlabs(user?.id || '');

  const [token, setToken] = useState('');
  const [selectedScene, setSelectedScene] = useState('');
  const [showSetup, setShowSetup] = useState(false);

  // Vérifier la disponibilité au montage
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Sélectionner la scène active par défaut
  useEffect(() => {
    const activeScene = settings.scenes.find(scene => scene.active);
    if (activeScene) {
      setSelectedScene(activeScene.name);
    }
  }, [settings.scenes]);

  const handleConnect = async () => {
    if (!token.trim()) {
      alert('Veuillez entrer le token Streamlabs');
      return;
    }

    const success = await connect(token.trim());
    if (success) {
      setShowSetup(false);
    }
  };

  const handleStartStream = async () => {
    if (!streamKey) {
      alert('Clé de stream non disponible');
      return;
    }

    const success = await startStream(streamKey, selectedScene);
    if (success) {
      console.log('🎥 Streamlabs: Stream started successfully');
    }
  };

  const handleStopStream = async () => {
    const success = await stopStream();
    if (success) {
      console.log('🎥 Streamlabs: Stream stopped successfully');
    }
  };

  const handleVolumeChange = async (sourceName: string, volume: number) => {
    await setVolume(sourceName, volume);
  };

  const handleMuteToggle = async (sourceName: string, muted: boolean) => {
    await toggleMute(sourceName, muted);
  };

  const handleSceneSwitch = async (sceneName: string) => {
    const success = await switchScene(sceneName);
    if (success) {
      setSelectedScene(sceneName);
    }
  };

  if (!settings.available) {
    return (
      <div className={`streamlabs-control ${className}`}>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-red-400 font-semibold">Streamlabs non détecté</h3>
              <p className="text-red-300 text-sm">
                Streamlabs Desktop n'est pas en cours d'exécution
              </p>
              <p className="text-red-300 text-xs mt-1">
                Veuillez installer et lancer Streamlabs Desktop
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings.connected) {
    return (
      <div className={`streamlabs-control ${className}`}>
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <div>
                <h3 className="text-yellow-400 font-semibold">Streamlabs disponible</h3>
                <p className="text-yellow-300 text-sm">
                  Connectez-vous pour contrôler votre stream
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              {showSetup ? 'Annuler' : 'Se connecter'}
            </button>
          </div>

          {showSetup && (
            <div className="mt-4 space-y-3">
              <div className="bg-black/30 rounded-lg p-3">
                <h4 className="text-yellow-300 font-semibold mb-2">Configuration requise :</h4>
                <ol className="text-yellow-200 text-sm space-y-1 list-decimal list-inside">
                  <li>Ouvrez Streamlabs Desktop</li>
                  <li>Allez dans Settings → Remote Control</li>
                  <li>Cliquez sur "Show details"</li>
                  <li>Copiez le token d'authentification</li>
                  <li>Collez-le ci-dessous</li>
                </ol>
              </div>
              
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="Token Streamlabs..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 border border-yellow-500/30 rounded-lg text-yellow-100 placeholder-yellow-400/50 focus:outline-none focus:border-yellow-500"
                />
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {loading ? 'Connexion...' : 'Se connecter à Streamlabs'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`streamlabs-control ${className}`}>
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-green-400 font-semibold">Streamlabs Connecté</h3>
              <p className="text-green-300 text-sm">
                Contrôle professionnel du stream
              </p>
            </div>
          </div>
          <button
            onClick={disconnect}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Déconnecter
          </button>
        </div>

        {/* Contrôles de stream */}
        <div className="space-y-4">
          {/* Sélection de scène */}
          {settings.scenes.length > 0 && (
            <div>
              <label className="block text-green-300 text-sm font-semibold mb-2">Scène active</label>
              <div className="grid grid-cols-2 gap-2">
                {settings.scenes.map(scene => (
                  <button
                    key={scene.id}
                    onClick={() => handleSceneSwitch(scene.name)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      selectedScene === scene.name
                        ? 'bg-green-600 text-white'
                        : 'bg-black/30 text-green-300 hover:bg-green-800/30'
                    }`}
                  >
                    {scene.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contrôles audio */}
          {settings.audioSources.length > 0 && (
            <div>
              <label className="block text-green-300 text-sm font-semibold mb-2">Sources audio</label>
              <div className="space-y-3">
                {settings.audioSources.map(source => (
                  <div key={source.id} className="bg-black/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-200 text-sm font-medium">
                        {source.name}
                      </span>
                      <button
                        onClick={() => handleMuteToggle(source.name, !source.muted)}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          source.muted
                            ? 'bg-red-600 text-white'
                            : 'bg-green-600 text-white'
                        }`}
                      >
                        {source.muted ? 'Muted' : 'Unmuted'}
                      </button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={source.volume}
                        onChange={(e) => handleVolumeChange(source.name, parseFloat(e.target.value))}
                        className="flex-1 h-2 bg-black/50 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #10b981 0%, #10b981 ${source.volume * 100}%, #374151 ${source.volume * 100}%, #374151 100%)`
                        }}
                      />
                      <span className="text-green-300 text-xs w-10 text-right">
                        {Math.round(source.volume * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boutons de stream */}
          <div className="flex space-x-3">
            <button
              onClick={handleStartStream}
              disabled={loading || status?.isLive}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
            >
              {loading ? 'Démarrage...' : status?.isLive ? 'Stream Actif' : 'Démarrer Stream'}
            </button>
            <button
              onClick={handleStopStream}
              disabled={loading || !status?.isLive}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-semibold"
            >
              {loading ? 'Arrêt...' : 'Arrêter Stream'}
            </button>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
