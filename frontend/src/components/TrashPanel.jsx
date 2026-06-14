import { useState, useEffect } from 'react';
import { useLang } from '../i18n.js';

const API = '/api';

function formatDate(isoStr) {
  if (!isoStr) return '';
  try {
    return new Date(isoStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

// Composant réutilisable pour user (isAdmin=false) et admin (isAdmin=true).
// isAdmin=true : affiche le champ username + utilise les endpoints /api/admin/trash
export default function TrashPanel({ token, isAdmin = false }) {
  const { t } = useLang();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [acting, setActing]   = useState(new Set()); // noteIds en cours d'action

  const baseUrl = isAdmin ? `${API}/admin/trash` : `${API}/trash/notes`;

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(baseUrl, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setItems(await res.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [token, isAdmin]);

  async function act(noteId, fn) {
    setActing(prev => new Set([...prev, noteId]));
    await fn();
    setActing(prev => { const s = new Set(prev); s.delete(noteId); return s; });
    load();
  }

  async function restore(item) {
    const url  = isAdmin ? `${API}/admin/trash/restore` : `${API}/trash/notes/restore`;
    const body = isAdmin
      ? { userId: item.userId, boardId: item.boardId, gameId: item.gameId, noteId: item.id }
      : { boardId: item.boardId, gameId: item.gameId, noteId: item.id };
    act(item.id, () => fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  }

  async function permDelete(item) {
    if (!window.confirm(t('trash.confirm_perm_delete'))) return;
    const url  = isAdmin ? `${API}/admin/trash/item` : `${API}/trash/notes/item`;
    const body = isAdmin
      ? { userId: item.userId, boardId: item.boardId, gameId: item.gameId, noteId: item.id }
      : { boardId: item.boardId, gameId: item.gameId, noteId: item.id };
    act(item.id, () => fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
  }

  async function purgeAll() {
    if (!window.confirm(t('trash.confirm_purge'))) return;
    setPurging(true);
    await fetch(baseUrl, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setPurging(false);
    setItems([]);
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
      {t('common.loading')}
    </div>
  );

  if (items.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>
        {t('trash.empty_title')}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {t('trash.empty_desc')}
      </div>
    </div>
  );

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {t('trash.count', { count: items.length })}
        </div>
        <button
          onClick={purgeAll}
          disabled={purging}
          style={{
            background: 'rgba(192,80,80,0.1)', border: '1px solid rgba(192,80,80,0.4)',
            borderRadius: 7, padding: '5px 12px', cursor: purging ? 'not-allowed' : 'pointer',
            color: '#d07070', fontSize: 11, fontWeight: 600,
            opacity: purging ? 0.6 : 1,
          }}
        >
          {purging ? '…' : t('trash.purge_btn')}
        </button>
      </div>

      {/* Liste des notes supprimées */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => {
          const busy = acting.has(item.id);
          const urgent = item.daysLeft <= 3;
          return (
            <div key={item.id + (item.userId || '')} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '11px 13px',
              borderLeft: `3px solid ${urgent ? '#d07070' : 'rgba(192,80,80,0.45)'}`,
              opacity: busy ? 0.55 : 1, transition: 'opacity .15s',
            }}>
              {/* Contexte : user (admin) + board + jeu */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7, minWidth: 0 }}>
                {item.gameIcon && (
                  <img src={item.gameIcon} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                  {isAdmin && item.username && (
                    <><span style={{ color: 'var(--accent)', fontWeight: 700 }}>@{item.username}</span> · </>
                  )}
                  {item.boardName} · {item.gameName}
                </span>
                {/* Jours restants */}
                <span style={{
                  flexShrink: 0, fontSize: 10, fontWeight: urgent ? 700 : 400,
                  color: urgent ? '#d07070' : 'var(--text-muted)',
                }}>
                  {t('trash.days_left', { days: item.daysLeft })}
                </span>
              </div>

              {/* Texte de la note */}
              <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55, marginBottom: 8, wordBreak: 'break-word' }}>
                {item.text.length > 220 ? item.text.slice(0, 220) + '…' : item.text}
              </div>

              {/* Footer : date + actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', flex: 1 }}>
                  {t('trash.deleted_on')} {formatDate(item.deletedAt)}
                  {item.createdAt && (
                    <span style={{ marginLeft: 6, opacity: 0.6 }}>· {t('trash.created_on')} {formatDate(item.createdAt)}</span>
                  )}
                </span>
                <button
                  onClick={() => restore(item)}
                  disabled={busy}
                  style={{
                    background: 'rgba(61,184,106,0.1)', border: '1px solid rgba(61,184,106,0.4)',
                    borderRadius: 6, padding: '4px 10px', cursor: busy ? 'not-allowed' : 'pointer',
                    color: '#3db86a', fontSize: 11, fontWeight: 600, flexShrink: 0,
                  }}
                >
                  {t('trash.restore')}
                </button>
                <button
                  onClick={() => permDelete(item)}
                  disabled={busy}
                  style={{
                    background: 'rgba(192,80,80,0.08)', border: '1px solid rgba(192,80,80,0.3)',
                    borderRadius: 6, padding: '4px 10px', cursor: busy ? 'not-allowed' : 'pointer',
                    color: '#d07070', fontSize: 11, fontWeight: 600, flexShrink: 0,
                  }}
                >
                  {t('trash.perm_delete')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
