import { useState, useEffect, useCallback } from 'react';

const API = '/api';

function daysUntil(isoDate) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(isoDate); d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const GENRE_COLORS = {
  'Action': '#e05555', 'Action-Adventure': '#e07040', 'Adventure': '#55b8e0',
  'RPG': '#c090f0', 'Role-Playing Games (RPG)': '#c090f0',
  'Strategy': '#f5c518', 'Turn-Based Strategy': '#f5c518',
  'Simulation': '#3db86a', 'Sports': '#f0a030', 'Racing': '#f07030',
  'Puzzle': '#55e0d0', 'Horror': '#a03030', 'Casual': '#e878a0',
  'Indie': '#66c0f4', 'Free to Play': '#66c0f4', 'Massively Multiplayer': '#8060d0',
  'Early Access': '#f5a500', 'Violent': '#c03030', 'Gore': '#c03030',
  'Anime': '#e87890', 'Platformer': '#55d0a0',
};

function genreColor(genres) {
  if (!genres?.length) return '#66c0f4';
  for (const g of genres) {
    if (GENRE_COLORS[g]) return GENRE_COLORS[g];
  }
  return '#66c0f4';
}

const REVIEW_FR = { 'Overwhelmingly Positive': 'Vraiment positif', 'Very Positive': 'Très positif', 'Positive': 'Positif', 'Mostly Positive': 'Plutôt positif', 'Mixed': 'Mitigé', 'Mostly Negative': 'Plutôt négatif', 'Negative': 'Négatif', 'Very Negative': 'Très négatif', 'Overwhelmingly Negative': 'Extrêmement négatif' };

function ReviewBadge({ score, desc, total }) {
  if (!desc || !total) return null;
  const s = score ?? 0;
  const color = s >= 8 ? '#4cd882' : s >= 5 ? '#f5c518' : '#f87575';
  const fr = REVIEW_FR[desc] || desc;
  return (
    <span style={{ fontSize: 9, color, background: `${color}15`, border: `1px solid ${color}35`, borderRadius: 3, padding: '1px 5px', whiteSpace: 'nowrap', flexShrink: 0 }}>
      ★ {fr}
    </span>
  );
}

