/* ============================================================
   DARKVOLT — ARTIST PORTRAIT 3D GLB
   Portrait 3D dans la FeaturedCard.
   Optimisations identiques au LogoGLB :
     • Init différé 200ms
     • 30 FPS cap
     • IntersectionObserver + Visibility API
     • pixelRatio max 1 — antialias off
     • DRACOLoader
     • PNG fallback jusqu'au chargement 3D
   ============================================================ */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const FRAME_MS = 1000 / 30;
const INIT_MS  = 200;
const G = '#39FF14';

interface Props {
  glbPath:          string;
  logoPath?:        string;              /* optionnel — pas de plan logo si absent */
  hovered:          boolean;
  accent?:          string;
  mode?:            'featured' | 'card'; /* 'featured' = right-side portrait, 'card' = full area */
  yOffset?:         number;             /* décalage vertical additionnel du modèle */
  scaleMultiplier?: number;             /* multiplicateur de taille (1.0 = défaut) */
}

export default function ArtistPortraitGLB({
  glbPath,
  logoPath,
  hovered,
  accent = G,
  mode = 'featured',
  yOffset = 0,
  scaleMultiplier = 1.0,
}: Props) {
  const mountRef   = useRef<HTMLDivElement>(null);
  const hoveredRef = useRef(hovered);

  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let active   = true;
    let animId   = 0;
    const toDispose: (() => void)[] = [];

    const initTimer = setTimeout(() => {
      if (!active || !mount) return;

      const W = mount.clientWidth  || 300;
      const H = mount.clientHeight || 460;

      /* ── Renderer ── */
      const renderer = new THREE.WebGLRenderer({
        antialias: true,  /* contours nets */
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping         = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.6;
      renderer.domElement.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;filter:blur(0.6px) brightness(1.05);';
      mount.appendChild(renderer.domElement);

      /* ── Scene & Camera ── */
      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
      camera.position.set(0, 0.5, 6);

      /* ── Lights — ambient élevé = efface les creux, réduit l'âge apparent ── */
      scene.add(new THREE.AmbientLight(0xfff5e8, 7.0));

      /* Key — très douce, quasi frontale */
      const keyLight = new THREE.DirectionalLight(0xfff8f0, 0.8);
      keyLight.position.set(-0.5, 5, 9);
      scene.add(keyLight);

      /* Fill frontal — aplatit les détails */
      const frontFill = new THREE.DirectionalLight(0xffffff, 0.6);
      frontFill.position.set(0.5, 3, 9);
      scene.add(frontFill);

      /* Rim néon vert (accent DarkVolt) */
      const rimLight = new THREE.PointLight(0x39FF14, 8, 20);
      rimLight.position.set(4, 2, 2);
      scene.add(rimLight);

      /* Fill rouge subtil */
      const fillLight = new THREE.PointLight(0xFF1A1A, 3, 18);
      fillLight.position.set(-4, -1, 3);
      scene.add(fillLight);

      /* ── Logo plan dans la scène 3D (optionnel) ── */
      let logoPlaneMat: THREE.MeshBasicMaterial | null = null;
      if (logoPath) {
        const tex = new THREE.TextureLoader().load(logoPath);
        logoPlaneMat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          opacity: 0.20,
          depthWrite: false,
        });
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.8), logoPlaneMat);
        plane.position.set(0, 0.8, -1.5);
        plane.renderOrder = -1;
        scene.add(plane);
      }

      /* ── Load GLB ── */
      let model: THREE.Group | null = null;
      let targetScale = 1;
      let baseY       = 0;

      const draco = new DRACOLoader();
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
      const loader = new GLTFLoader();
      loader.setDRACOLoader(draco);

      loader.load(glbPath, (gltf) => {
        if (!active) return;
        model = gltf.scene;
        model.scale.setScalar(1);

        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        targetScale  = (4.0 / maxDim) * scaleMultiplier;

        model.position.copy(center).negate();
        /* Lever légèrement le modèle pour un cadrage portrait */
        model.position.y += size.y * 0.08 + yOffset;
        baseY  = model.position.y;
        model.scale.setScalar(0.001); /* départ tiny → spring reveal */

        /* Laisser les matériaux d'origine — ne pas forcer metalness sur la peau */
        scene.add(model);
      });

      /* ── Pause logic ── */
      let inView = true;
      const observer = new IntersectionObserver(
        (e) => { inView = e[0].isIntersecting; },
        { threshold: 0 },
      );
      observer.observe(mount);
      const onVis = () => { if (!document.hidden && active) loop(0); };
      document.addEventListener('visibilitychange', onVis);

      /* ── Resize ── */
      const onResize = () => {
        if (!renderer) return;
        const w = mount.clientWidth, h = mount.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);

      /* ── 30fps render loop ── */
      let t         = 0;
      let lastFrame = 0;

      const loop = (ts: number) => {
        if (!active) return;
        animId = requestAnimationFrame(loop);
        if (!inView || document.hidden) return;

        const delta = ts - lastFrame;
        if (delta < FRAME_MS) return;
        lastFrame = ts - (delta % FRAME_MS);
        t += 0.02;

        /* Orbiting rim light — léger tour */
        rimLight.position.set(
          Math.sin(t * 0.4) * 5 + 2,
          Math.cos(t * 0.3) * 2 + 2,
          3,
        );

        /* Logo plan opacity — lerp vers cible selon hover */
        if (logoPlaneMat) {
          const target = hoveredRef.current ? 0.32 : 0.18;
          logoPlaneMat.opacity += (target - logoPlaneMat.opacity) * 0.08;
        }

        if (model) {
          /* Spring reveal */
          const cur = model.scale.x;
          model.scale.setScalar(
            cur < targetScale - 0.001
              ? cur + (targetScale - cur) * 0.055
              : targetScale,
          );

          /* Idle sway subtil — montre la 3D sans rotation complète
             initRotY corrige l'orientation (de face par défaut)
             Y: ±3°  X: ±1.5°  float Y: très doux */
          const initRotY = Math.PI / -2;
          const idleY = Math.sin(t * 0.38) * 0.052;
          const idleX = Math.sin(t * 0.24) * 0.026;
          model.position.y = baseY + Math.sin(t * 0.21) * 0.05;
          model.rotation.y = initRotY + idleY;
          model.rotation.x = idleX;
        }

        renderer.render(scene, camera);
      };
      loop(0);

      /* ── Cleanup ── */
      toDispose.push(() => {
        cancelAnimationFrame(animId);
        observer.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      });

    }, INIT_MS);

    return () => {
      active = false;
      clearTimeout(initTimer);
      cancelAnimationFrame(animId);
      toDispose.forEach(fn => fn());
    };
  }, [glbPath]);

  const featuredStyle: React.CSSProperties = {
    position: 'absolute', right: 0, top: 0,
    height: '100%', width: '52%',
    maskImage:       'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.6) 25%, #000 60%)',
    WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.6) 25%, #000 60%)',
    pointerEvents: 'none',
  };
  const cardStyle: React.CSSProperties = {
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    pointerEvents: 'none',
  };

  return (
    <div
      ref={mountRef}
      style={mode === 'featured' ? featuredStyle : cardStyle}
    />
  );
}
