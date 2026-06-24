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
  //
  // Compensation : "zoom" rétrécit AUSSI la taille de la boîte <html>
  // elle-même (pas seulement son rendu visuel), donc en dessous de 100%
  // l'app ne remplit plus la fenêtre (zone vide à droite/en bas). On
  // agrandit html en amont (100/value %) pour qu'après application du
  // zoom, le rendu final occupe à nouveau exactement 100% de la fenêtre.
  if (typeof document !== 'undefined' && document.documentElement) {
    const html = document.documentElement;
    html.style.zoom = `${value}%`;
    if (value === 100) {
      html.style.width = '';
      html.style.height = '';
    } else {
      const compensate = `${(100 / value) * 100}%`;
      html.style.width = compensate;
      html.style.height = compensate;
    }
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
