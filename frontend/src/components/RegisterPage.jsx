import { useState } from 'react';

const DISCORD = 'https://discord.gg/9mXpM9wv';
const GITHUB  = 'https://github.com/oweebee/kangbangaming';

export default function RegisterPage({ onLogin, onGoLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [steamId, setSteamId]   = useState('');
  const [error, setError]       = useState('');
  const [pending, setPending]   = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    if (!/^\d{17}$/.test(steamId.trim())) { setError('Le Steam ID doit être un nombre de 17 chiffres (ex: 76561197960287930)'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, steamId: steamId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur d\'inscription');
      if (data.pending) { setPending(true); return; }
      // Legacy: if server ever returns a token directly
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (pending) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
        <div style={{ background: 'var(--surface1)', border: '1px solid var(--border)', borderRadius: 14, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 8px 40px rgba(0,0,0,.4)', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>Inscription envoyée !</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            Ton compte a été créé. Un admin doit valider ton inscription avant que tu puisses te connecter.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
            Rejoins le Discord pour être notifié dès que ton compte est activé !
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <a href={DISCORD} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(88,101,242,.2)', border: '1px solid rgba(88,101,242,.4)', borderRadius: 8, color: '#7289da', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              <svg viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14, fill: 'currentColor' }}>
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              Rejoindre le Discord
            </a>
          </div>
          <button onClick={onGoLogin} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            ← Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ background: 'var(--surface1)', border: '1px solid var(--border)', borderRadius: 14, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 8px 40px rgba(0,0,0,.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32, fill: 'var(--accent)', flexShrink: 0 }}>
            <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256zM155.7 384.3l-30.5-12.6a52.79 52.79 0 0 0 27.2 25.8c26.9 11.2 57.8-1.6 69-28.4 5.4-13 5.5-27.3.1-40.3-5.4-13-15.5-23.2-28.5-28.6-12.7-5.3-26.4-5.5-38.8-1.4l31.5 13c19.8 8.2 29.2 30.9 20.9 50.7-8.3 19.9-31 29.2-50.9 21zm173.8-129.9c-34.4 0-62.4-28-62.4-62.3s28-62.3 62.4-62.3 62.4 28 62.4 62.3-27.9 62.3-62.4 62.3zm.1-15.6c25.9 0 46.9-21 46.9-46.8 0-25.9-21-46.8-46.9-46.8s-46.9 21-46.9 46.8c.1 25.8 21.1 46.8 46.9 46.8z"/>
          </svg>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.04em', color: 'var(--text)' }}>KangBanGaming</span>
        </div>

        <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 700, textAlign: 'center', color: 'var(--text)' }}>Créer un compte</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Nom d'utilisateur <span style={{ fontWeight: 400 }}>(min. 3 caract.)</span></label>
            <input value={username} onChange={e => setUsername(e.target.value)} autoFocus required minLength={3}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Mot de passe <span style={{ fontWeight: 400 }}>(min. 6 caract.)</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Confirmer le mot de passe</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              Steam ID <span style={{ color: '#f88', fontWeight: 700 }}>*</span>
              {' '}
              <a href="https://help.steampowered.com/fr/faqs/view/2816-BE67-5B69-0FEC" target="_blank" rel="noreferrer"
                style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 400 }}>Comment le trouver ↗</a>
            </label>
            <input
              value={steamId} onChange={e => setSteamId(e.target.value)}
              required placeholder="ex : 76561197960287930"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'monospace' }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
              Nombre de 17 chiffres — visible dans les paramètres Steam ou sur{' '}
              <a href="https://www.steamidfinder.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>steamidfinder.com</a>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(220,50,50,.15)', border: '1px solid rgba(220,50,50,.4)', borderRadius: 8, padding: '8px 12px', color: '#f88', fontSize: 13 }}>{error}</div>
          )}

          <button type="submit" disabled={loading}
            style={{ marginTop: 4, padding: '11px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Inscription…' : 'Créer le compte'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Déjà un compte ?{' '}
          <button onClick={onGoLogin} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, fontSize: 13, padding: 0 }}>Se connecter</button>
        </div>

        {/* Discord + GitHub */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Powered by</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <a href={DISCORD} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(88,101,242,.15)', border: '1px solid rgba(88,101,242,.35)', borderRadius: 8, color: '#7289da', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              <svg viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14, fill: 'currentColor' }}>
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
              Discord
            </a>
            <a href={GITHUB} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14, fill: 'currentColor' }}>
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
