import { useState, useEffect } from 'react';

function StarIcon({ filled, size = 14 }) {
  return filled ? (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}

export default function PublicBoards({ token, currentUser, favBoardIds = new Set(), onToggleFavorite, onOpenBoard, onClose }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(new Set());

  useEffect(() => {
    fetch('/api/public/boards', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setBoards(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  async function handleFavorite(e, board) {
    e.stopPropagation();
    if (toggling.has(board.id)) return;
    setToggling(prev => new Set([...prev, board.id]));
    const isFav = favBoardIds.has(board.id);
    await onToggleFavorite(board.id, board, isFav);
    setToggling(prev => { const s = new Set(prev); s.delete(board.id); return s; });
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Chargement…</p>}
        {!loading && boards.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 12px' }}>
              <circle cx="10" cy="7" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M15 3.13a4 4 0 0 1 0 7.75"/><path d="M20 21v-2a4 4 0 0 0-3-3.85"/>
            </svg>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Aucun board public</div>
            <div style={{ fontSize: 13 }}>Quand un utilisateur rend son board public, il apparaîtra ici.</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {boards.map(board => {
            const isFav = favBoardIds.has(board.id);

            return (
              <div key={board.id} style={{
                background: 'var(--surface1)', border: isFav ? '1px solid rgba(232,129,58,.4)' : '1px solid var(--border)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {/* Board header */}
                <div
                  onClick={() => onOpenBoard(board)}
                  style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  {board.gameIcon ? (
                    <img src={board.gameIcon} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                  ) : (
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{board.emoji || '🎮'}</span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{board.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      par <span style={{ color: board.isOwner ? 'var(--accent)' : 'var(--text-muted)', fontWeight: board.isOwner ? 700 : 400 }}>
                        {board.ownerUsername}{board.isOwner ? ' (vous)' : ''}
                      </span>
                      {' · '}{board.gameCount} jeu{board.gameCount !== 1 ? 'x' : ''}
                    </div>
                  </div>
                </div>
                {/* Action bar */}
                <div style={{ display: 'flex', gap: 6, padding: '0 12px 10px', alignItems: 'center' }}>
                  <button
                    onClick={() => onOpenBoard(board)}
                    style={{ flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '5px 0', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    ▶ Afficher
                  </button>
                  {!board.isOwner && (
                    <button
                      onClick={e => handleFavorite(e, board)}
                      disabled={toggling.has(board.id)}
                      style={{
                        background: isFav ? 'rgba(232,129,58,.15)' : 'var(--surface2)',
                        border: isFav ? '1px solid rgba(232,129,58,.5)' : '1px solid var(--border)',
                        borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
                        color: isFav ? 'var(--accent)' : 'var(--text-muted)',
                        fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                        opacity: toggling.has(board.id) ? 0.5 : 1, flexShrink: 0,
                      }}
                    >
                      <StarIcon filled={isFav} size={13} />
                      {isFav ? 'Favori' : '+ Favori'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
