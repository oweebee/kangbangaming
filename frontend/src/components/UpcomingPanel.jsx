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

  const fetchUpcoming = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/steam/upcoming`, { headers: h });
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
            onClick={fetchUpcoming}
            disabled={loading}
            title="Actualiser"
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
          const isVeryClose = days <= 3;
          return (
            <a
              key={game.appid}
              href={`https://store.steampowered.com/app/${game.appid}/`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '7px 12px',
                textDecoration: 'none',
                borderBottom: idx < games.length - 1 ? '1px solid var(--border)' : 'none',
                background: isToday ? 'rgba(30,120,50,0.08)' : isVeryClose ? 'rgba(61,184,106,0.04)' : 'transparent',
                transition: 'background .12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = isToday ? 'rgba(30,120,50,0.15)' : 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = isToday ? 'rgba(30,120,50,0.08)' : isVeryClose ? 'rgba(61,184,106,0.04)' : 'transparent'}
            >
              {/* Capsule image */}
              <div style={{ width: 56, height: 36, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: 'var(--surface2)' }}>
                <img
                  src={game.capsuleImage || game.headerImage}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                  {game.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    📅 {formatDate(game.releaseDate)}
                  </span>
                  <DaysBadge days={days} />
                </div>
              </div>

              {/* Prix si dispo */}
              {game.price && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, textAlign: 'right' }}>
                  {game.price === '0.00' ? 'Gratuit' : `${game.price}€`}
                </div>
              )}
            </a>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
