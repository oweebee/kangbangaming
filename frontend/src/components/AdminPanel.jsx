import { useState, useEffect } from 'react';

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
          <div>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{u.username}</span>
            {' '}
            <StatusBadge status={u.role === 'admin' ? 'admin' : (u.status || 'active')} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}
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
                {(u.status || 'active') === 'active' ? (
                  <button onClick={() => patch(u.id, { status: 'suspended' })} disabled={saving}
                    style={{ background: 'rgba(220,50,50,.1)', border: '1px solid rgba(220,50,50,.25)', borderRadius: 6, padding: '5px 10px', color: '#f88', fontSize: 11, cursor: 'pointer' }}>
                    Suspendre
                  </button>
                ) : (
                  <button onClick={() => patch(u.id, { status: 'active' })} disabled={saving}
                    style={{ background: 'rgba(60,200,100,.1)', border: '1px solid rgba(60,200,100,.25)', borderRadius: 6, padding: '5px 10px', color: '#4cd882', fontSize: 11, cursor: 'pointer' }}>
                    Réactiver
                  </button>
                )}
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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
        </div>
      </div>
    </div>
  );
}
