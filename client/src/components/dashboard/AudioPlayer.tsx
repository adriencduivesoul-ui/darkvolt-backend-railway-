import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStreamApi } from '../../hooks/useStreamApi';

interface AudioPlayerProps {
  compact?: boolean;
}

export default function AudioPlayer({ compact = false }: AudioPlayerProps) {
  const { t } = useTranslation();
  const { status } = useStreamApi();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  const createNoise = useCallback((ctx: AudioContext): AudioBufferSourceNode => {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.03;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    // Low-pass filter for "dark techno" feel
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 1.5;

    // Sub oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 55;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.08;
    osc.connect(oscGain);
    oscGain.connect(gainRef.current!);
    osc.start();

    src.connect(filter);
    filter.connect(gainRef.current!);
    return src;
  }, []);

  const startAudio = useCallback(async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    gainRef.current = ctx.createGain();
    gainRef.current.gain.value = volume / 100;
    gainRef.current.connect(ctx.destination);

    sourceRef.current = createNoise(ctx);
    sourceRef.current.start();
  }, [volume, createNoise]);

  const stopAudio = useCallback(() => {
    try {
      sourceRef.current?.stop();
      gainRef.current?.disconnect();
    } catch {}
    sourceRef.current = null;
  }, []);

  const toggle = useCallback(async () => {
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      await startAudio();
      setIsPlaying(true);
    }
  }, [isPlaying, startAudio, stopAudio]);

  // Volume change
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.setTargetAtTime(isMuted ? 0 : volume / 100, audioCtxRef.current!.currentTime, 0.05);
    }
  }, [volume, isMuted]);

  // Waveform animation
  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      const t = Date.now() * 0.001;
      const bars = compact ? 40 : 64;
      const bw = w / bars;
      for (let i = 0; i < bars; i++) {
        const n = isPlaying
          ? Math.abs(
              Math.sin(i * 0.35 + t * 3.2) * 0.45 +
              Math.sin(i * 0.12 + t * 5.7) * 0.3 +
              Math.sin(i * 0.07 + t * 1.8) * 0.25
            )
          : 0.04 + 0.05 * Math.abs(Math.sin(i * 0.2 + t * 0.4));
        const bh = h * 0.85 * n;
        const x = i * bw + bw * 0.12;
        const g = ctx.createLinearGradient(0, h / 2 - bh / 2, 0, h / 2 + bh / 2);
        g.addColorStop(0, 'rgba(255,26,26,0.6)');
        g.addColorStop(0.4, '#39FF14');
        g.addColorStop(0.6, '#39FF14');
        g.addColorStop(1, 'rgba(255,26,26,0.6)');
        ctx.fillStyle = g;
        ctx.fillRect(x, h / 2 - bh / 2, bw * 0.76, bh);
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, compact]);

  useEffect(() => {
    return () => { stopAudio(); cancelAnimationFrame(animRef.current); };
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Stream info */}
      <div className="flex items-center gap-3">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            background: status.isLive ? '#FF1A1A' : '#e8e8e822',
            boxShadow: status.isLive ? '0 0 8px #FF1A1A' : 'none',
            animation: status.isLive ? 'live-dot 1.5s ease-in-out infinite' : 'none',
          }}
        />
        <div className="min-w-0">
          <p className="font-orbitron font-bold truncate" style={{ color: '#e8e8e8', fontSize: compact ? '13px' : '16px', letterSpacing: '0.05em' }}>
            {status.isLive ? status.title || 'DARK FREQUENCY' : 'SIGNAL EN ATTENTE'}
          </p>
          {!compact && (
            <p className="font-space text-xs mt-0.5 truncate" style={{ color: '#39FF1466' }}>
              {status.isLive
                ? `${status.streamerName} — ${status.genre}`
                : 'Le stream reprend bientôt — reste connecté'}
            </p>
          )}
        </div>
        {status.isLive && (
          <div className="ml-auto shrink-0 px-3 py-1" style={{ background: 'rgba(255,26,26,0.1)', border: '1px solid rgba(255,26,26,0.3)' }}>
            <span className="font-orbitron font-bold" style={{ color: '#FF1A1A', fontSize: '10px', letterSpacing: '0.2em' }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Waveform */}
      <canvas
        ref={waveRef}
        style={{
          width: '100%',
          height: compact ? '48px' : '72px',
          display: 'block',
          opacity: isPlaying ? 1 : 0.4,
          transition: 'opacity 0.5s ease',
        }}
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="font-orbitron font-black tracking-[0.15em] uppercase transition-all duration-300"
          style={{
            background: isPlaying ? 'transparent' : '#39FF14',
            border: isPlaying ? '1px solid #39FF14' : 'none',
            color: isPlaying ? '#39FF14' : '#050505',
            boxShadow: isPlaying ? 'inset 0 0 12px rgba(57,255,20,0.1)' : '0 0 24px #39FF1455',
            padding: compact ? '8px 20px' : '10px 28px',
            fontSize: compact ? '11px' : '12px',
            minWidth: compact ? '90px' : '110px',
          }}
        >
          {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
        </button>

        {/* Mute */}
        <button
          onClick={() => setIsMuted(p => !p)}
          style={{
            background: 'none',
            border: '1px solid rgba(57,255,20,0.15)',
            color: isMuted ? '#FF1A1A' : '#39FF1466',
            padding: compact ? '7px 10px' : '9px 12px',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#39FF1444')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(57,255,20,0.15)')}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        {/* Volume slider */}
        <div className="flex items-center gap-2 flex-1">
          <input
            type="range" min="0" max="100" value={volume}
            onChange={e => { setVolume(Number(e.target.value)); setIsMuted(false); }}
            style={{ flex: 1, accentColor: '#39FF14', cursor: 'pointer', height: '3px' }}
          />
          {!compact && (
            <span className="font-orbitron text-xs shrink-0" style={{ color: '#39FF1455', minWidth: '32px' }}>{volume}%</span>
          )}
        </div>
      </div>

      {status.isLive && (
        <div className="flex items-center gap-4">
          <span className="font-mono-space text-xs" style={{ color: '#e8e8e822', letterSpacing: '0.15em' }}>
            👁 {status.viewers} {t('player.listeners')}
          </span>
        </div>
      )}
    </div>
  );
}
