import { useState, useEffect } from 'react';

function extractAppId(url) {
  if (!url) return null;
  const m = url.match(/\/apps\/(\d+)\//);
  return m ? m[1] : null;
}

export default function GameStatsWidget({ api, token, board }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slideIn, setSlideIn] = useState(false);

  const appid = extractAppId(board?.headerImg) || extractAppId(board?.gameIcon);

  // Fetch stats when board changes
  useEffect(() => {
    if (!appid || !token) { setLoading(false); return; }
    setLoading(true);
    setStats(null);
    fetch(`${api}/steam/gamestats/${appid}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [appid, token]);

  // Slide in after a short delay (lets the element render off-screen first)
  useEffect(() => {
    if (!appid) return;
    setSlideIn(false);
    const t = setTimeout(() => setSlideIn(true), 60);
    return () => clearTimeout(t);
  }, [appid]);


  if (!appid) return null;
  if (!loading && !stats) return null;

  const bannerUrl = board?.headerImg || stats?.header_img;
  const gameName = stats?.name || board?.name || '';
  const achPct = stats?.achievements_total > 0
    ? Math.round((stats.achievements_unlocked / stats.achievements_total) * 100)
    : 0;

  return (
    <div style={{
      position: 'fixed',
      bottom: '25vh',
      right: 0,
      zIndex: 40,
      width: 248,  /* 230 widget + 18px right margin */
      display: 'flex',
      alignItems: 'stretch',
      transform: slideIn ? 'translateX(-18px)' : 'translateX(calc(100% - 28px))',
      transition: 'transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1)',
    }}>
      {/* Pull tab — always sticks out on the left when widget is slid away */}
      <div
        onClick={() => setSlideIn(v => !v)}
        style={{
          width: 28, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRight: slideIn ? 'none' : '1px solid var(--border)',
          borderRadius: slideIn ? '12px 0 0 12px' : 12,
          cursor: 'pointer',
          boxShadow: slideIn ? 'none' : '0 4px 16px rgba(0,0,0,.5)',
          transition: 'border-radius .3s, box-shadow .3s',
        }}
      >
        <span style={{
          fontSize: 14,
          transform: slideIn ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: 'transform .3s',
          display: 'block', lineHeight: 1,
          userSelect: 'none',
        }}>›</span>
      </div>

      {/* Main card */}
      <div style={{
        flex: 1,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: 'none',
        borderRadius: '0 12px 12px 0',
        overflow: 'hidden',
        boxShadow: '0 8px 28px rgba(0,0,0,.6)',
      }}>

      {/* Banner */}
      <div style={{ position: 'relative', height: 108, background: 'var(--surface2)', overflow: 'hidden' }}>
        {bannerUrl && (
          <img
            src={bannerUrl} alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', padding: '4px 0' }}>
            Chargement…
          </div>
        ) : (
          <>
            <div style={{
              fontWeight: 700, fontSize: 11, color: 'var(--text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{gameName}</div>

            <div style={{ display: 'flex', gap: 6 }}>
              {/* Playtime */}
              <div style={{
                flex: 1, background: 'var(--surface2)', borderRadius: 7,
                padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 1,
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⏱ Temps</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                  {stats?.playtime_minutes === 0 ? 'Jamais joué' : stats?.playtime_display || '—'}
                </div>
              </div>

              {/* Achievements */}
              {stats?.achievements_total > 0 && (
                <a
                  href={stats.achievements_url || '#'}
                  target="_blank" rel="noreferrer"
                  style={{
                    flex: 1, background: 'var(--surface2)', borderRadius: 7,
                    padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 1,
                    textDecoration: 'none', border: '1px solid transparent',
                    transition: 'border-color .15s, background .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim, rgba(232,129,58,.12))'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--surface2)'; }}
                >
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🏆 Succès ↗</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                    {stats.achievements_unlocked}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 10 }}>
                      /{stats.achievements_total}
                    </span>
                  </div>
                </a>
              )}
            </div>

            {/* Achievement progress bar */}
            {stats?.achievements_total > 0 && (
              <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99, background: 'var(--accent)',
                  width: `${achPct}%`,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            )}
          </>
        )}
      </div>
      </div> {/* end main card */}
    </div>
  );
}
