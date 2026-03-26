/* ============================================================
   DARKVOLT — HERO WAVE EFFECT
   Three.js GLSL shader audio-réactif — palette DarkVolt
   Audio caché silencieux (GainNode=0) indépendant du LivePlayer.
   Auto-démarre sur page load. Aucun son dans le hero.
   Inspiré de shadertoy.com/view/MtVBzG
   ============================================================ */

import { useEffect, useRef } from 'react';
import {
  WebGLRenderer, Scene, OrthographicCamera,
  ShaderMaterial, PlaneGeometry, Mesh,
  Vector3,
} from 'three';
import { RADIO_CONFIG } from '@/config/radio';

// ── Vertex shader ────────────────────────────────────────────
const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// ── Fragment shader — 3 lignes audio-réactives ───────────────
const FRAG = `
precision highp float;

uniform float iTime;
uniform float lowFreq;
uniform float midFreq;
uniform float highFreq;
uniform float transitionFactor;
uniform float kickEnergy;
uniform float bounceEffect;
uniform float idleAnimation;

uniform vec3 color1In;
uniform vec3 color1Out;
uniform vec3 color2In;
uniform vec3 color2Out;
uniform vec3 color3In;
uniform vec3 color3Out;

varying vec2 vUv;

float sq(float v) { return v * v; }

float sStep(float e0, float e1, float x) {
  float t = clamp((x - e0) / max(e1 - e0, 0.0001), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec2 p = vUv;

  float tf = transitionFactor;

  float bassPulse = sq(lowFreq)  * 0.4 * tf;
  float midPulse  = sq(midFreq)  * 0.5 * tf;
  float highPulse = sq(highFreq) * 0.4 * tf;
  float kickPulse = sq(kickEnergy) * 0.9 * tf;
  float bounce    = bounceEffect * 0.15 * tf;

  // Always-on idle animation (visible even with no audio)
  float speed = mix(0.55, 1.0, tf);
  float idleW = 0.048 * sin(p.x * 4.2 + idleAnimation * 0.32);

  float curveI = mix(0.042, 0.05 + 0.08 * (bassPulse + kickPulse * 0.7), tf);
  float curve  = curveI * sin(6.25 * p.x + speed * iTime);

  float audioW = mix(0.0,
    (0.10 * sin(p.x * 20.0) * bassPulse +
     0.08 * sin(p.x * 30.0) * midPulse  +
     0.05 * sin(p.x * 50.0) * highPulse) / 2.53,
    tf);

  // ── LINE A — Bass / Kick — RED #FF1A1A ─────────────────────
  float laFreq  = 40.0 + 80.0 * bassPulse + 90.0 * kickPulse;
  float laSpeed = 1.5 * speed + 6.0 * (bassPulse + kickPulse);
  float laWave  = mix(idleW, (0.01 + 0.05 * bassPulse + 0.1 * kickPulse) / 2.53, tf);
  float laOff   = bassPulse * 0.3 * sin(p.x * 10.0 - iTime * 2.0)
                + kickEnergy * 0.21 * sin(15.0 * (p.x - iTime * 0.5)) * tf;
  float laY     = 0.5 + curve + audioW + laWave * sin(laFreq * p.x - laSpeed * iTime) + laOff - bounce;
  float laAnim  = mix(0.5 + idleW + curve * 0.6, laY, tf);
  float laDist  = distance(p.y, laAnim) * (2.0 / 0.75);
  float laShape = sStep(1.0 - clamp(laDist, 0.0, 1.0), 1.0, 0.99);
  vec3  laCol   = (1.0 - laShape) * mix(color1In, color1Out, laShape);

  // Glow halo for line A
  float laGDist  = distance(p.y, laAnim) * (2.0 / 2.5);
  float laGShape = sStep(1.0 - clamp(laGDist, 0.0, 1.0), 1.0, 0.99);
  vec3  laGlow   = (1.0 - laGShape) * color1In * 0.18;

  // ── LINE B — Mid — GREEN #39FF14 ────────────────────────────
  float lbFreq  = 50.0 + 100.0 * midPulse;
  float lbSpeed = 2.0 * speed + 8.0 * midPulse;
  float lbWave  = mix(idleW * 0.8, (0.01 + 0.05 * midPulse) / 2.53, tf);
  float lbOff   = midPulse * 0.2 * sin(p.x * 15.0 - iTime * 1.5)
                + kickEnergy * 0.07 * sin(p.x * 25.0 - iTime * 3.0) * tf;
  float lbY     = 0.5 + curve - audioW + lbWave * sin(lbFreq * p.x + lbSpeed * iTime) * sin(lbSpeed * iTime) + lbOff - bounce * 0.5;
  float lbAnim  = mix(0.5 + idleW * 0.75 - curve * 0.5, lbY, tf);
  float lbDist  = distance(p.y, lbAnim) * (2.0 / 0.75);
  float lbShape = sStep(1.0 - clamp(lbDist, 0.0, 1.0), 1.0, 0.99);
  vec3  lbCol   = (1.0 - lbShape) * mix(color2In, color2Out, lbShape);

  float lbGDist  = distance(p.y, lbAnim) * (2.0 / 2.5);
  float lbGShape = sStep(1.0 - clamp(lbGDist, 0.0, 1.0), 1.0, 0.99);
  vec3  lbGlow   = (1.0 - lbGShape) * color2In * 0.18;

  // ── LINE C — High — ORANGE #FF8C00 ──────────────────────────
  float lcFreq  = 60.0 + 120.0 * highPulse;
  float lcSpeed = 2.5 * speed + 10.0 * highPulse;
  float lcWave  = mix(idleW * 1.2, (0.01 + 0.05 * highPulse) / 2.53, tf);
  float lcOff   = highPulse * 0.15 * sin(p.x * 20.0 - iTime);
  float lcY     = 0.5 + curve * 0.7 - audioW * 0.5 + lcWave * sin(lcFreq * p.x + lcSpeed * iTime) * sin(lcSpeed * (iTime + 0.1)) + lcOff - bounce * 0.3;
  float lcAnim  = mix(0.5 + idleW * 1.3 + curve * 0.35, lcY, tf);
  float lcDist  = distance(p.y, lcAnim) * (2.0 / 0.75);
  float lcShape = sStep(1.0 - clamp(lcDist, 0.0, 1.0), 1.0, 0.99);
  vec3  lcCol   = (1.0 - lcShape) * mix(color3In, color3Out, lcShape);

  float lcGDist  = distance(p.y, lcAnim) * (2.0 / 2.5);
  float lcGShape = sStep(1.0 - clamp(lcGDist, 0.0, 1.0), 1.0, 0.99);
  vec3  lcGlow   = (1.0 - lcGShape) * color3In * 0.18;

  // ── Combine ──────────────────────────────────────────────────
  vec3  lines = laCol + lbCol + lcCol + laGlow + lbGlow + lcGlow;

  // Alpha: max coverage across all lines (core + glow)
  float coreAlpha = max(max(1.0 - laShape, 1.0 - lbShape), 1.0 - lcShape);
  float glowAlpha = max(max(1.0 - laGShape, 1.0 - lbGShape), 1.0 - lcGShape) * 0.18;
  float alpha     = clamp(coreAlpha + glowAlpha, 0.0, 0.96);

  gl_FragColor = vec4(lines, alpha);
}
`;

