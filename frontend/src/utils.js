// ── Utilitaires partagés ──────────────────────────────────────────────────────
import { getLang } from './i18n.js';

/**
 * Formatte un temps de jeu en minutes vers "Xh Ym" ou "X min".
 * @param {number|null} minutes
 * @param {string} [fallback] - texte si jamais joué (défaut : null)
 */
export function formatPlaytime(minutes, fallback = null) {
  if (!minutes || minutes === 0) return fallback;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Formatage de dates — locale alignée sur la langue active de l'app ─────────
// (et non sur la langue du navigateur/OS, qui peut différer du choix de l'user)
const LOCALE_BY_LANG = {
  fr: 'fr-FR', en: 'en-US', es: 'es-ES', de: 'de-DE', ru: 'ru-RU', zh: 'zh-CN',
};

function _appLocale() {
  return LOCALE_BY_LANG[getLang()] || 'fr-FR';
}

/**
 * Formate une date (ISO string, timestamp ou Date) en date courte, sans année.
 * ex (fr): "3 janv." — ex (en): "Jan 3"
 */
export function formatDateShort(input) {
  if (!input) return '';
  try {
    const d = input instanceof Date ? input : new Date(input);
    return d.toLocaleDateString(_appLocale(), { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

/**
 * Formate une date (ISO string, timestamp ou Date) en date courte avec année.
 * ex (fr): "3 janv. 2026" — ex (en): "Jan 3, 2026"
 */
export function formatDateLong(input) {
  if (!input) return '';
  try {
    const d = input instanceof Date ? input : new Date(input);
    return d.toLocaleDateString(_appLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

/**
 * Formate une date (ISO string, timestamp ou Date) en date complète avec jour de semaine.
 * ex (fr): "ven. 3 janvier 2026"
 */
export function formatDateFull(input) {
  if (!input) return '';
  try {
    const d = input instanceof Date ? input : new Date(input);
    return d.toLocaleDateString(_appLocale(), { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return ''; }
}

// ── Résolution de l'image "Steam" de repli d'un board ─────────────────────────
// Repli : si un board n'a pas sa propre image et contient EXACTEMENT une carte
// Steam exploitable, on affiche l'image de cette carte (board réellement "lié"
// à un seul jeu). Si plusieurs jeux différents sont présents (board perso/
// backlog), on ne montre rien (emoji affiché à la place). Logique partagée par
// App.jsx (board perso, board public, board actif).

/** Cartes "Steam" exploitables pour une image de board : non supprimées, pas custom, avec header_img. */
export function findSteamCardsWithImage(games) {
  return (games || []).filter(g => !g.deletedAt && g.type !== 'custom' && g.header_img);
}

/** Renvoie la carte Steam unique d'une liste de jeux, ou null si zéro ou plusieurs. */
export function resolveSingleSteamCardImg(games) {
  const cards = findSteamCardsWithImage(games);
  return cards.length === 1 ? cards[0] : null;
}

/**
 * Nombre de jours entre aujourd'hui et une date ISO.
 * Négatif = dans le passé.
 */
export function daysUntil(isoDate) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(isoDate); d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

/**
 * En-têtes HTTP standard pour les requêtes authentifiées vers l'API.
 * Utilisé par tous les fetch() de l'app (App.jsx + composants).
 */
export function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}
