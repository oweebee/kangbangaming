import { useState, useEffect } from 'react';

const API = '/api';

export default function ProfilePage({ token, currentUser, onClose, onSaveSteam }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Mot de passe ──────────────────────────────────────────────────────────
  const [showPwd, setShowPwd] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // ── Steam ─────────────────────────────────────────────────────────────────
  const [steamId, setSteamId] = useState('');
  const [savedSteamId, setSavedSteamId] = useState('');
  const [editingSteam, setEditingSteam] = useState(false);
  const [steamPreview, setSteamPreview] = useState(null);
  const [steamSaving, setSteamSaving] = useState(false);
  const [steamMsg, setSteamMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          let msg = `Erreur ${res.status}`;
          try { const d = await res.json(); msg = d.error || msg; } catch {}
          throw new Error(msg);
        }
        const data = await res.json();
        setProfile(data);
        setSteamId(data.steamId || '');
        setSavedSteamId(data.steamId || '');
        if (data.steamAvatar) setSteamPreview({ avatar: data.steamAvatar, personaName: data.steamPersonaName });
      } catch (e) { setError(e.message); }
      finally { setLoading(false); }
    }
    load();
  }, [token]);

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

  async function handleSaveSteam(e) {
    e.preventDefault();
    setSteamSaving(true); setSteamMsg('');
    const res = await fetch(`${API}/user/settings`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ steamId }),
    });
    setSteamSaving(false);
    if (res.ok) {
      const data = await res.json();
      setSavedSteamId(steamId);
      setEditingSteam(false);
      if (data.steamAvatar) {
        setSteamPreview({ avatar: data.steamAvatar, personaName: data.steamPersonaName });
        setProfile(p => ({ ...p, steamId: steamId, steamAvatar: data.steamAvatar, steamPersonaName: data.steamPersonaName }));
      } else {
        setSteamPreview(null);
        setProfile(p => ({ ...p, steamId: steamId, steamAvatar: null, steamPersonaName: null }));
      }
      setSteamMsg('✓ Sauvegardé !');
      if (onSaveSteam) onSaveSteam({ steamAvatar: data.steamAvatar, steamPersonaName: data.steamPersonaName });
      setTimeout(() => setSteamMsg(''), 2500);
    } else {
      let errMsg = 'Erreur lors de la sauvegarde';
      try { const d = await res.json(); errMsg = d.error || errMsg; } catch {}
      setSteamMsg(errMsg);
    }
  }

  const hasSteam = !!savedSteamId;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'var(--surface1)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,.6)', overflow: 'hidden' }}>

        {/* Avatar header */}
        <div style={{ position: 'relative', background: 'linear-gradient(135deg, #0e1117 0%, #1a1f2e 100%)', padding: '32px 24px 20px', textAlign: 'center', flexShrink: 0 }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

          {(steamPreview?.avatar || profile?.steamAvatar) ? (
            <img src={steamPreview?.avatar || profile?.steamAvatar} alt="" style={{ width: 80, height: 80, borderRadius: 8, border: '3px solid var(--accent)', marginBottom: 12 }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--surface3)', border: '3px solid var(--border)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>👤</div>
          )}

          <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)', marginBottom: 4 }}>
            {steamPreview?.personaName || profile?.steamPersonaName || profile?.username || currentUser.username}
          </div>
          {(steamPreview?.personaName || profile?.steamPersonaName) && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{profile?.username || currentUser.username}</div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Chargement…</p>}
          {error && <p style={{ color: '#f88', textAlign: 'center' }}>{error}</p>}

          {profile && (
            <>
              {/* ── Section Steam ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 12, height: 12, fill: 'currentColor' }}>
                    <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256z"/>
                  </svg>
                  Steam
                </div>

                {/* Compte lié */}
                {hasSteam && !editingSteam && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface2)', border: '1px solid rgba(61,184,106,0.35)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                    {steamPreview?.avatar
                      ? <img src={steamPreview.avatar} alt="" style={{ width: 40, height: 40, borderRadius: 6, border: '2px solid var(--accent)', flexShrink: 0 }} />
                      : <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👤</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{steamPreview?.personaName || 'Compte lié'}</div>
                      <div style={{ fontSize: 10, color: 'rgba(61,184,106,0.8)', marginTop: 1 }}>✓ Compte Steam lié</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{savedSteamId}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end', flexShrink: 0 }}>
                      <a href={`https://steamcommunity.com/profiles/${savedSteamId}`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>Profil ↗</a>
                      <a href={`https://steamcommunity.com/profiles/${savedSteamId}/games`} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>Biblio ↗</a>
                    </div>
                    <button onClick={() => setEditingSteam(true)}
                      style={{ background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
                      ✏ Modifier
                    </button>
                  </div>
                )}

                {/* Formulaire lier/modifier */}
                {(!hasSteam || editingSteam) && (
                  <form onSubmit={handleSaveSteam} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ background: 'rgba(180,130,0,0.1)', border: '1px solid rgba(200,150,0,0.35)', borderRadius: 9, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        Ton profil Steam doit être <strong style={{ color: 'var(--text)' }}>public</strong>.{' '}
                        <a href="https://help.steampowered.com/fr/faqs/view/588C-C67D-0251-C276" target="_blank" rel="noreferrer" style={{ color: '#47a7f5', textDecoration: 'underline' }}>Comment faire ↗</a>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Steam ID (64-bit) — <a href="https://steamid.io" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 400 }}>steamid.io ↗</a>
                      </label>
                      <input
                        autoFocus
                        value={steamId}
                        onChange={e => setSteamId(e.target.value)}
                        placeholder="Ex: 76561197969409733"
                        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button type="submit" disabled={steamSaving || !steamId.trim()}
                        style={{ padding: '8px 18px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: (steamSaving || !steamId.trim()) ? 'not-allowed' : 'pointer', opacity: (steamSaving || !steamId.trim()) ? 0.6 : 1 }}>
                        {steamSaving ? 'Sauvegarde…' : 'Sauvegarder'}
                      </button>
                      {editingSteam && (
                        <button type="button" onClick={() => { setSteamId(savedSteamId); setEditingSteam(false); setSteamMsg(''); }}
                          style={{ padding: '8px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                          Annuler
                        </button>
                      )}
                      {steamMsg && <span style={{ fontSize: 12, color: steamMsg.startsWith('✓') ? '#3db86a' : '#f88' }}>{steamMsg}</span>}
                    </div>
                  </form>
                )}

                {steamMsg && hasSteam && !editingSteam && (
                  <div style={{ fontSize: 12, color: '#3db86a', padding: '8px 12px', background: 'rgba(61,184,106,0.1)', border: '1px solid rgba(61,184,106,0.3)', borderRadius: 7 }}>{steamMsg}</div>
                )}
              </div>

              {/* ── Stats KangBanGaming ── */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>KangBanGaming</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    ['🗂️', profile.stats.boardCount, 'Boards'],
                    ['🌐', profile.stats.publicBoardCount, 'Boards publics'],
                    ['🎮', profile.stats.totalGames - profile.stats.customCards, 'Jeux Steam'],
                    ['✨', profile.stats.customCards, 'Cartes perso'],
                    ['📋', profile.stats.totalColumns, 'Colonnes'],
                    ['📅', profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR') : '—', 'Membre depuis'],
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

          {/* ── Changer mot de passe ── */}
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
