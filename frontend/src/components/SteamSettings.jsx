import { useState, useEffect } from 'react';

export default function SteamSettings({ token, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [steamId, setSteamId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('/api/user/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setApiKey(d.steamApiKey || ''); setSteamId(d.steamId || ''); })
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/user/settings', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ steamApiKey: apiKey, steamId: steamId }),
    });
    setSaving(false);
    if (res.ok) { setMsg('✓ Sauvegardé !'); setTimeout(() => setMsg(''), 2500); }
    else setMsg('Erreur lors de la sauvegarde');
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--surface1)', border: '1px solid var(--border)', borderRadius: 14,
        width: '100%', maxWidth: 440, boxShadow: '0 8px 40px rgba(0,0,0,.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 18, height: 18, fill: 'var(--accent)' }}>
              <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256zM155.7 384.3l-30.5-12.6a52.79 52.79 0 0 0 27.2 25.8c26.9 11.2 57.8-1.6 69-28.4 5.4-13 5.5-27.3.1-40.3-5.4-13-15.5-23.2-28.5-28.6-12.7-5.3-26.4-5.5-38.8-1.4l31.5 13c19.8 8.2 29.2 30.9 20.9 50.7-8.3 19.9-31 29.2-50.9 21zm173.8-129.9c-34.4 0-62.4-28-62.4-62.3s28-62.3 62.4-62.3 62.4 28 62.4 62.3-27.9 62.3-62.4 62.3zm.1-15.6c25.9 0 46.9-21 46.9-46.8 0-25.9-21-46.8-46.9-46.8s-46.9 21-46.9 46.8c.1 25.8 21.1 46.8 46.9 46.8z"/>
            </svg>
            Paramètres Steam
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 20 }}>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Configure tes propres credentials Steam pour voir ta bibliothèque et tes succès.<br/>
            <a href="https://store.steampowered.com/dev/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Obtenir une API key Steam ↗</a>
          </p>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement…</p>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Steam API Key</label>
                <input
                  type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
                  placeholder="Ex: 778B0ADB..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Steam ID (64-bit)</label>
                <input
                  value={steamId} onChange={e => setSteamId(e.target.value)}
                  placeholder="Ex: 76561197969409733"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
                />
                <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>
                  Trouve ton ID sur <a href="https://steamid.io" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>steamid.io ↗</a>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Sauvegarde…' : 'Sauvegarder'}
                </button>
                {apiKey && (
                  <button type="button" onClick={() => { setApiKey(''); setSteamId(''); }} style={{ padding: '9px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                    Effacer
                  </button>
                )}
                {msg && <span style={{ fontSize: 12, color: msg.startsWith('✓') ? 'var(--accent)' : '#f88' }}>{msg}</span>}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
