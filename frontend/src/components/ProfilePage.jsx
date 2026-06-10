import { useState, useEffect } from 'react';

const API = '/api';

export default function ProfilePage({ token, currentUser, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  async function handlePwdChange(e) {
    e.preventDefault();
    setPwdError(''); setPwdSuccess('');
    if (pwdNew !== pwdConfirm) { setPwdError('Les mots de passe ne correspondent pas'); return; }
    if (pwdNew.length < 6) { setPwdError('Minimum 6 caractères'); return; }
    setPwdLoading(true);
    try {
      const res = await fetch(`${API}/user/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: pwdCurrent, newPassword: pwdNew }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setPwdSuccess('Mot de passe modifié !');
      setPwdCurrent(''); setPwdNew(''); setPwdConfirm('');
      setTimeout(() => { setPwdSuccess(''); setShowPwd(false); }, 2000);
    } catch (err) { setPwdError(err.message); }
    finally { setPwdLoading(false); }
  }

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

          {/* Changer mot de passe */}
          <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <button onClick={() => { setShowPwd(v => !v); setPwdError(''); setPwdSuccess(''); }}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 14px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
              🔑 {showPwd ? 'Annuler' : 'Changer le mot de passe'}
            </button>
            {showPwd && (
              <form onSubmit={handlePwdChange} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Mot de passe actuel', 'Nouveau mot de passe', 'Confirmer le nouveau'].map((label, i) => {
                  const vals = [pwdCurrent, pwdNew, pwdConfirm];
                  const setters = [setPwdCurrent, setPwdNew, setPwdConfirm];
                  return (
                    <div key={i}>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</label>
                      <input type="password" value={vals[i]} onChange={e => setters[i](e.target.value)} required
                        style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, outline: 'none' }} />
                    </div>
                  );
                })}
                {pwdError && <div style={{ background: 'rgba(220,50,50,.15)', border: '1px solid rgba(220,50,50,.4)', borderRadius: 7, padding: '7px 10px', color: '#f88', fontSize: 12 }}>{pwdError}</div>}
                {pwdSuccess && <div style={{ background: 'rgba(50,200,100,.15)', border: '1px solid rgba(50,200,100,.4)', borderRadius: 7, padding: '7px 10px', color: '#5c5', fontSize: 12 }}>✓ {pwdSuccess}</div>}
                <button type="submit" disabled={pwdLoading}
                  style={{ padding: '9px', background: 'var(--accent)', border: 'none', borderRadius: 7, color: '#fff', fontSize: 13, fontWeight: 700, cursor: pwdLoading ? 'not-allowed' : 'pointer', opacity: pwdLoading ? 0.7 : 1 }}>
                  {pwdLoading ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