export default function HeroWaveEffect() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth || window.innerWidth;
    const H = mount.clientHeight || window.innerHeight;

    // ── Three.js setup ────────────────────────────────────────
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.pointerEvents = 'none';
    mount.appendChild(renderer.domElement);

    const scene  = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      iTime:            { value: 0 },
      lowFreq:          { value: 0 },
      midFreq:          { value: 0 },
      highFreq:         { value: 0 },
      transitionFactor: { value: 0 },
      kickEnergy:       { value: 0 },
      bounceEffect:     { value: 0 },
      idleAnimation:    { value: 0 },
      // DarkVolt palette
      color1In:  { value: new Vector3(1.0,  0.102, 0.102) },  // #FF1A1A
      color1Out: { value: new Vector3(0.72, 0.04,  0.04)  },
      color2In:  { value: new Vector3(0.22, 1.0,   0.08)  },  // #39FF14
      color2Out: { value: new Vector3(0.12, 0.70,  0.04)  },
      color3In:  { value: new Vector3(1.0,  0.549, 0.0)   },  // #FF8C00
      color3Out: { value: new Vector3(0.70, 0.31,  0.0)   },
    };

    const material = new ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      uniforms,
      transparent: true,
      depthTest:   false,
      depthWrite:  false,
    });

    const mesh = new Mesh(new PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // ── Hidden silent audio — drives animation, no sound output ──
    let heroAnalyser: AnalyserNode | null = null;
    let heroCtx: AudioContext | null = null;
    let audioSetup = false;
    let heroTrackIdx = 0;
    let heroTracks: Array<{ file: string }> = [];
    const hiddenAudio = new Audio();
    hiddenAudio.crossOrigin = 'anonymous';
    hiddenAudio.preload = 'none';

    const setupCtx = () => {
      if (audioSetup) return;
      audioSetup = true;
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      heroCtx = new AC();
      const analyser = heroCtx.createAnalyser();
      analyser.fftSize = 512;
      heroAnalyser = analyser;
      const source = heroCtx.createMediaElementSource(hiddenAudio);
      const gain = heroCtx.createGain();
      gain.gain.value = 0; // Completely silent — no sound output
      source.connect(analyser);
      source.connect(gain);
      gain.connect(heroCtx.destination);
    };

    const startPlayback = () => {
      if (!heroTracks.length) return;
      setupCtx();
      if (heroCtx?.state === 'suspended') heroCtx.resume().catch(() => {});
      if (hiddenAudio.paused) hiddenAudio.play().catch(() => {});
    };

    // Fetch playlist then try to autoplay
    fetch(RADIO_CONFIG.playlistUrl)
      .then(r => r.json())
      .then((tracks: Array<{ file: string }>) => {
        heroTracks = tracks;
        heroTrackIdx = Math.floor(Math.random() * tracks.length);
        const base = RADIO_CONFIG.audioBaseUrl.replace(/\/$/, '');
        const loadTrack = (idx: number) => {
          const t = heroTracks[idx];
          hiddenAudio.src = t.file.startsWith('http') ? t.file : `${base}/${t.file}`;
        };
        hiddenAudio.addEventListener('ended', () => {
          heroTrackIdx = (heroTrackIdx + 1) % heroTracks.length;
          loadTrack(heroTrackIdx);
          if (!hiddenAudio.paused || heroCtx) hiddenAudio.play().catch(() => {});
        });
        hiddenAudio.addEventListener('error', () => {
          heroTrackIdx = (heroTrackIdx + 1) % heroTracks.length;
          loadTrack(heroTrackIdx);
          if (heroCtx) hiddenAudio.play().catch(() => {});
        });
        loadTrack(heroTrackIdx);
        // Try autoplay immediately
        startPlayback();
        // Fallback: any user interaction
        const onInteract = () => { startPlayback(); };
        window.addEventListener('mousemove',  onInteract, { once: true, passive: true });
        window.addEventListener('keydown',    onInteract, { once: true });
        window.addEventListener('scroll',     onInteract, { once: true, capture: true, passive: true });
        window.addEventListener('touchstart', onInteract, { once: true, passive: true });
        window.addEventListener('click',      onInteract, { once: true });
      })
      .catch(() => {});

    // ── Audio analysis state ──────────────────────────────────
    let lowFreqVal = 0, midFreqVal = 0, highFreqVal = 0;
    let kickEnergyVal = 0;
    const kickDecay     = 0.80;
    const kickThreshold = 0.06;
    let kickHistory: number[] = [];
    let transitionFactor = 0;
    let time    = 0;
    let idleAnim = 0;
    let animId  = 0;
    let fftData: Uint8Array | null = null;

    const getWeightedAvg = (data: Uint8Array, start: number, end: number): number => {
      let sum = 0, maxV = 0;
      const len = Math.min(end, data.length) - start;
      if (len <= 0) return 0;
      for (let i = start; i < end && i < data.length; i++) {
        const v = data[i] / 255;
        sum  += Math.pow(v, 1.5);
        maxV  = Math.max(maxV, v);
      }
      return (sum / len) * 0.7 + maxV * 0.3;
    };

    // ── Animation loop ────────────────────────────────────────
    const animate = () => {
      animId = requestAnimationFrame(animate);
      time     += 0.01;
      idleAnim += 0.01;

      const analyser  = heroAnalyser;
      const isPlaying = !!heroAnalyser && !hiddenAudio.paused && heroCtx?.state === 'running';

      // Smooth transition factor
      if (isPlaying) transitionFactor = Math.min(transitionFactor + 0.025, 1.0);
      else           transitionFactor = Math.max(transitionFactor - 0.025, 0.0);

      // Frequency analysis
      if (analyser && isPlaying) {
        const binCount = analyser.frequencyBinCount;
        if (!fftData || fftData.length !== binCount) {
          fftData = new Uint8Array(binCount);
        }
        analyser.getByteFrequencyData(fftData as Uint8Array<ArrayBuffer>);

        const kick = getWeightedAvg(fftData, 4,  9);
        const bass = getWeightedAvg(fftData, 9,  20);
        const mid  = getWeightedAvg(fftData, 40, 80);
        const high = getWeightedAvg(fftData, 160, 300);

        // Kick detection via energy spike
        kickHistory.unshift(kick);
        if (kickHistory.length > 4) kickHistory.pop();
        const avgRecent = kickHistory.slice(1).reduce((a, b) => a + b, 0) / Math.max(kickHistory.length - 1, 1);
        if (kick - avgRecent > kickThreshold && kick > 0.15) {
          kickEnergyVal = Math.min(1.0, kick * 2.2);
        } else {
          kickEnergyVal *= kickDecay;
        }

        const combinedBass = (kick * 1.2 + bass) / 2.2;
        lowFreqVal  = combinedBass > lowFreqVal  * 1.1 ? lowFreqVal  * 0.3 + combinedBass * 0.7 : lowFreqVal  * 0.85 + combinedBass * 0.15;
        midFreqVal  = mid  > midFreqVal  * 1.1   ? midFreqVal  * 0.4 + mid  * 0.6          : midFreqVal  * 0.80 + mid  * 0.20;
        highFreqVal = high > highFreqVal * 1.05  ? highFreqVal * 0.5 + high * 0.5          : highFreqVal * 0.80 + high * 0.20;
        lowFreqVal  = Math.max(lowFreqVal, kickEnergyVal * 0.6);
      } else {
        lowFreqVal    *= 0.92;
        midFreqVal    *= 0.92;
        highFreqVal   *= 0.92;
        kickEnergyVal *= 0.88;
      }

      // Update uniforms
      uniforms.iTime.value            = time;
      uniforms.idleAnimation.value    = idleAnim;
      uniforms.lowFreq.value          = lowFreqVal;
      uniforms.midFreq.value          = midFreqVal;
      uniforms.highFreq.value         = highFreqVal;
      uniforms.kickEnergy.value       = kickEnergyVal;
      uniforms.bounceEffect.value     = kickEnergyVal * 0.025;
      uniforms.transitionFactor.value = transitionFactor;

      renderer.render(scene, camera);
    };

    animate();

    // ── Resize ────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      hiddenAudio.pause();
      hiddenAudio.src = '';
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 3,
      }}
    />
  );
}
