// ── Utilitaires partagés ──────────────────────────────────────────────────────

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

/**
 * Formate une date ISO en date locale française courte.
 * ex: "3 janv."
 */
export function formatDateShort(isoStr) {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch { return ''; }
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
