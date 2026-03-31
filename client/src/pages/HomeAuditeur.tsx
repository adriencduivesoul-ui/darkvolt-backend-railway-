import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useStreamApi } from '../hooks/useStreamApi';
import { useStreamerProfile } from '../hooks/useStreamerProfile';
import { useAuth } from '../contexts/AuthContext';
import LiveStreamPage from './LiveStream';

// FORCER L'INCLUSION DU HOOK DANS LE BUILD
console.log('🔧 Hook useStreamApi chargé:', typeof useStreamApi);

const G = '#39FF14';
const R = '#FF1A1A';
const CLIP = (s = 14) => `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;

interface StreamerLive {
  id: string;
  username: string;
  title: string;
  genre: string;
  viewers: number;
  avatar?: string;
  isLive: boolean;
}

interface HomeAuditeurProps {
  onStreamerSelect?: (streamer: StreamerLive) => void;
}

export default function HomeAuditeur({ onStreamerSelect }: HomeAuditeurProps = {}) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { status } = useStreamApi();
  const { profile } = useStreamerProfile();
  const [joiningStreamer, setJoiningStreamer] = useState<string | null>(null);

  // Utiliser les vraies données de streamers
  const [streamers, setStreamers] = useState<StreamerLive[]>([]);
  const [allGenres, setAllGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('TOUS');

  // Afficher uniquement le streamer live actuel (s'il y en a un)
  useEffect(() => {
    console.log('🔍 HomeAuditeur: useEffect appelé');
    console.log('🔍 Status actuel:', status);
    
    const liveStreamers: StreamerLive[] = [];
    
    // Ajouter le streamer actuel seulement s'il est vraiment live
    if (status.isLive && status.streamerName) {
      console.log('✅ Streamer live détecté:', status.streamerName);
      liveStreamers.push({
        id: 'current-live',
        username: status.streamerName,
        title: status.title || 'Live Stream',
        genre: status.genre || profile?.genres?.[0] || 'Live',
        viewers: status.viewers,
        avatar: profile?.avatar,
        isLive: true
      });
    } else {
      console.log('❌ Aucun streamer live détecté');
      console.log('🔍 status.isLive:', status.isLive);
      console.log('🔍 status.streamerName:', status.streamerName);
    }
    
    console.log('🔍 Streamers live à afficher:', liveStreamers);
    setStreamers(liveStreamers);
    
    // Extraire les genres uniques pour les filtres
    const genres = new Set<string>();
    liveStreamers.forEach(streamer => {
      if (streamer.genre) {
        // Diviser les genres multiples par virgule
        const genreList = streamer.genre.split(',').map(g => g.trim()).filter(g => g);
        genreList.forEach(g => genres.add(g));
      }
    });
    setAllGenres(['TOUS', ...Array.from(genres)]);
  }, [status, profile]);

  return (
    <div className="p-6" style={{ color: '#e8e8e8' }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="font-orbitron text-4xl font-black mb-4" style={{ color: G }}>
            DARKVOLT LIVE
          </h1>
          <p className="font-space text-lg" style={{ color: '#e8e8e866' }}>
            Découvrez les meilleurs streamers DJ en direct
          </p>
        </div>

        {/* Stats en direct */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 text-center" style={{ background: `${G}03`, border: `1px solid ${G}12`, clipPath: CLIP(8) }}>
            <div className="font-orbitron text-2xl font-black" style={{ color: G }}>
              {status.isLive ? '1' : '0'}
            </div>
            <div className="font-space text-xs" style={{ color: '#e8e8e866' }}>STREAMER LIVE</div>
          </div>
          <div className="p-4 text-center" style={{ background: `${R}03`, border: `1px solid ${R}12`, clipPath: CLIP(8) }}>
            <div className="font-orbitron text-2xl font-black" style={{ color: R }}>
              {status.viewers}
            </div>
            <div className="font-space text-xs" style={{ color: '#e8e8e866' }}>AUDITEURS CONNECTÉS</div>
          </div>
          <div className="p-4 text-center" style={{ background: '#0a0a0a', border: `1px solid ${G}12`, clipPath: CLIP(8) }}>
            <div className="font-orbitron text-2xl font-black" style={{ color: G }}>
              {status.isLive ? '🔴 LIVE' : '⚫ OFF'}
            </div>
            <div className="font-space text-xs" style={{ color: '#e8e8e866' }}>STATUS</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2 flex-wrap">
            {allGenres.map(genre => (
              <button 
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className="px-4 py-2 font-orbitron text-xs"
                style={{ 
                  background: selectedGenre === genre ? G : 'transparent', 
                  color: selectedGenre === genre ? '#050505' : `${G}66`, 
                  border: `1px solid ${G}22`, 
                  clipPath: CLIP(6) 
                }}
              >
                {genre}
              </button>
            ))}
          </div>
          <div className="font-orbitron text-xs" style={{ color: `${G}66` }}>
            {status.isLive ? '1 STREAMER EN DIRECT' : 'AUCUN STREAMER EN DIRECT'}
          </div>
        </div>

        {/* Liste des streamers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streamers
            .filter(streamer => {
              // TOUJOURS afficher le streamer live, peu importe le genre sélectionné
              if (streamer.isLive) return true;
              
              if (selectedGenre === 'TOUS') return true;
              // Filtrer par genre (supporte les genres multiples)
              const streamerGenres = streamer.genre ? streamer.genre.split(',').map(g => g.trim()) : [];
              return streamerGenres.includes(selectedGenre);
            })
            .map(streamer => (
            <div
              key={streamer.id}
              onClick={() => {
                setJoiningStreamer(streamer.id);
                onStreamerSelect?.(streamer);
                setTimeout(() => setJoiningStreamer(null), 2000);
              }}
              className={`group cursor-pointer transition-all duration-300 ${joiningStreamer === streamer.id ? 'opacity-50 pointer-events-none' : ''}`}
              style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: `1px solid ${G}08`,
                clipPath: CLIP(10),
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `${G}33`;
                (e.currentTarget as HTMLDivElement).style.background = `${G}04`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = `${G}08`;
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              {/* Preview vidéo (placeholder) */}
              <div className="relative" style={{ aspectRatio: '16/9', background: '#000' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span style={{ fontSize: '3rem', opacity: 0.3 }}>🎵</span>
                </div>
                
                {/* Badge LIVE */}
                <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1" style={{ background: 'rgba(255,26,26,0.85)', clipPath: CLIP(4) }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#fff', animation: 'live-dot 1s ease-in-out infinite' }} />
                  <span className="font-orbitron text-[9px] tracking-[0.15em]" style={{ color: '#fff' }}>LIVE</span>
                </div>
                
                {/* Viewers */}
                <div className="absolute bottom-3 right-3 font-orbitron text-[9px] px-2 py-1" style={{ background: 'rgba(0,0,0,0.7)', color: `${G}88` }}>
                  👁 {streamer.viewers}
                </div>
                
                {/* Genre */}
                <div className="absolute top-3 right-3 font-orbitron text-[9px] px-2 py-1" style={{ background: `${G}12`, color: G, clipPath: CLIP(4) }}>
                  {streamer.genre}
                </div>
              </div>
              
              {/* Infos streamer */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 flex items-center justify-center" style={{ background: `${G}08`, border: `1px solid ${G}22`, clipPath: CLIP(6) }}>
                    <span style={{ fontSize: '1.5rem' }}>🎧</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-orbitron font-bold text-sm" style={{ color: '#e8e8e8' }}>
                      {streamer.username}
                    </h3>
                    <p className="font-space text-xs" style={{ color: '#e8e8e866' }}>
                      DJ Streamer
                    </p>
                  </div>
                </div>
                
                {/* Titre du stream */}
                <h4 className="font-orbitron font-bold text-sm mb-2" style={{ color: G }}>
                  {streamer.title}
                </h4>
                
                {/* Bouton rejoindre */}
                <button 
                  className="w-full font-orbitron text-xs tracking-[0.2em] uppercase py-3 transition-all duration-200"
                  style={{ 
                    background: joiningStreamer === streamer.id ? `${G}12` : 'transparent', 
                    border: `1px solid ${G}33`, 
                    color: joiningStreamer === streamer.id ? '#050505' : G, 
                    cursor: joiningStreamer === streamer.id ? 'default' : 'pointer',
                    clipPath: CLIP(6)
                  }}
                  onMouseEnter={e => {
                    if (joiningStreamer !== streamer.id) {
                      (e.currentTarget as HTMLButtonElement).style.background = G;
                      (e.currentTarget as HTMLButtonElement).style.color = '#050505';
                    }
                  }}
                  onMouseLeave={e => {
                    if (joiningStreamer !== streamer.id) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color = G;
                    }
                  }}
                >
                  {joiningStreamer === streamer.id ? 'CONNEXION...' : 'REJOINDRE LE LIVE →'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Section "Pas de streamers" */}
        {streamers.filter(streamer => {
          if (selectedGenre === 'TOUS') return true;
          const streamerGenres = streamer.genre ? streamer.genre.split(',').map(g => g.trim()) : [];
          return streamerGenres.includes(selectedGenre);
        }).length === 0 && (
          <div className="text-center py-16">
            <span style={{ fontSize: '4rem', opacity: 0.3 }}>🎭</span>
            <h3 className="font-orbitron text-xl font-bold mb-4" style={{ color: '#e8e8e866' }}>
              {!status.isLive 
                ? 'Aucun streamer live pour le moment' 
                : `Aucun streamer ${selectedGenre.toLowerCase()} en direct`
              }
            </h3>
            <p className="font-space text-sm" style={{ color: '#e8e8e833' }}>
              {!status.isLive 
                ? 'Revenez plus tard ou devenez streamer vous-même !'
                : `Essayez un autre genre ou revenez plus tard !`
              }
            </p>
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes live-dot {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `
      }} />
    </div>
  );
}
