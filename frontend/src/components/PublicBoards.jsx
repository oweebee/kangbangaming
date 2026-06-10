import { useState, useEffect } from 'react';
import GameCard from './GameCard.jsx';

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
  const [expanded, setExpanded] = useState(null);
  const [activeCol, setActiveCol] = useState({});
  const [toggling, setToggling] = useState(new Set());

  useEffect(() => {
    fetch('/api/public/boards', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { setBoards(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  function getColGames(board, colId) {
    return (board.games || []).filter(g => g.column === colId);
  }

  function getCurrentCol(board) {
    if (activeCol[board.id]) return activeCol[board.id];
    return board.columns?.[0]?.id || null;
  }

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
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="7" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M15 3.13a4 4 0 0 1 0 7.75"/><path d="M20 21v-2a4 4 0 0 0-3-3.85"/>
        </svg>
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Boards Publics</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Boards partagés par la communauté</span>
        <button onClick={onClose} title="Fermer" style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
      </div>

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
            const isOpen = expanded === board.id;
            const curColId = getCurrentCol(board);
            const curGames = getColGames(board, curColId);
            const isFav = favBoardIds.has(board.id);

            return (
              <div key={board.id} style={{
                background: 'var(--surface1)', border: isFav ? '1px solid rgba(232,129,58,.4)' : '1px solid var(--border)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                {/* Board header */}
                <div
                  onClick={() => setExpanded(isOpen ? null : board.id)}
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
                  <span style={{ color: 'var(--text-muted)', fontSize: 11, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {/* Action bar — always visible */}
                <div style={{ display: 'flex', gap: 6, padding: '0 12px 10px', alignItems: 'center' }}>
                  {onOpenBoard && (
                    <button
                      onClick={() => onOpenBoard({ id: board.id, name: board.name, ownerUsername: board.ownerUsername })}
                      style={{ flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '5px 0', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                    >
                      ▶ Ouvrir en collab
                    </button>
                  )}
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

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {board.columns.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '1px solid var(--border)' }}>
                        {board.columns.map(col => {
                          const isActive = curColId === col.id;
                          const count = getColGames(board, col.id).length;
                          return (
                            <button key={col.id}
                              onClick={() => setActiveCol(prev => ({ ...prev, [board.id]: col.id }))}
                              style={{ flexShrink: 0, background: isActive ? 'var(--accent)' : 'var(--surface2)', border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)', borderRadius: 20, padding: '3px 10px', color: isActive ? '#fff' : 'var(--text-muted)', fontSize: 11, fontWeight: isActive ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              {col.emoji && <span>{col.emoji}</span>}
                              {col.label}
                              <span style={{ background: isActive ? 'rgba(255,255,255,.25)' : 'var(--surface3)', borderRadius: 99, padding: '1px 5px', fontSize: 10 }}>{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
                      {curGames.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '16px 0' }}>Aucun jeu dans cette colonne</div>
                      ) : curGames.map(game => (
                        <GameCard key={game.appid} game={game} onClick={() => {}} onRemove={() => {}} isDragging={false} onDragStart={() => {}} onDragEnd={() => {}} readOnly />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
