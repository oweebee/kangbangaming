import { useState, useEffect } from 'react';
import ModalBackdrop from './ModalBackdrop.jsx';

const API = '/api';

function StatusBadge({ status }) {
  const map = {
    pending:   { bg: 'rgba(255,200,0,.18)',   color: '#ffc800', label: 'En attente' },
    active:    { bg: 'rgba(60,200,100,.18)',   color: '#4cd882', label: 'Actif' },
    suspended: { bg: 'rgba(220,50,50,.18)',    color: '#f87575', label: 'Suspendu' },
    admin:     { bg: 'rgba(245,165,0,.18)',    color: '#f5a500', label: 'Admin' },
  };
  const s = map[status] || map.active;
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: s.bg, color: s.color, textTransform: 'uppercase' }}>
      {s.label}
    </span>
  );
}

export default function AdminPanel({ token, currentUser, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editPwd, setEditPwd] = useState('');
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('pending');

  // Create user tab
  const [createForm, setCreateForm] = useState({ username: '', password: '', steamId: '' });
  const [createMsg, setCreateMsg] = useState('');
  const [createErr, setCreateErr] = useState('');
  const [creating, setCreating] = useState(false);

  // Boards tab
  const [boards, setBoards] = useState([]);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [boardsError, setBoardsError] = useState('');

  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/users`, { headers: h });
      if (!res.ok) throw new Error('Erreur chargement');
      setUsers(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function fetchBoards() {
    setBoardsLoading(true); setBoardsError('');
    try {
      const res = await fetch(`${API}/admin/boards`, { headers: h });
      if (!res.ok) throw new Error('Erreur chargement');
      setBoards(await res.json());
    } catch (e) { setBoardsError(e.message); }
    finally { setBoardsLoading(false); }
  }

  useEffect(() => { if (tab === 'boards') fetchBoards(); }, [tab]);

  async function handleDeleteBoard(ownerId, boardId, boardName) {
    if (!confirm(`Supprimer le board "${boardName}" ?`)) return;
    await fetch(`${API}/admin/boards/${ownerId}/${boardId}`, { method: 'DELETE', headers: h });
    fetchBoards();
  }

  async function patch(id, body) {
    setSaving(true);
    await fetch(`${API}/admin/users/${id}`, { method: 'PATCH', headers: h, body: JSON.stringify(body) });
    setSaving(false);
    fetchUsers();
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cet utilisateur et tous ses boards ?')) return;
    await fetch(`${API}/admin/users/${id}`, { method: 'DELETE', headers: h });
    fetchUsers();
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setCreateErr(''); setCreateMsg('');
    const { username, password, steamId } = createForm;
    if (!username || !password) { setCreateErr('Nom d\'utilisateur et mot de passe requis.'); return; }
    if (password.length < 6) { setCreateErr('Mot de passe trop court (min 6 caractères).'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ username: username.trim(), password, steamId: steamId.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Erreur');
      setCreateMsg(`✓ ${data.message}`);
      setCreateForm({ username: '', password: '', steamId: '' });
      fetchUsers();
    } catch (err) {
      setCreateErr(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleSavePwd(id) {
    if (!editPwd.trim()) return;
    setSaving(true);
    await fetch(`${API}/admin/users/${id}`, { method: 'PATCH', headers: h, body: JSON.stringify({ password: editPwd.trim() }) });
    setSaving(false);
    setEditingId(null); setEditPwd('');
    fetchUsers();
  }

  const pending = users.filter(u => (u.status || 'active') === 'pending');
  const active  = users.filter(u => (u.status || 'active') === 'active' && u.id !== currentUser.id);
  const suspended = users.filter(u => (u.status || 'active') === 'suspended');

  const tabStyle = (id) => ({
    background: 'none', border: 'none',
    borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
    padding: '8px 14px', color: tab === id ? 'var(--text)' : 'var(--text-muted)',
    fontWeight: tab === id ? 700 : 400, fontSize: 13, cursor: 'pointer', marginBottom: -1,
  });

  function renderUser(u, showApprove = false) {
    return (
      <div key={u.id} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {u.steamAvatar
              ? <img src={u.steamAvatar} alt="" style={{ width: 32, height: 32, borderRadius: 6, border: '1.5px solid var(--border)', flexShrink: 0 }} />
              : <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>
            }
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{u.username}</span>
                <StatusBadge status={u.role === 'admin' ? 'admin' : (u.status || 'active')} />
                {u.steamAuth && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(28,58,89,0.7)', border: '1px solid rgba(71,167,245,0.35)', borderRadius: 20, padding: '1px 7px' }}>
                    <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 8, height: 8, fill: '#47a7f5' }}>
                      <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256z"/>
                    </svg>
                    <span style={{ fontSize: 9, color: '#47a7f5', fontWeight: 700 }}>Steam</span>
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                {u.steamPersonaName && u.steamPersonaName !== u.username && <span style={{ marginLeft: 6, opacity: 0.7 }}>· {u.steamPersonaName}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
            {showApprove && (
              <button onClick={() => patch(u.id, { status: 'active' })} disabled={saving}
                style={{ background: 'rgba(60,200,100,.2)', border: '1px solid rgba(60,200,100,.4)', borderRadius: 6, padding: '5px 12px', color: '#4cd882', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>
                ✓ Approuver
              </button>
            )}
            {showApprove && (
              <button onClick={() => handleDelete(u.id)} disabled={saving}
                style={{ background: 'rgba(220,50,50,.15)', border: '1px solid rgba(220,50,50,.3)', borderRadius: 6, padding: '5px 12px', color: '#f88', fontSize: 12, cursor: 'pointer' }}>
                ✗ Rejeter
              </button>
            )}
            {!showApprove && u.id !== 'admin' && (
              <>
                {/* Toggle rôle admin — seulement si pas le super-admin */}
                {u.role === 'admin' ? (
                  <button onClick={() => { if (confirm(`Retirer les droits admin à ${u.username} ?`)) patch(u.id, { role: 'user' }); }} disabled={saving}
                    title="Retirer les droits admin"
                    style={{ background: 'rgba(245,165,0,.15)', border: '1px solid rgba(245,165,0,.4)', borderRadius: 6, padding: '5px 10px', color: '#f5a500', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>
                    👑 Retirer admin
                  </button>
                ) : (
                  <button onClick={() => { if (confirm(`Passer ${u.username} en admin ? Il aura accès au panneau admin.`)) patch(u.id, { role: 'admin', status: 'active' }); }} disabled={saving}
                    title="Donner les droits admin"
                    style={{ background: 'rgba(245,165,0,.08)', border: '1px solid rgba(245,165,0,.2)', borderRadius: 6, padding: '5px 10px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>
                    👑 Admin
                  </button>
                )}
                {/* Suspendre/Réactiver — désactivé pour les admins */}
                {u.role !== 'admin' && ((u.status || 'active') === 'active' ? (
                  <button onClick={() => patch(u.id, { status: 'suspended' })} disabled={saving}
                    style={{ background: 'rgba(220,50,50,.1)', border: '1px solid rgba(220,50,50,.25)', borderRadius: 6, padding: '5px 10px', color: '#f88', fontSize: 11, cursor: 'pointer' }}>
                    Suspendre
                  </button>
                ) : (
                  <button onClick={() => patch(u.id, { status: 'active' })} disabled={saving}
                    style={{ background: 'rgba(60,200,100,.1)', border: '1px solid rgba(60,200,100,.25)', borderRadius: 6, padding: '5px 10px', color: '#4cd882', fontSize: 11, cursor: 'pointer' }}>
                    Réactiver
                  </button>
                ))}
                <button onClick={() => { setEditingId(editingId === u.id ? null : u.id); setEditPwd(''); }}
                  style={{ background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 10px', color: 'var(--text)', fontSize: 11, cursor: 'pointer' }}>
                  🔑 MDP
                </button>
                <button onClick={() => handleDelete(u.id)}
                  style={{ background: 'rgba(220,50,50,.12)', border: '1px solid rgba(220,50,50,.25)', borderRadius: 6, padding: '5px 10px', color: '#f88', fontSize: 11, cursor: 'pointer' }}>
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>

        {editingId === u.id && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="password" value={editPwd} onChange={e => setEditPwd(e.target.value)}
              placeholder="Nouveau mot de passe"
              style={{ flex: 1, padding: '7px 10px', background: 'var(--surface1)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, outline: 'none' }}
            />
            <button onClick={() => handleSavePwd(u.id)} disabled={saving || !editPwd.trim()}
              style={{ padding: '7px 14px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? '…' : 'OK'}
            </button>
            <button onClick={() => { setEditingId(null); setEditPwd(''); }}
              style={{ padding: '7px 10px', background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <ModalBackdrop onClose={onClose} zIndex={1000}>
      <div style={{ background: 'var(--surface1)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 580, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,.5)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 0', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>⚙️ Panneau Admin</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1, marginBottom: 12 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px', flexShrink: 0 }}>
          <button style={tabStyle('pending')} onClick={() => setTab('pending')}>
            En attente {pending.length > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', fontSize: 9, padding: '1px 5px', marginLeft: 4 }}>{pending.length}</span>}
          </button>
          <button style={tabStyle('active')} onClick={() => setTab('active')}>Actifs ({active.length})</button>
          <button style={tabStyle('suspended')} onClick={() => setTab('suspended')}>Suspendus ({suspended.length})</button>
          <button style={tabStyle('boards')} onClick={() => setTab('boards')}>Boards</button>
          <button style={tabStyle('create')} onClick={() => { setTab('create'); setCreateMsg(''); setCreateErr(''); }}>+ Créer</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Chargement…</p>}
          {error && <p style={{ color: '#f88', fontSize: 13 }}>{error}</p>}

          {!loading && tab === 'pending' && (
            pending.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 32 }}>Aucune demande en attente ✓</p>
              : pending.map(u => renderUser(u, true))
          )}
          {!loading && tab === 'active' && (
            active.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 32 }}>Aucun autre utilisateur actif</p>
              : active.map(u => renderUser(u, false))
          )}
          {!loading && tab === 'suspended' && (
            suspended.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 32 }}>Aucun utilisateur suspendu</p>
              : suspended.map(u => renderUser(u, false))
          )}

          {tab === 'create' && (
            <form onSubmit={handleCreateUser} style={{ maxWidth: 380, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 4px' }}>
                Crée un compte utilisateur actif directement. Le mot de passe peut être changé ensuite.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nom d'utilisateur *</label>
                <input value={createForm.username} onChange={e => setCreateForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="ex: john_doe" required minLength={3}
                  style={{ padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mot de passe *</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 caractères" required minLength={6}
                  style={{ padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Steam ID <span style={{ fontWeight: 400, textTransform: 'none' }}>(optionnel, 17 chiffres)</span></label>
                <input value={createForm.steamId} onChange={e => setCreateForm(f => ({ ...f, steamId: e.target.value }))}
                  placeholder="ex: 76561198012345678"
                  style={{ padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, outline: 'none' }} />
              </div>
              {createErr && <div style={{ background: 'rgba(220,50,50,.12)', border: '1px solid rgba(220,50,50,.3)', borderRadius: 7, padding: '8px 10px', color: '#f88', fontSize: 12 }}>{createErr}</div>}
              {createMsg && <div style={{ background: 'rgba(60,200,100,.1)', border: '1px solid rgba(60,200,100,.3)', borderRadius: 7, padding: '8px 10px', color: '#4cd882', fontSize: 12 }}>{createMsg}</div>}
              <button type="submit" disabled={creating}
                style={{ padding: '10px', background: 'var(--accent)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}>
                {creating ? 'Création…' : 'Créer le compte'}
              </button>
            </form>
          )}

          {tab === 'boards' && (
            boardsLoading
              ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Chargement…</p>
              : boardsError
                ? <p style={{ color: '#f88', fontSize: 13 }}>{boardsError}</p>
                : boards.length === 0
                  ? <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 32 }}>Aucun board</p>
                  : boards.map(b => (
                      <div key={`${b.ownerId}-${b.id}`} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Thumbnail */}
                        <div style={{ width: 52, height: 30, borderRadius: 5, overflow: 'hidden', flexShrink: 0, background: 'var(--surface1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {b.headerImg
                            ? <img src={b.headerImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 18 }}>{b.emoji}</span>
                          }
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{b.name}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, flexShrink: 0, color: b.public ? '#3db86a' : 'var(--text-muted)', border: `2px solid ${b.public ? '#3db86a' : 'var(--border)'}` }}>
                              {b.public ? 'Public' : 'Privé'}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            👤 {b.ownerUsername} · {b.gameCount} carte{b.gameCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteBoard(b.ownerId, b.id, b.name)}
                          style={{ background: 'rgba(220,50,50,.12)', border: '1px solid rgba(220,50,50,.25)', borderRadius: 6, padding: '5px 10px', color: '#f88', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
                        >
                          🗑 Supprimer
                        </button>
                      </div>
                    ))
          )}
        </div>
      </div>
    </ModalBackdrop>
  );
}
