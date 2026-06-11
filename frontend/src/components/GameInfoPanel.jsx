import { useState, useEffect, useRef } from 'react';

const PANEL_WIDTH = 310;

// Format unix timestamp → readable date
function fmtDate(ts) {
  return new Date(ts * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Truncate text to N chars
function truncate(str = '', n = 200) {
  if (str.length <= n) return str;
  return str.slice(0, n).replace(/\s+\S*$/, '') + '…';
}

// Tag badge colors
function tagStyle(tag) {
  const map = {
    patchnotes: { bg: 'rgba(71,167,245,0.15)', color: '#47a7f5', border: 'rgba(71,167,245,0.3)' },
    mod:        { bg: 'rgba(100,200,120,0.12)', color: '#4cd882', border: 'rgba(76,216,130,0.3)' },
    community:  { bg: 'rgba(245,197,24,0.12)', color: '#f5c518', border: 'rgba(245,197,24,0.3)' },
  };
  return map[tag?.toLowerCase()] || { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.1)' };
}

export const GAME_INFO_PANEL_WIDTH = PANEL_WIDTH;

/**
 * GameInfoPanel
 * Props:
 *   api, token  — pour les requêtes
 *   gameInfo    — objet gameInfo déjà fetchée (reviews, price, etc.)
 *   board       — board actif (headerImg, name)
 *   appId       — Steam appid string
 *   locked      — contrôlé par le parent (locked open)
 *   onLockChange(bool) — callback
 *   sidebarWidth — largeur de la sidebar (défaut 278)
 */
export default function GameInfoPanel({
  api, token, gameInfo, board, appId,
  locked, onLockChange,
  sidebarWidth = 278,
}) {
  const [open, setOpen]           = useState(false);
  const [news, setNews]           = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [expanded, setExpanded]   = useState({}); // gid → bool

  // Fetch news when appId changes
  useEffect(() => {
    if (!appId || !token) { setNews([]); return; }
    setNewsLoading(true);
    setNews([]);
    fetch(`${api}/steam/news/${appId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setNews(d.items || []))
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [appId, token, api]);

  // When locked externally, force open
  useEffect(() => { if (locked) setOpen(true); }, [locked]);

  const handleTabClick = () => {
    if (locked) return; // can't close when locked
    setOpen(v => !v);
  };

  const handleLockToggle = () => {
    const next = !locked;
    onLockChange(next);
    if (next) setOpen(true);
  };

  const isOpen = open || locked;

  const bannerUrl = board?.headerImg || (appId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg` : null);
  const gameName  = gameInfo?.name || board?.name || '';

  const reviewScore  = gameInfo?.reviewScore ?? 0;
  const reviewColor  = reviewScore >= 8 ? '#4cd882' : reviewScore >= 5 ? '#f5c518' : '#f87575';
  const reviewEmoji  = reviewScore >= 8 ? '👍' : reviewScore >= 5 ? '😐' : '👎';

  return (
    <>
      {/* ── Pull tab — always visible at sidebar right edge ── */}
      <div
        onClick={handleTabClick}
        title={isOpen ? (locked ? 'Panneau verrouillé' : 'Fermer') : 'Infos & Actualités du jeu'}
        style={{
          position: 'fixed',
          left: sidebarWidth,
          top: '50%',
          transform: `translateY(-50%) translateX(${isOpen ? PANEL_WIDTH : 0}px)`,
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 26,
          cursor: locked ? 'default' : 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          width: 20, height: 64,
          background: locked
            ? 'linear-gradient(180deg, rgba(232,129,58,0.3) 0%, rgba(192,80,10,0.3) 100%)'
            : 'linear-gradient(180deg, rgba(50,55,70,0.95) 0%, rgba(30,33,40,0.95) 100%)',
          border: `1px solid ${locked ? 'rgba(232,129,58,0.6)' : 'rgba(255,255,255,0.12)'}`,
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          boxShadow: '3px 0 12px rgba(0,0,0,0.5)',
          gap: 4,
          userSelect: 'none',
        }}
      >
        {/* Newspaper icon */}
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke={locked ? '#e8813a' : 'rgba(255,255,255,0.7)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
          <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
        </svg>
        {/* Chevron */}
        <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke={locked ? '#e8813a' : 'rgba(255,255,255,0.5)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points={isOpen ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
        </svg>
      </div>

      {/* ── Sliding panel ── */}
      <div
        style={{
          position: 'fixed',
          left: sidebarWidth,
          top: 0, bottom: 0,
          width: PANEL_WIDTH,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 20,
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          boxShadow: isOpen ? '4px 0 20px rgba(0,0,0,0.5)' : 'none',
          overflow: 'hidden',
        }}
      >
        {/* ── Game banner ── */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {bannerUrl ? (
            <img src={bannerUrl} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: 120, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎮</div>
          )}
          {/* Game name overlay */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            padding: '24px 10px 8px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gameName}</div>
          </div>
          {/* Lock + Steam link buttons */}
          <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
            {appId && (
              <a
                href={`https://store.steampowered.com/app/${appId}`}
                target="_blank" rel="noreferrer"
                title="Voir sur Steam"
                style={{ width: 24, height: 24, borderRadius: 5, background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
              >
                <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 12, height: 12, fill: '#c7d5e0' }}>
                  <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256z"/>
                </svg>
              </a>
            )}
            <button
              onClick={handleLockToggle}
              title={locked ? 'Déverrouiller (fermer possible)' : 'Verrouiller ouvert (pousse les colonnes)'}
              style={{
                width: 24, height: 24, borderRadius: 5,
                background: locked ? 'rgba(232,129,58,0.4)' : 'rgba(0,0,0,0.55)',
                border: `1px solid ${locked ? 'rgba(232,129,58,0.7)' : 'rgba(255,255,255,0.2)'}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: locked ? '#e8813a' : 'rgba(255,255,255,0.7)',
                fontSize: 12, transition: 'all .2s',
              }}
            >
              {locked ? '📌' : '📍'}
            </button>
          </div>
        </div>

        {/* ── Game stats condensed ── */}
        {gameInfo && (
          <div style={{
            padding: '8px 10px', flexShrink: 0,
            borderBottom: '1px solid var(--border)',
            display: 'flex', flexWrap: 'wrap', gap: 6,
          }}>
            {/* Players online */}
            {gameInfo.playerCount !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3db86a', boxShadow: '0 0 5px #3db86a88', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: '#fff' }}>{gameInfo.playerCount.toLocaleString('fr-FR')}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>en jeu</span>
              </div>
            )}
            {/* Review */}
            {gameInfo.reviewScoreDesc && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}>
                <span>{reviewEmoji}</span>
                <span style={{ fontWeight: 700, color: reviewColor }}>{gameInfo.reviewScoreDesc}</span>
                {gameInfo.positivePercent !== null && <span style={{ color: 'rgba(255,255,255,0.4)' }}>({gameInfo.positivePercent}%)</span>}
              </div>
            )}
            {/* Price */}
            {gameInfo.price && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginLeft: 'auto' }}>
                {gameInfo.discount > 0 && <span style={{ background: '#4c6b22', color: '#a4d007', fontWeight: 900, fontSize: 9, padding: '1px 4px', borderRadius: 3 }}>-{gameInfo.discount}%</span>}
                <span style={{ fontWeight: 700, color: gameInfo.discount > 0 ? '#a4d007' : '#fff' }}>{gameInfo.price}</span>
              </div>
            )}
            {/* Metacritic */}
            {gameInfo.metacritic !== null && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontSize: 11 }}
                onClick={() => gameInfo.metacriticUrl && window.open(gameInfo.metacriticUrl, '_blank')}
              >
                <div style={{ width: 20, height: 20, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 10, color: '#000', background: gameInfo.metacritic >= 75 ? '#6c3' : gameInfo.metacritic >= 50 ? '#fc3' : '#f00' }}>
                  {gameInfo.metacritic}
                </div>
              </div>
            )}
            {/* Badges row */}
            <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
              {gameInfo.earlyAccess && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(220,50,50,0.18)', color: '#ff5555', border: '1px solid rgba(220,50,50,0.5)' }}>⚠ Accès Anticipé</span>}
              {gameInfo.comingSoon && !gameInfo.earlyAccess && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(245,197,24,0.12)', color: '#f5c518', border: '1px solid rgba(245,197,24,0.3)' }}>🔜 À venir</span>}
              {gameInfo.multiplayerLabel && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(71,167,245,0.15)', color: '#47a7f5', border: '1px solid rgba(71,167,245,0.3)' }}>👥 {gameInfo.multiplayerLabel}</span>}
              {(gameInfo.genres || []).map(g => <span key={g} style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>{g}</span>)}
            </div>
            {/* Developer + date */}
            {(gameInfo.developer || gameInfo.releaseDate) && (
              <div style={{ width: '100%', display: 'flex', gap: 5, alignItems: 'center', fontSize: 10 }}>
                {gameInfo.developer && <span style={{ color: 'rgba(255,255,255,0.4)' }}>🛠 {gameInfo.developer}</span>}
                {gameInfo.developer && gameInfo.releaseDate && <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>}
                {gameInfo.releaseDate && <span style={{ color: 'rgba(255,255,255,0.35)' }}>📅 {gameInfo.releaseDate}</span>}
              </div>
            )}
          </div>
        )}

        {/* ── News section ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
          {/* Section header */}
          <div style={{ padding: '6px 10px 4px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
              <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actualités Steam</span>
            {newsLoading && <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>Chargement…</span>}
            {!newsLoading && news.length > 0 && <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>{news.length} articles</span>}
          </div>

          {!newsLoading && news.length === 0 && (
            <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
              {appId ? 'Aucune actualité disponible' : 'Aucun jeu Steam sélectionné'}
            </div>
          )}

          {news.map(item => {
            const isExpanded = expanded[item.gid];
            const shortContent = truncate(item.contents, 160);
            const hasMore = item.contents.length > 160;
            const ts = item.tags || [];
            return (
              <div
                key={item.gid}
                style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  transition: 'background .12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Tags */}
                {ts.length > 0 && (
                  <div style={{ display: 'flex', gap: 3, marginBottom: 4, flexWrap: 'wrap' }}>
                    {ts.map(tag => {
                      const s = tagStyle(tag);
                      return <span key={tag} style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tag}</span>;
                    })}
                  </div>
                )}
                {/* Title — clickable */}
                <a href={item.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block', marginBottom: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#c6d4df', lineHeight: 1.3, transition: 'color .12s' }}
                    onMouseEnter={e => e.target.style.color = '#fff'}
                    onMouseLeave={e => e.target.style.color = '#c6d4df'}
                  >{item.title}</div>
                </a>
                {/* Content */}
                {item.contents && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {isExpanded ? item.contents : shortContent}
                  </div>
                )}
                {/* Footer: date + expand + source */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{fmtDate(item.date)}</span>
                  {item.author && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>· {item.author}</span>}
                  <div style={{ flex: 1 }} />
                  {hasMore && (
                    <button
                      onClick={() => setExpanded(prev => ({ ...prev, [item.gid]: !prev[item.gid] }))}
                      style={{ fontSize: 9, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 700 }}
                    >
                      {isExpanded ? 'Réduire ↑' : 'Lire ↓'}
                    </button>
                  )}
                  <a href={item.url} target="_blank" rel="noreferrer" style={{ fontSize: 9, color: 'rgba(71,167,245,0.7)', textDecoration: 'none', fontWeight: 700 }}>↗</a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
