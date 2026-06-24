import { useState, useEffect } from 'react';

// ── Niveaux de zoom supportés ──────────────────────────────────────────────
// Réduit l'échelle globale de l'interface (comme le zoom de Teams/Discord)
// pour afficher plus de surface sur les écrans basse résolution.
export const ZOOM_STEPS = [80, 85, 90, 95, 100];
export const DEFAULT_ZOOM = 100;

// ── État global (module-level, même schéma que i18n.js) ───────────────────
let _zoom = DEFAULT_ZOOM;
let _userId = null;
const _subscribers = new Set();

function _clampZoom(value) {
  const n = Number(value);
  return ZOOM_STEPS.includes(n) ? n : DEFAULT_ZOOM;
}

function _applyZoom(value) {
  // CSS "zoom" sur <html> : redimensionne tout le rendu (texte, paddings,
  // icônes…) comme le zoom natif du navigateur, SANS toucher window.innerWidth
  // (donc aucun impact sur la détection mobile useMobile()) et SANS créer de
  // containing block pour les éléments position:fixed — contrairement à
  // transform: scale() qui casserait le footer et les modales fixed.
  // Compatible Chromium desktop + WebView Android (même moteur de rendu).
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.style.zoom = `${value}%`;
  }
}

/** Appelé au login / au chargement de l'auth sauvegardée (même schéma que initUserLang) */
export function initUserZoom(userId) {
  _userId = userId || null;
  try {
    const stored = localStorage.getItem(`zoom_${_userId || 'guest'}`);
    _zoom = stored ? _clampZoom(stored) : DEFAULT_ZOOM;
  } catch {
    _zoom = DEFAULT_ZOOM;
  }
  _applyZoom(_zoom);
  _subscribers.forEach(fn => fn(_zoom));
}

/** Changer le niveau de zoom (stocké par userId) */
export function setZoom(value) {
  const z = _clampZoom(value);
  _zoom = z;
  _applyZoom(z);
  try { localStorage.setItem(`zoom_${_userId || 'guest'}`, String(z)); } catch {}
  _subscribers.forEach(fn => fn(z));
}

export function getZoom() {
  return _zoom;
}

/** Hook React — s'abonne aux changements de zoom */
export function useZoom() {
  const [zoom, setZoomState] = useState(_zoom);
  useEffect(() => {
    const handler = z => setZoomState(z);
    _subscribers.add(handler);
    return () => _subscribers.delete(handler);
  }, []);
  return { zoom, setZoom };
}
