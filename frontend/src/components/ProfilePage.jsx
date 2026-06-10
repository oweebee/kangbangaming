import { useState, useEffect } from 'react';

const API = '/api';

export default function ProfilePage({ token, currentUser, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Erreur chargement');
        setProfile(await res.json());
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }
    load();
  }, [token]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--surface1)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,.6)', overflow: 'hidden' }}>

        {/* Avatar header */}
        <div style={{ position: 'relative', background: 'linear-gradient(135deg, #0e1117 0%, #1a1f2e 100%)', padding: '32px 24px 20px', textAlign: 'center', flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

          {profile?.steamAvatar ? (
            <img src={profile.steamAvatar} alt="" style={{ width: 80, height: 80, borderRadius: 8, border: '3px solid var(--accent)', marginBottom: 12 }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--surface3)', border: '3px solid var(--border)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👤</div>
          )}

          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>
            {profile?.steamPersonaName || profile?.username || currentUser.username}
          </div>
          {profile?.steamPersonaName && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{profile.username}</div>
          )}
          {profile?.role === 'admin' && (
            <div style={{ marginTop: 6, display: 'inline-block', padding: '2px 10px', borderRadius: 20, background: 'rgba(245,165,0,.2)', color: '#f5a500', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Admin</div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Chargement…</p>}
          {error && <p style={{ color: '#f88', textAlign: 'center' }}>{error}</p>}

          {profile && (
            <>
              {/* Steam info */}
              {profile.steamId && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Steam</div>
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    {[
                      ['Steam ID', profile.steamId],
                      ['Pseudo Steam', profile.steamPersonaName || '—'],
                      ['Bibliothèque', <a href={`https://steamcommunity.com/profiles/${profile.steamId}/games`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Voir ↗</a>],
                      ['Profil', <a href={`https://steamcommunity.com/profiles/${profile.steamId}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Ouvrir ↗</a>],
                    ].map(([label, value], i, arr) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 120 }}>{label}</span>
                        <span style={{ fontSize: 13 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* App stats */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>KangBanGaming</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    ['🗂️', profile.stats.boardCount, 'Boards'],
                    ['🌐', profile.stats.publicBoardCount, 'Boards publics'],
                    ['🎮', profile.stats.totalGames - profile.stats.customCards, 'Jeux Steam'],
                    ['✨', profile.stats.customCards, 'Cartes perso'],
                    ['📋', profile.stats.totalColumns, 'Colonnes'],
                    ['📅', new Date(profile.createdAt).toLocaleDateString('fr-FR'), 'Membre depuis'],
                  ].map(([icon, value, label]) => (
                    <div key={label} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 2 }}>{value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
