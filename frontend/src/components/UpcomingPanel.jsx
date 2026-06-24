import { useState, useEffect, useCallback, useRef } from 'react';
import { useLang } from '../i18n.js';
import { genreColor, playerTags, ReviewBadge, DaysBadge, WishlistDot } from './SteamUI.jsx';
import { daysUntil, formatDateShort, authHeaders } from '../utils.js';

const API = '/api';

function formatDate(isoDate) {
  return formatDateShort(isoDate);
}

function FeaturedCard({ token, wishlist = new Set() }) {
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  const h = authHeaders(token);

  useEffect(() => {
    fetch(`${API}/steam/featured`, { headers: h })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data) && data.length) setItems(data); })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (items.length < 2) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % items.length), 5000);
    return () => clearInterval(timerRef.current);
  }, [items.length]);

  if (!items.length) return null;
  const game = items[idx];
  const gc = genreColor(game.genres);

  return (
    <div style={{ padding: '0 10px 0' }}>
      <a
        href={`https://store.steampowered.com/app/${game.appid}/`}
        target="_blank" rel="noreferrer"
        style={{
          display: 'block', textDecoration: 'none', overflow: 'hidden', borderRadius: 10,
          border: '2px solid transparent',
          background: `linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(135deg, ${gc}, ${gc}55) border-box`,
          transition: 'background .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = `linear-gradient(var(--surface2), var(--surface2)) padding-box, linear-gradient(135deg, ${gc}, ${gc}55) border-box`}
        onMouseLeave={e => e.currentTarget.style.background = `linear-gradient(var(--surface), var(--surface)) padding-box, linear-gradient(135deg, ${gc}, ${gc}55) border-box`}
      >
        {/* Image bannière */}
        <div style={{ width: '100%', height: 124, overflow: 'hidden', position: 'relative', background: 'var(--surface2)' }}>
          <img src={game.headerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.75) 100%)' }} />
          {/* Dots navigation */}
          {items.length > 1 && (
            <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4 }}>
              {items.map((_, i) => (
                <div key={i} onClick={e => { e.preventDefault(); e.stopPropagation(); clearInterval(timerRef.current); setIdx(i); }}
                  style={{ width: i === idx ? 14 : 5, height: 5, borderRadius: 3, background: i === idx ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all .2s' }} />
              ))}
            </div>
          )}
          {wishlist.has(Number(game.appid)) && (
            <div style={{ position: 'absolute', top: 8, left: 8 }}><WishlistDot /></div>
          )}
          {/* Nom */}
          <div style={{ position: 'absolute', bottom: 9, left: 10, right: 50, fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {game.name}
          </div>
        </div>
        {/* Détails — hauteur fixe pour que la carte ne change pas de taille selon le jeu */}
        <div style={{ padding: '7px 11px 9px', height: 97, boxSizing: 'border-box', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
            {game.developers?.length > 0 && (
              <div style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                👤 {game.developers[0]}
              </div>
            )}
            <ReviewBadge score={game.reviewScore} desc={game.reviewScoreDesc} total={game.reviewTotal} />
          </div>
          {(game.genres?.length > 0 || playerTags(game.categories).length > 0) && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap', overflow: 'hidden', marginBottom: 4 }}>
              {game.genres?.slice(0, 2).map(g => (
                <span key={g} style={{ fontSize: 10, background: `${gc}20`, border: `1px solid ${gc}50`, borderRadius: 3, padding: '2px 6px', color: gc, whiteSpace: 'nowrap', flexShrink: 0 }}>{g}</span>
              ))}
              {playerTags(game.categories).slice(0, 2).map(t => (
                <span key={t} style={{ fontSize: 10, background: 'rgba(102,192,244,0.12)', border: '1px solid rgba(102,192,244,0.35)', borderRadius: 3, padding: '2px 6px', color: '#66c0f4', whiteSpace: 'nowrap', flexShrink: 0 }}>{t}</span>
              ))}
            </div>
          )}
          {game.shortDescription && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {game.shortDescription}
            </div>
          )}
        </div>
      </a>
    </div>
  );
}


export default function UpcomingPanel({ token }) {
  const { t } = useLang();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastFetch, setLastFetch] = useState(null);
  const [wishlist, setWishlist] = useState(new Set());

  const h = authHeaders(token);

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
      setError(t('upcoming.load_error'));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchUpcoming(); }, [fetchUpcoming]);

  useEffect(() => {
    fetch(`${API}/steam/wishlist`, { headers: h })
      .then(r => r.json())
      .then(ids => { if (Array.isArray(ids)) setWishlist(new Set(ids)); })
      .catch(() => {});
  }, [token]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Section : Populaires & Recommandés */}
      <div style={{ padding: '14px 14px 8px', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          {t('upcoming.popular')}
        </div>
      </div>

      {/* Featured */}
      <FeaturedCard token={token} wishlist={wishlist} />

      {/* Section : Sorties à venir */}
      <div style={{ padding: '14px 14px 8px', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {t('upcoming.releases')}
          {!loading && games.length > 0 && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 99, padding: '1px 6px', fontWeight: 600 }}>
              {games.length}
            </span>
          )}
          <button
            onClick={() => fetchUpcoming(true)}
            disabled={loading}
            title={t('upcoming.force_reload')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: loading ? 'default' : 'pointer', padding: 0, display: 'flex', alignItems: 'center', opacity: loading ? 0.4 : 0.6, marginLeft: 'auto' }}
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
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
              {t('upcoming.retry')}
            </button>
          </div>
        )}

        {!loading && !error && games.length === 0 && (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎮</div>
            {t('upcoming.empty').split('\n').map((line, i) => <span key={i}>{line}{i === 0 && <br />}</span>)}
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
              <div key={game.appid} style={{ padding: '8px 10px', borderBottom: 'none' }}>
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
                    {wishlist.has(Number(game.appid)) && (
                      <div style={{ position: 'absolute', top: 8, left: 8 }}><WishlistDot /></div>
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
                    {(game.genres?.length > 0 || playerTags(game.categories).length > 0) && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5 }}>
                        {game.genres?.map(g => (
                          <span key={g} style={{ fontSize: 10, background: `${gc}20`, border: `1px solid ${gc}50`, borderRadius: 3, padding: '2px 6px', color: gc }}>{g}</span>
                        ))}
                        {playerTags(game.categories).map(t => (
                          <span key={t} style={{ fontSize: 10, background: 'rgba(102,192,244,0.12)', border: '1px solid rgba(102,192,244,0.35)', borderRadius: 3, padding: '2px 6px', color: '#66c0f4' }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {game.shortDescription && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {game.shortDescription}
                      </div>
                    )}
                  </div>
                </a>
              </div>
            );
          }

          // Carte petite pour les autres jours
          return (
            <a
              key={game.appid}
              href={`https://store.steampowered.com/app/${game.appid}/`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 10px',
                textDecoration: 'none',
                transition: 'background .12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 44, height: 28, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: 'var(--surface2)' }}>
                <img src={game.capsuleImage || game.headerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {game.type === 'dlc' && (
                    <span style={{ fontSize: 8, fontWeight: 800, background: 'rgba(90,60,160,0.3)', color: '#b090f0', borderRadius: 3, padding: '1px 4px', flexShrink: 0, textTransform: 'uppercase' }}>DLC</span>
                  )}
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {game.name}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {wishlist.has(Number(game.appid)) && (
                  <svg viewBox="0 0 24 24" width="10" height="10" fill="#f5c518" stroke="none" title="Wishlist"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                )}
                <DaysBadge days={days} />
              </div>
            </a>
          );
        })}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes wishlistPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(245,197,24,0.3); opacity: 1; }
          50% { box-shadow: 0 0 14px rgba(245,197,24,0.7); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
