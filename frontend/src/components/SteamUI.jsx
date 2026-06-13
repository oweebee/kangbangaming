// ── Composants et utilitaires Steam partagés ──────────────────────────────────

export const GENRE_COLORS = {
  'Action': '#e05555', 'Action-Adventure': '#e07040', 'Adventure': '#55b8e0',
  'RPG': '#c090f0', 'Role-Playing Games (RPG)': '#c090f0',
  'Strategy': '#f5c518', 'Turn-Based Strategy': '#f5c518',
  'Simulation': '#3db86a', 'Sports': '#f0a030', 'Racing': '#f07030',
  'Puzzle': '#55e0d0', 'Horror': '#a03030', 'Casual': '#e878a0',
  'Indie': '#66c0f4', 'Free to Play': '#66c0f4', 'Massively Multiplayer': '#8060d0',
  'Early Access': '#f5a500', 'Violent': '#c03030', 'Gore': '#c03030',
  'Anime': '#e87890', 'Platformer': '#55d0a0',
};

export function genreColor(genres) {
  if (!genres?.length) return '#66c0f4';
  for (const g of genres) {
    if (GENRE_COLORS[g]) return GENRE_COLORS[g];
  }
  return '#66c0f4';
}

// Catégories Steam → label FR court
const CAT_FR = {
  'Single-player': 'Solo', 'Multi-player': 'Multi', 'Co-op': 'Co-op',
  'Online Co-op': 'Co-op en ligne', 'Local Co-op': 'Co-op local',
  'PvP': 'PvP', 'Online PvP': 'PvP en ligne', 'Local PvP': 'PvP local',
  'Cross-Platform Multiplayer': 'Multi multi-plateforme',
  'Shared/Split Screen Co-op': 'Écran partagé', 'Shared/Split Screen PvP': 'Écran partagé',
  'MMO': 'MMO',
};
const CAT_PRIORITY = ['Single-player', 'Multi-player', 'Co-op', 'Online Co-op', 'Local Co-op', 'PvP', 'Online PvP', 'MMO'];

export function playerTags(categories) {
  if (!categories?.length) return [];
  return CAT_PRIORITY.filter(c => categories.includes(c)).map(c => CAT_FR[c]).slice(0, 3);
}

const REVIEW_FR = {
  'Overwhelmingly Positive': 'Vraiment positif', 'Very Positive': 'Très positif',
  'Positive': 'Positif', 'Mostly Positive': 'Plutôt positif', 'Mixed': 'Mitigé',
  'Mostly Negative': 'Plutôt négatif', 'Negative': 'Négatif',
  'Very Negative': 'Très négatif', 'Overwhelmingly Negative': 'Extrêmement négatif',
};

export function ReviewBadge({ score, desc, total }) {
  if (!desc || !total) return null;
  const s = score ?? 0;
  const color = s >= 8 ? '#4cd882' : s >= 5 ? '#f5c518' : '#f87575';
  const fr = REVIEW_FR[desc] || desc;
  return (
    <span style={{ fontSize: 10, color, background: `${color}15`, border: `1px solid ${color}35`, borderRadius: 3, padding: '1px 6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
      ★ {fr}
    </span>
  );
}

export function DaysBadge({ days }) {
  let bg, color, label;
  if (days === 0)       { bg = 'rgba(30,120,50,0.25)';  color = '#4cd882';         label = "Aujourd'hui !"; }
  else if (days <= 3)   { bg = 'rgba(60,200,100,0.18)'; color = '#4cd882';         label = `Dans ${days}j`; }
  else if (days <= 7)   { bg = 'rgba(180,140,10,0.2)';  color = '#f5c518';         label = `Dans ${days}j`; }
  else if (days <= 14)  { bg = 'rgba(180,100,10,0.2)';  color = '#f0a030';         label = `Dans ${days}j`; }
  else                  { bg = 'rgba(100,100,100,0.18)'; color = 'var(--text-muted)'; label = `Dans ${days}j`; }
  return (
    <span style={{ background: bg, color, borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
      {label}
    </span>
  );
}

export function WishlistDot() {
  return (
    <span title="Dans ta wishlist Steam" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#f5c518', background: 'rgba(245,197,24,0.18)', border: '1px solid rgba(245,197,24,0.5)', borderRadius: 5, padding: '3px 8px', whiteSpace: 'nowrap', animation: 'wishlistPulse 2s ease-in-out infinite', boxShadow: '0 0 8px rgba(245,197,24,0.3)' }}>
      <svg viewBox="0 0 24 24" width="11" height="11" fill="#f5c518" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      Wishlist
    </span>
  );
}
