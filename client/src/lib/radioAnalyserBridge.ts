/* ============================================================
   DARKVOLT — Radio Analyser Bridge
   Module singleton partagé entre LivePlayer et HeroWaveEffect
   LivePlayer y connecte son AnalyserNode quand il joue.
   HeroWaveEffect lit les fréquences depuis ce bridge.
   ============================================================ */

export const radioAnalyserBridge = {
  analyser: null as AnalyserNode | null,
  isPlaying: false,
};
