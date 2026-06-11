import { useState, useEffect } from 'react';

export default function SteamSettings({ token, onSave, onClose }) {
  const [steamId, setSteamId]     = useState('');
  const [savedId, setSavedId]     = useState('');   // ID actuellement enregistré
  const [editing, setEditing]     = useState(false); // mode modification
  const [preview, setPreview]     = useState(null);  // { avatar, personaName }
  const [loading, setLoading]     = useState(true);
  const [saving,  setSaving]      = useState(false);
  const [msg,     setMsg]         = useState('');

  useEffect(() => {
    fetch('/api/user/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setSteamId(d.steamId || '');
        setSavedId(d.steamId || '');
        if (d.steamAvatar) setPreview({ avatar: d.steamAvatar, personaName: d.steamPersonaName });
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setMsg('');
    const res = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ steamId }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setSavedId(steamId);
      setEditing(false);
      if (data.steamAvatar) setPreview({ avatar: data.steamAvatar, personaName: data.steamPersonaName });
      else setPreview(null);
      setMsg('✓ Sauvegardé !');
      if (onSave) onSave({ steamAvatar: data.steamAvatar, steamPersonaName: data.steamPersonaName });
      setTimeout(() => setMsg(''), 2500);
    } else {
      let errMsg = 'Erreur lors de la sauvegarde';
      try { const d = await res.json(); errMsg = d.error || errMsg; } catch {}
      setMsg(errMsg);
    }
  }

  function handleCancel() {
    setSteamId(savedId);
    setEditing(false);
    setMsg('');
  }

  const hasId = !!savedId;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
        width: '100%', maxWidth: 420, boxShadow: '0 8px 40px rgba(0,0,0,.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 17, height: 17, fill: 'var(--accent)' }}>
              <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256z"/>
            </svg>
            Mon compte Steam
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Profil lié (si ID déjà renseigné) ── */}
          {!loading && hasId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface2)', border: '1px solid rgba(61,184,106,0.35)', borderRadius: 10, padding: '12px 14px' }}>
              {preview?.avatar
                ? <img src={preview.avatar} alt="" style={{ width: 44, height: 44, borderRadius: 6, border: '2px solid var(--accent)', flexShrink: 0 }} />
                : <div style={{ width: 44, height: 44, borderRadius: 6, background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>👤</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{preview?.personaName || 'Compte Steam lié'}</div>
                <div style={{ fontSize: 10, color: 'rgba(61,184,106,0.8)', marginTop: 2 }}>✓ Compte lié</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{savedId}</div>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  style={{ background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}
                >
                  ✏ Modifier
                </button>
              )}
            </div>
          )}

          {/* ── Avertissement profil public ── */}
          <div style={{
            background: 'rgba(180,130,0,0.1)', border: '1px solid rgba(200,150,0,0.35)',
            borderRadius: 9, padding: '11px 13px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.2 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#c9a010', marginBottom: 4 }}>
                Profil Steam public requis
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Pour que KangBanGaming puisse lire tes stats, ton profil Steam doit être <strong style={{ color: 'var(--text)' }}>public</strong>.{' '}
                <a
                  href="https://help.steampowered.com/fr/faqs/view/588C-C67D-0251-C276"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#47a7f5', textDecoration: 'underline', fontWeight: 600 }}
                >
                  Comment rendre mon profil public ↗
                </a>
              </div>
            </div>
          </div>

          {/* ── Formulaire (si pas d'ID, ou en mode édition) ── */}
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Chargement…</p>
          ) : (!hasId || editing) && (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Trouve ton ID sur{' '}
                <a href="https://steamid.io" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>steamid.io ↗</a>
                {' '}— format SteamID64 (commence par 765…)
              </p>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Steam ID (64-bit)
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
                <button
                  type="submit"
                  disabled={saving || !steamId.trim()}
                  style={{ padding: '9px 20px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: (saving || !steamId.trim()) ? 'not-allowed' : 'pointer', opacity: (saving || !steamId.trim()) ? 0.6 : 1 }}
                >
                  {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    style={{ padding: '9px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                )}
                {steamId && !editing && (
                  <button
                    type="button"
                    onClick={() => { setSteamId(''); setPreview(null); }}
                    style={{ padding: '9px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
                  >
                    Effacer
                  </button>
                )}
                {msg && <span style={{ fontSize: 12, color: msg.startsWith('✓') ? '#3db86a' : '#f88' }}>{msg}</span>}
              </div>
            </form>
          )}

          {/* Message succès hors formulaire */}
          {msg && hasId && !editing && (
            <div style={{ fontSize: 12, color: '#3db86a', padding: '8px 12px', background: 'rgba(61,184,106,0.1)', border: '1px solid rgba(61,184,106,0.3)', borderRadius: 7 }}>
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
