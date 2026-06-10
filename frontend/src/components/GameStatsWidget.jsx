import { useState, useEffect } from 'react';

function extractAppId(url) {
  if (!url) return null;
  const m = url.match(/\/apps\/(\d+)\//);
  return m ? m[1] : null;
}

export default function GameStatsWidget({ api, token, board }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const appid = extractAppId(board?.headerImg) || extractAppId(board?.gameIcon);

  useEffect(() => {
    if (!appid || !token) { setLoading(false); return; }
    setLoading(true);
    setStats(null);
    fetch(`${api}/steam/gamestats/${appid}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [appid, token]);

  if (!appid) return null;
  if (!loading && !stats) return null;

  const bannerUrl = board?.headerImg || stats?.header_img;
  const gameName = stats?.name || board?.name || '';

  return (
    <div style={{
      position: 'fixed', bottom: 18, right: 18, zIndex: 40,
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden', width: collapsed ? 40 : 230,
      boxShadow: '0 6px 24px rgba(0,0,0,.55)',
      transition: 'width .2s ease',
    }}>
      {collapsed ? (
        /* Mini pill */
        <button
          onClick={() => setCollapsed(false)}
          title={gameName}
          style={{
            width: 40, height: 40, background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}
        >🎮</button>
      ) : (
        <>
          {/* Banner */}
          <div style={{ position: 'relative', height: 72, background: 'var(--surface2)', overflow: 'hidden' }}>
            {bannerUrl && (
              <img src={bannerUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {/* Collapse button */}
            <button
              onClick={() => setCollapsed(true)}
              style={{
                position: 'absolute', top: 5, right: 6,
                background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: 4,
                color: '#fff', fontSize: 10, cursor: 'pointer', lineHeight: 1,
                padding: '3px 5px', opacity: 0.8,
              }}
            >✕</button>
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
                      {stats?.playtime_minutes === 0 ? 'Jamais joué' : stats?.playtime_display || '0 min'}
                    </div>
                  </div>

                  {/* Achievements */}
                  {stats?.achievements_total > 0 && (
                    <div style={{
                      flex: 1, background: 'var(--surface2)', borderRadius: 7,
                      padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 1,
                    }}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🏆 Succès</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>
                        {stats.achievements_unlocked}
                        <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 10 }}>/{stats.achievements_total}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar for achievements */}
                {stats?.achievements_total > 0 && (
                  <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: 'var(--accent)',
                      width: `${Math.round((stats.achievements_unlocked / stats.achievements_total) * 100)}%`,
                      transition: 'width .4s ease',
                    }} />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
