import { useState, useEffect } from 'react';
import GameCard from './GameCard.jsx';

export default function PublicBoards({ token, currentUser, onClose }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [activeCol, setActiveCol] = useState({});

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
    const key = board.id;
    if (activeCol[key]) return activeCol[key];
    return board.columns?.[0]?.id || null;
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>🌐 Boards Publics</h2>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Boards partagés par la communauté</p>
        </div>
        <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Chargement…</p>}
        {!loading && boards.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🌐</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Aucun board public</div>
            <div style={{ fontSize: 13 }}>Quand un utilisateur rend son board public, il apparaîtra ici.</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {boards.map(board => {
            const isOpen = expanded === board.id;
            const curColId = getCurrentCol(board);
            const curGames = getColGames(board, curColId);

            return (
              <div key={board.id} style={{
                background: 'var(--surface1)', border: '1px solid var(--border)',
                borderRadius: 12, overflow: 'hidden',
                boxShadow: isOpen ? '0 8px 32px rgba(0,0,0,.4)' : 'none',
                transition: 'box-shadow .2s',
              }}>
                {/* Board header */}
                <div
                  onClick={() => setExpanded(isOpen ? null : board.id)}
                  style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  {board.gameIcon ? (
                    <img src={board.gameIcon} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
                  ) : board.emoji ? (
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{board.emoji}</span>
                  ) : (
                    <span style={{ fontSize: 22, flexShrink: 0 }}>🎮</span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{board.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      par <span style={{ color: board.isOwner ? 'var(--accent)' : 'var(--text-muted)', fontWeight: board.isOwner ? 700 : 400 }}>
                        {board.ownerUsername}{board.isOwner ? ' (vous)' : ''}
                      </span>
                      {' · '}{board.gameCount} jeu{board.gameCount !== 1 ? 'x' : ''}
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {/* Column tabs */}
                    {board.columns.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto', scrollbarWidth: 'none', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
                        {board.columns.map(col => {
                          const isActive = curColId === col.id;
                          const count = getColGames(board, col.id).length;
                          return (
                            <button
                              key={col.id}
                              onClick={() => setActiveCol(prev => ({ ...prev, [board.id]: col.id }))}
                              style={{
                                flexShrink: 0,
                                background: isActive ? 'var(--accent)' : 'var(--surface2)',
                                border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                                borderRadius: 20, padding: '4px 12px',
                                color: isActive ? '#fff' : 'var(--text-muted)',
                                fontSize: 11, fontWeight: isActive ? 700 : 400,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                              }}
                            >
                              {col.emoji && <span>{col.emoji}</span>}
                              {col.label}
                              <span style={{ background: isActive ? 'rgba(255,255,255,.25)' : 'var(--surface3)', borderRadius: 99, padding: '1px 5px', fontSize: 10 }}>{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Games list */}
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                      {curGames.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>Aucun jeu dans cette colonne</div>
                      ) : curGames.map(game => (
                        <GameCard
                          key={game.appid}
                          game={game}
                          onClick={() => {}}
                          onRemove={() => {}}
                          isDragging={false}
                          onDragStart={() => {}}
                          onDragEnd={() => {}}
                          readOnly
                        />
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
