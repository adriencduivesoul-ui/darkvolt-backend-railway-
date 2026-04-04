/* ============================================================
   DARKVOLT — LOGO 3D GLB VIEWER  (optimised)
   Optimisations:
     • Init différé 150ms (ne bloque pas le démarrage)
     • 30 FPS cap (rAF + timestamp throttle)
     • IntersectionObserver → pause hors écran
     • Page Visibility API → pause onglet caché
     • pixelRatio max 1.5 (moins de pixels GPU)
     • powerPreference: high-performance
     • 3 lumières au lieu de 4
     • Dispose complet à l'unmount
   ============================================================ */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const FRAME_INTERVAL = 1000 / 30; /* 30 fps */
const INIT_DELAY_MS  = 150;        /* laisser le DOM se stabiliser */

export default function LogoGLB() {
  const mountRef  = useRef<HTMLDivElement>(null);
  const [glbReady, setGlbReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let active   = true;
    let animId   = 0;
    const toDispose: (() => void)[] = [];

    /* ── defer heavy init ── */
    const initTimer = setTimeout(() => {
      if (!active || !mount) return;

      const W = mount.clientWidth  || 680;
      const H = mount.clientHeight || 300;

      /* ── Renderer ── */
      const renderer = new THREE.WebGLRenderer({
        antialias: false,          /* off = gros gain GPU */
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1)); /* max 1x */
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping    = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 2.0;
      renderer.domElement.style.display = 'block';
      mount.appendChild(renderer.domElement);

      /* ── Scene & Camera ── */
      const scene  = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
      camera.position.set(0, 0, 7);

      /* ── Lights (3 instead of 4) ── */
      scene.add(new THREE.AmbientLight(0x111111, 2));

      const gLight = new THREE.PointLight(0x39FF14, 18, 30);
      scene.add(gLight);

      const rLight = new THREE.PointLight(0xFF1A1A, 12, 25);
      scene.add(rLight);

      const topLight = new THREE.DirectionalLight(0xffffff, 1.6);
      topLight.position.set(0, 5, 8);
      scene.add(topLight);

      /* ── GLB load ── */
      let model: THREE.Group | null = null;
      let targetScale = 1;
      const initRotY  = Math.PI / -2;
      let baseY       = 0; /* neutral Y position after centering */

      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      loader.load('/darkvolt-logo-opt.glb', (gltf) => {
        if (!active) return;
        model = gltf.scene;

        model.scale.setScalar(1);
        const box    = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        targetScale  = 7.5 / Math.max(size.x, size.y, size.z);

        model.position.copy(center).negate();
        baseY = model.position.y;
        model.scale.setScalar(0.001);

        model.traverse((child) => {
          if (!(child as THREE.Mesh).isMesh) return;
          const mats = Array.isArray((child as THREE.Mesh).material)
            ? (child as THREE.Mesh).material as THREE.Material[]
            : [(child as THREE.Mesh).material as THREE.Material];
          mats.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.metalness = Math.max(mat.metalness, 0.75);
              mat.roughness = Math.min(mat.roughness, 0.2);
            }
          });
        });

        scene.add(model);
        setGlbReady(true); /* fade out PNG overlay */
      });

      /* ── Click+drag ── */
      let isDragging = false;
      let lastX = 0, lastY = 0;
      let rotY  = 0,  rotX  = 0;

      const onMouseDown = (e: MouseEvent) => {
        isDragging = true;
        renderer.domElement.style.cursor = 'grabbing';
        lastX = e.clientX; lastY = e.clientY;
      };
      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        rotY += (e.clientX - lastX) * 0.008;
        rotX += (e.clientY - lastY) * 0.008;
        rotX  = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, rotX));
        lastX = e.clientX; lastY = e.clientY;
      };
      const onMouseUp = () => {
        isDragging = false;
        renderer.domElement.style.cursor = 'grab';
      };

      renderer.domElement.addEventListener('mouseenter', () => { renderer.domElement.style.cursor = 'none'; });
      renderer.domElement.addEventListener('mouseleave', () => { renderer.domElement.style.cursor = 'grab'; isDragging = false; });
      renderer.domElement.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup',   onMouseUp);

      /* ── Resize ── */
      const onResize = () => {
        const w = mount.clientWidth, h = mount.clientHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);

      /* ── Pause when tab hidden ── */
      const onVisibility = () => { if (!document.hidden && active) loop(0); };
      document.addEventListener('visibilitychange', onVisibility);

      /* ── Pause when off-screen ── */
      let inView = true;
      const observer = new IntersectionObserver(
        (entries) => { inView = entries[0].isIntersecting; },
        { threshold: 0 },
      );
      observer.observe(mount);

      /* ── 30fps render loop ── */
      let t         = 0;
      let lastFrame = 0;

      const loop = (timestamp: number) => {
        if (!active) return;
        animId = requestAnimationFrame(loop);

        if (!inView || document.hidden) return;

        const delta = timestamp - lastFrame;
        if (delta < FRAME_INTERVAL) return;
        lastFrame = timestamp - (delta % FRAME_INTERVAL);
        t += 0.02;

        /* orbiting lights */
        gLight.position.set(
          Math.sin(t * 0.75) * 5.5,
          Math.cos(t * 0.50) * 3.5,
          Math.abs(Math.cos(t * 0.40)) * 4 + 1.5,
        );
        rLight.position.set(
          Math.cos(t * 0.65 + Math.PI) * 5.5,
          Math.sin(t * 0.45 + 1.20) * 3.5,
          Math.abs(Math.sin(t * 0.55)) * 4 + 1.5,
        );

        if (model) {
          /* reveal scale spring */
          const cur = model.scale.x;
          model.scale.setScalar(
            cur < targetScale - 0.001
              ? cur + (targetScale - cur) * 0.055
              : targetScale,
          );

          /* ── Idle Lissajous animation (golden-ratio freqs) ──
             Y: ±6.3°  period ~21s
             X: ±3.5°  period ~34s
             Path: organic figure-8 that reveals depth without full rotation */
          const idleY = Math.sin(t * 0.50) * 0.11;
          const idleX = Math.sin(t * 0.31) * 0.062;

          /* Gentle float up/down (separate freq to avoid sync) */
          model.position.y = baseY + Math.sin(t * 0.27) * 0.10;

          /* Drag offset decays to 0 when released → smooth return to idle */
          if (!isDragging) {
            rotY *= 0.965;
            rotX *= 0.965;
          }

          model.rotation.y = initRotY + idleY + rotY;
          model.rotation.x = idleX  + rotX;
        }

        renderer.render(scene, camera);
      };
      loop(0);

      /* ── Cleanup callback ── */
      toDispose.push(() => {
        cancelAnimationFrame(animId);
        observer.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup',   onMouseUp);
        window.removeEventListener('resize',    onResize);
        renderer.dispose();
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      });

    }, INIT_DELAY_MS);

    return () => {
      active = false;
      clearTimeout(initTimer);
      cancelAnimationFrame(animId);
      toDispose.forEach(fn => fn());
    };
  }, []);

  return (
    <div
      style={{ position: 'relative', width: 'min(760px, 92vw)', height: 'min(380px, 52vw)', minHeight: '240px' }}
    >
      {/* PNG logo — visible instantanément, disparaît quand 3D prêt */}
      <img
        src="/img/DarkVolt.png"
        alt="DarkVolt"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 40px #39FF14aa) drop-shadow(0 0 80px #FF1A1A44)',
          opacity: glbReady ? 0 : 1,
          transition: 'opacity 1.2s ease',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      {/* Canvas 3D — monte en zIndex quand prêt */}
      <div
        ref={mountRef}
        style={{
          width: '100%', height: '100%',
          cursor: 'grab',
          opacity: glbReady ? 1 : 0,
          transition: 'opacity 1.2s ease',
          zIndex: 1,
        }}
      />
    </div>
  );
}
