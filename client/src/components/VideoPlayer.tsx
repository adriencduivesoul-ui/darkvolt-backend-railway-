import { useState, useRef, useEffect } from 'react';

const G = '#39FF14';
const R = '#FF1A1A';
const CLIP = (s = 14) => `polygon(0 0, calc(100% - ${s}px) 0, 100% ${s}px, 100% 100%, ${s}px 100%, 0 calc(100% - ${s}px))`;

interface VideoPlayerProps {
  stream: MediaStream;
  title?: string;
  viewerCount?: number;
  isLive?: boolean;
}

export default function VideoPlayer({ stream, title, viewerCount = 0, isLive = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Attacher le stream au vidéo
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Gérer les contrôles automatiques
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('touchstart', handleMouseMove);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('touchstart', handleMouseMove);
      }
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className="relative bg-black"
      style={{ aspectRatio: '16/9', clipPath: CLIP(10), overflow: 'hidden' }}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full object-contain"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Badges LIVE */}
      {isLive && (
        <div className="absolute top-3 left-3 flex items-center gap-2 px-2 py-1" style={{ background: 'rgba(255,26,26,0.85)', clipPath: CLIP(4) }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#fff', animation: 'live-dot 1s ease-in-out infinite' }} />
          <span className="font-orbitron text-[9px] tracking-[0.15em]" style={{ color: '#fff' }}>LIVE</span>
        </div>
      )}

      {/* Viewers */}
      {viewerCount > 0 && (
        <div className="absolute bottom-3 left-3 font-orbitron text-[9px] px-2 py-1" style={{ background: 'rgba(0,0,0,0.7)', color: `${G}88` }}>
          👁 {viewerCount}
        </div>
      )}

      {/* Contrôles vidéo */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Barre de progression */}
        <div className="mb-3">
          <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-100"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-mono text-xs" style={{ color: '#fff' }}>{formatTime(currentTime)}</span>
            <span className="font-mono text-xs" style={{ color: '#fff' }}>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button 
              onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', clipPath: CLIP(4) }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'}
            >
              <span style={{ fontSize: '16px', color: '#fff' }}>
                {isPlaying ? '⏸' : '▶'}
              </span>
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMute}
                className="w-8 h-8 flex items-center justify-center transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', clipPath: CLIP(3) }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'}
              >
                <span style={{ fontSize: '14px', color: '#fff' }}>
                  {isMuted || volume === 0 ? '🔇' : '🔊'}
                </span>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1"
                style={{ accentColor: G }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Titre */}
            {title && (
              <span className="font-orbitron text-xs" style={{ color: '#fff' }}>
                {title}
              </span>
            )}

            {/* Plein écran */}
            <button 
              onClick={toggleFullscreen}
              className="w-8 h-8 flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', clipPath: CLIP(3) }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)'}
            >
              <span style={{ fontSize: '14px', color: '#fff' }}>
                {isFullscreen ? '🗗' : '🗖'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay au clic central pour play/pause */}
      <button
        onClick={togglePlay}
        className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <div className="w-16 h-16 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', clipPath: CLIP(8) }}>
          <span style={{ fontSize: '24px', color: '#fff' }}>
            {isPlaying ? '⏸' : '▶'}
          </span>
        </div>
      </button>
    </div>
  );
}