function DaysBadge({ days }) {
  let bg, color, label;
  if (days === 0) { bg = 'rgba(30,120,50,0.25)'; color = '#4cd882'; label = "Aujourd'hui !"; }
  else if (days <= 3) { bg = 'rgba(60,200,100,0.18)'; color = '#4cd882'; label = `Dans ${days}j`; }
  else if (days <= 7) { bg = 'rgba(180,140,10,0.2)'; color = '#f5c518'; label = `Dans ${days}j`; }
  else if (days <= 14) { bg = 'rgba(180,100,10,0.2)'; color = '#f0a030'; label = `Dans ${days}j`; }
  else { bg = 'rgba(100,100,100,0.18)'; color = 'var(--text-muted)'; label = `Dans ${days}j`; }
  return (
    <span style={{ background: bg, color, borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
      {label}
    </span>
  );
}

export default function UpcomingPanel({ token }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastFetch, setLastFetch] = useState(null);

  const h = { Authorization: `Bearer ${token}` };

  const fetchUpcoming = useCallback(async (force = false) => {
    setLoading(true); setError('');
    try {
      const url = force ? `${API}/steam/upcoming?force=1` : `${API}/steam/upcoming`;
      const res = await fetch(url, { headers: h });
      if (!res.ok) throw new Error('Erreur API');
      const data = await res.json();
      setGames(data);
      setLastFetch(new Date());
    } catch (e) {
      setError('Impossible de charger les sorties.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUpcoming(); }, [fetchUpcoming]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '18px 16px 10px', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Sorties à venir
            </span>
            {!loading && games.length > 0 && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 99, padding: '1px 6px' }}>
                {games.length}
              </span>
            )}
          </div>
          <button
            onClick={() => fetchUpcoming(true)}
            disabled={loading}
            title="Forcer le rechargement"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: loading ? 'default' : 'pointer', padding: 2, display: 'flex', alignItems: 'center', opacity: loading ? 0.4 : 0.7, transition: 'opacity .15s' }}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
        {lastFetch && !loading && (
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, opacity: 0.6 }}>
            Mis à jour {lastFetch.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 12px' }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', opacity: 0.3 + i * 0.05 }}>
                <div style={{ width: 54, height: 36, borderRadius: 5, background: 'var(--surface2)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 10, background: 'var(--surface2)', borderRadius: 3, marginBottom: 5, width: '75%' }} />
                  <div style={{ height: 8, background: 'var(--surface2)', borderRadius: 3, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>😞</div>
            {error}
            <br />
            <button onClick={fetchUpcoming} style={{ marginTop: 10, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', color: 'var(--text)', fontSize: 11, cursor: 'pointer' }}>
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && games.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎮</div>
            Aucune sortie majeure<br />dans les 45 prochains jours
          </div>
        )}

        {!loading && !error && games.map((game, idx) => {
          const days = daysUntil(game.releaseDate);
          const isToday = days === 0;
          const isVeryClose = days <= 3 && !isToday;

          const gc = genreColor(game.genres);
          const borderStyle = {
            border: '2px solid transparent',
            borderRadius: 10,
            background: `linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(135deg, ${gc}, ${gc}55) border-box`,
          };

          // Carte élargie pour les sorties du jour
          if (isToday) {
            return (
              <div key={game.appid} style={{ padding: '8px 10px', borderBottom: idx < games.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <a
                  href={`https://store.steampowered.com/app/${game.appid}/`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'block', textDecoration: 'none', overflow: 'hidden', ...borderStyle }}
                  onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(rgba(30,120,50,0.1), rgba(30,120,50,0.1)) padding-box, linear-gradient(135deg, ${gc}, ${gc}55) border-box`}
                  onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(135deg, ${gc}, ${gc}55) border-box`}
                >
                  {/* Bannière image */}
                  <div style={{ width: '100%', height: 90, overflow: 'hidden', position: 'relative', background: 'var(--surface2)' }}>
                    <img src={game.headerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} onError={e => { e.target.style.display = 'none'; }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
                    {/* Badge aujourd'hui */}
                    <div style={{ position: 'absolute', top: 7, right: 8 }}>
                      <DaysBadge days={0} />
                    </div>
                    {game.type === 'dlc' && (
                      <span style={{ position: 'absolute', top: 7, left: 8, fontSize: 8, fontWeight: 800, background: 'rgba(90,60,160,0.85)', color: '#d0b0ff', borderRadius: 3, padding: '2px 5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DLC</span>
                    )}
                    {/* Nom par-dessus l'image */}
                    <div style={{ position: 'absolute', bottom: 7, left: 10, right: 10, fontSize: 12, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {game.name}
                    </div>
                  </div>
                  {/* Détails */}
                  <div style={{ padding: '7px 12px 9px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                      {game.developers?.length > 0 && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          👤 {game.developers[0]}
                        </div>
                      )}
                      <ReviewBadge score={game.reviewScore} desc={game.reviewScoreDesc} total={game.reviewTotal} />
                    </div>
                    {game.genres?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5 }}>
                        {game.genres.map(g => (
                          <span key={g} style={{ fontSize: 9, background: `${gc}20`, border: `1px solid ${gc}50`, borderRadius: 3, padding: '1px 5px', color: gc }}>{g}</span>
                        ))}
                      </div>
                    )}
                    {game.shortDescription && (
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {game.shortDescription}
                      </div>
                    )}
                  </div>
                </a>
              </div>
            );
          }

          // Carte compacte pour les autres jours
          return (
            <div key={game.appid} style={{ padding: '5px 10px', borderBottom: idx < games.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <a
                href={`https://store.steampowered.com/app/${game.appid}/`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '6px 10px',
                  textDecoration: 'none',
                  transition: 'background .12s',
                  ...borderStyle,
                }}
                onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(var(--surface2), var(--surface2)) padding-box, linear-gradient(135deg, ${gc}, ${gc}55) border-box`}
                onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(135deg, ${gc}, ${gc}55) border-box`}
              >
                <div style={{ width: 56, height: 36, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: 'var(--surface2)' }}>
                  <img src={game.capsuleImage || game.headerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    {game.type === 'dlc' && (
                      <span style={{ fontSize: 8, fontWeight: 800, background: 'rgba(90,60,160,0.3)', color: '#b090f0', borderRadius: 3, padding: '1px 4px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>DLC</span>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {game.name}
                    </div>
                  </div>
                  {game.developers?.length > 0 && (
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2, opacity: 0.8 }}>
                      {game.developers[0]}
                    </div>
                  )}
                  {game.genres?.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 3 }}>
                      {game.genres.map(g => (
                        <span key={g} style={{ fontSize: 8, background: `${gc}20`, border: `1px solid ${gc}50`, borderRadius: 3, padding: '1px 4px', color: gc, whiteSpace: 'nowrap' }}>{g}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>📅 {formatDate(game.releaseDate)}</span>
                    <DaysBadge days={days} />
                    <ReviewBadge score={game.reviewScore} desc={game.reviewScoreDesc} total={game.reviewTotal} />
                  </div>
                </div>
              </a>
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
