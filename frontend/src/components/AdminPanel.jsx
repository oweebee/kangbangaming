import { useState, useEffect } from 'react';

export default function AdminPanel({ token, currentUser, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editPwd, setEditPwd] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [saving, setSaving] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erreur chargement');
      setUsers(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleDelete(id) {
    if (!confirm('Supprimer cet utilisateur et tous ses boards ?')) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) fetchUsers();
  }

  async function handleSave(id) {
    setSaving(true);
    const body = {};
    if (editPwd.trim()) body.password = editPwd.trim();
    if (id !== 'admin') body.role = editRole;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) { setEditingId(null); setEditPwd(''); fetchUsers(); }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--surface1)', border: '1px solid var(--border)',
        borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,.5)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>⚙️ Panneau Admin — Utilisateurs</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Chargement…</p>}
          {error && <p style={{ color: '#f88', fontSize: 13 }}>{error}</p>}
          {!loading && users.map(u => (
            <div key={u.id} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{u.username}</span>
                  {' '}
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                    fontSize: 10, fontWeight: 700,
                    background: u.role === 'admin' ? 'rgba(245,165,0,.2)' : 'rgba(100,100,200,.2)',
                    color: u.role === 'admin' ? '#f5a500' : 'var(--accent)',
                    textTransform: 'uppercase',
                  }}>{u.role}</span>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                    Créé le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                {u.id !== currentUser.id && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => { setEditingId(editingId === u.id ? null : u.id); setEditPwd(''); setEditRole(u.role); }}
                      style={{ background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 12px', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}
                    >Modifier</button>
                    {u.id !== 'admin' && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        style={{ background: 'rgba(220,50,50,.15)', border: '1px solid rgba(220,50,50,.3)', borderRadius: 6, padding: '5px 12px', color: '#f88', fontSize: 12, cursor: 'pointer' }}
                      >Supprimer</button>
                    )}
                  </div>
                )}
              </div>

              {/* Inline edit form */}
              {editingId === u.id && (
                <div style={{ marginTop: 12, padding: '12px', background: 'var(--surface1)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nouveau mot de passe (laisser vide = inchangé)</label>
                    <input
                      type="password" value={editPwd} onChange={e => setEditPwd(e.target.value)}
                      placeholder="Nouveau mot de passe"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                  {u.id !== 'admin' && (
                    <div>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Rôle</label>
                      <select
                        value={editRole} onChange={e => setEditRole(e.target.value)}
                        style={{ padding: '7px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 13, outline: 'none' }}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleSave(u.id)} disabled={saving}
                      style={{ padding: '6px 16px', background: 'var(--accent)', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >{saving ? 'Sauvegarde…' : 'Sauvegarder'}</button>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{ padding: '6px 16px', background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
                    >Annuler</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
