import { useState, useRef, useEffect } from 'react';
import GameCard from './GameCard.jsx';
import AssigneeAvatars from './AssigneeAvatars.jsx';
import { getTaskType } from '../taskTypes.jsx';

const EMOJIS = [
  '🎮','🕹️','🏆','🥇','⭐','💎','🔥','❄️','⚡','🎯',
  '📦','🚀','💀','👾','🛡️','⚔️','🗡️','🧩','🎲','🃏',
  '✅','⏳','🔒','🔓','💤','👀','🧠','💪','🎪','🌟',
  '📋','📌','🔖','🏁','🚩','💬','🎵','🎬','📺','🖥️',
];

function EmojiPicker({ current, onSelect, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} style={{
      position: 'absolute', top: '100%', left: 0, zIndex: 50,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 8, marginTop: 4,
      display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2,
      boxShadow: '0 8px 24px rgba(0,0,0,.5)',
    }}>
      <button onClick={() => onSelect('')} title="Aucun" style={{
        background: current === '' ? 'var(--accent-dim)' : 'none',
        border: current === '' ? '1px solid var(--accent)' : '1px solid transparent',
        borderRadius: 5, width: 30, height: 30, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer',
      }}>✕</button>
      {EMOJIS.map(e => (
        <button key={e} onClick={() => onSelect(e)} style={{
          background: current === e ? 'var(--accent-dim)' : 'none',
          border: current === e ? '1px solid var(--accent)' : '1px solid transparent',
          borderRadius: 5, width: 30, height: 30, fontSize: 16,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{e}</button>
      ))}
    </div>
  );
}

function ColumnHeader({ col, onRename, onDelete, onSetEmoji, onColDragStart, onColDragEnd, isDragOver }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(col.label);
  const [showEmoji, setShowEmoji] = useState(false);

  const commit = () => {
    const trimmed = label.trim();
    if (trimmed && trimmed !== col.label) onRename(col.id, trimmed);
    else setLabel(col.label);
    setEditing(false);
  };

  return (
    <div style={{
      padding: '10px 10px 10px 8px',
      borderBottom: isDragOver ? '2px solid #3db86a' : '2px solid var(--accent)',
      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
      position: 'relative', transition: 'border-color .15s',
    }}>
      <div
        draggable
        onDragStart={e => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; onColDragStart(col.id); }}
        onDragEnd={onColDragEnd}
        title="Deplacer la colonne"
        style={{ cursor: 'grab', color: 'var(--text-muted)', opacity: 0.35, fontSize: 14, lineHeight: 1, flexShrink: 0, padding: '0 2px', userSelect: 'none' }}
      >⠇</div>

      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowEmoji(v => !v)} title="Choisir un emoji" style={{
          background: col.emoji ? 'transparent' : 'var(--surface3)',
          border: '1px solid var(--border)', borderRadius: 5,
          width: 26, height: 26, fontSize: col.emoji ? 16 : 11,
          cursor: 'pointer', color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{col.emoji || '+'}</button>
        {showEmoji && (
          <EmojiPicker current={col.emoji || ''} onSelect={e => { onSetEmoji(col.id, e); setShowEmoji(false); }} onClose={() => setShowEmoji(false)} />
        )}
      </div>

      {editing ? (
        <input autoFocus value={label}
          onChange={e => setLabel(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setLabel(col.label); setEditing(false); } }}
          style={{ flex: 1, background: 'var(--surface3)', border: '1px solid var(--accent)', borderRadius: 5, padding: '3px 7px', color: 'var(--text)', fontSize: 13, fontWeight: 700, outline: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' }}
        />
      ) : (
        <span onDoubleClick={() => setEditing(true)} title="Double-clic pour renommer"
          style={{ flex: 1, fontWeight: 700, fontSize: 13, letterSpacing: '0.07em', textTransform: 'uppercase', cursor: 'text', userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: col.color || 'var(--text)' }}
        >{col.label}</span>
      )}

      <span style={{ background: 'var(--surface3)', borderRadius: 99, padding: '1px 7px', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{col._count || 0}</span>

      <button onClick={() => onDelete(col.id)} title="Supprimer la colonne" style={{
        background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', opacity: 0.45, padding: '0 2px', flexShrink: 0,
      }}>✕</button>
    </div>
  );
}

export default function KanbanBoard({ columns, byColumn, dragging, setDragging, moveGame, onCardClick, onArchiveGame, onUnarchiveGame, onDeleteGame, onEditGame, onRenameColumn, onDeleteColumn, onSetEmoji, onReorderColumns, onAddToColumn, onReorderGames, isTaskBoard, appUsers = [], compactView = false, leftOffset = 0, rightOffset = 0 }) {
  const [draggingColId, setDraggingColId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);
  const [dragInsert, setDragInsert] = useState(null); // { colId, beforeAppid: string|null }

  const handleColDragStart = (colId) => setDraggingColId(colId);
  const handleColDragEnd   = () => { setDraggingColId(null); setDragOverColId(null); };

  const handleColDrop = (targetColId) => {
    if (!draggingColId || draggingColId === targetColId) { handleColDragEnd(); return; }
    const newOrder = [...columns];
    const fromIdx = newOrder.findIndex(c => c.id === draggingColId);
    const toIdx   = newOrder.findIndex(c => c.id === targetColId);
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    onReorderColumns(newOrder.map(c => c.id));
    handleColDragEnd();
  };

  return (
    <div style={{ display: 'flex', flex: 1, gap: '10px', padding: '14px', paddingLeft: 14 + leftOffset, paddingRight: 14 + rightOffset, overflowX: 'auto', overflowY: 'hidden', transition: 'padding-left 0.32s cubic-bezier(0.4,0,0.2,1), padding-right 0.32s cubic-bezier(0.4,0,0.2,1)' }}>
      {columns.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Ajoute une colonne pour commencer
        </div>
      )}
      {columns.map(col => {
        const games = byColumn[col.id] || [];
        const isColDragOver = dragOverColId === col.id && draggingColId && draggingColId !== col.id;
        return (
          <div key={col.id}
            onDragOver={e => {
              e.preventDefault();
              if (draggingColId) { setDragOverColId(col.id); return; }
              e.dataTransfer.dropEffect = 'move';
              // Only fires when over empty column area (card wrappers use stopPropagation)
              if (!dragInsert || dragInsert.colId !== col.id || dragInsert.beforeAppid !== null) {
                setDragInsert({ colId: col.id, beforeAppid: null });
              }
            }}
            onDrop={e => {
              e.preventDefault();
              if (draggingColId) { handleColDrop(col.id); return; }
              e.currentTarget.style.background = '';
              if (dragging) {
                if (dragInsert?.colId === col.id) {
                  // Reorder within same column OR cross-column with specific position
                  const colGames = byColumn[col.id] || [];
                  const newOrder = colGames.map(g => g.appid).filter(id => id !== dragging.appid);
                  const insertIdx = dragInsert.beforeAppid
                    ? newOrder.indexOf(dragInsert.beforeAppid)
                    : newOrder.length;
                  newOrder.splice(insertIdx < 0 ? newOrder.length : insertIdx, 0, dragging.appid);
                  onReorderGames(col.id, newOrder);
                } else if (dragging.column !== col.id) {
                  moveGame(dragging.appid, col.id);
                }
                setDragging(null);
                setDragInsert(null);
              }
            }}
            onDragEnter={e => { if (!draggingColId) e.currentTarget.style.background = 'rgba(192,87,10,.07)'; }}
            onDragLeave={e => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                if (!draggingColId) e.currentTarget.style.background = '';
                setDragInsert(null);
              }
            }}
            style={{
              flex: '1 1 0', minWidth: 210, maxWidth: 300,
              display: 'flex', flexDirection: 'column',
              background: 'var(--surface)', borderRadius: 'var(--radius)',
              border: isColDragOver ? '1px solid #3db86a' : '1px solid var(--border)',
              overflow: 'hidden', transition: 'background .15s, border-color .15s',
              opacity: draggingColId === col.id ? 0.45 : 1,
            }}
          >
            <ColumnHeader
              col={{ ...col, _count: games.length }}
              onRename={onRenameColumn} onDelete={onDeleteColumn} onSetEmoji={onSetEmoji}
              onColDragStart={handleColDragStart} onColDragEnd={handleColDragEnd}
              isDragOver={isColDragOver}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {games.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, padding: '20px 8px', border: '1px dashed var(--border)', borderRadius: 7 }}>
                  {isTaskBoard ? 'Glisse une tâche ici' : 'Glisse des jeux ici'}
                </div>
              )}
              {games.map((game, idx) => {
                const hasAssignees = isTaskBoard && appUsers.length > 0 && game.assignees?.length > 0;
                const tt = game.taskType ? getTaskType(game.taskType) : null;
                const cardBorderColor = game.urgent ? 'rgba(220,60,60,0.6)' : tt ? tt.border : 'var(--border)';
                return (
                  <div
                    key={game.appid}
                    style={{ position: 'relative', paddingTop: hasAssignees && !compactView ? 40 : 0 }}
                    onDragOver={e => {
                      if (draggingColId || !dragging || dragging.appid === game.appid) return;
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const isTopHalf = e.clientY < rect.top + rect.height / 2;
                      const beforeAppid = isTopHalf ? game.appid : (games[idx + 1]?.appid ?? null);
                      if (dragInsert?.colId !== col.id || dragInsert?.beforeAppid !== beforeAppid) {
                        setDragInsert({ colId: col.id, beforeAppid });
                      }
                    }}
                  >
                    {dragInsert?.colId === col.id && dragInsert?.beforeAppid === game.appid && (
                      <div style={{ height: 3, background: 'var(--accent)', borderRadius: 3, margin: '0 2px 4px', opacity: 0.85 }} />
                    )}
                    {hasAssignees && !compactView && (
                      <AssigneeAvatars
                        assignees={game.assignees}
                        appUsers={appUsers}
                        size={44}
                        borderColor={cardBorderColor}
                      />
                    )}
                    <GameCard game={game}
                      onDragStart={() => setDragging(game)}
                      onDragEnd={() => { setDragging(null); setDragInsert(null); }}
                      onClick={() => onCardClick(game)}
                      onArchive={() => onArchiveGame(game.appid)}
                      onUnarchive={() => onUnarchiveGame(game.appid)}
                      onDelete={() => onDeleteGame(game.appid)}
                      onEdit={onEditGame}
                      isDragging={dragging?.appid === game.appid}
                      isTaskBoard={isTaskBoard}
                      compact={compactView}
                      assignees={game.assignees}
                      appUsers={appUsers}
                    />
                  </div>
                );
              })}
              {dragInsert?.colId === col.id && dragInsert?.beforeAppid === null && (
                <div style={{ height: 3, background: 'var(--accent)', borderRadius: 3, margin: '4px 2px 0', opacity: 0.85 }} />
              )}
              {onAddToColumn && (
                <button
                  onClick={() => onAddToColumn(col.id)}
                  style={{
                    width: '100%', background: 'none',
                    border: '1px dashed rgba(255,255,255,0.12)',
                    borderRadius: 7, padding: '7px 8px',
                    color: 'var(--text-muted)', fontSize: 11,
                    cursor: 'pointer', textAlign: 'center',
                    opacity: 0.6, transition: 'opacity .15s, border-color .15s',
                    marginTop: games.length > 0 ? 2 : 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = 0.6; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  + {isTaskBoard ? 'Ajouter une tâche' : 'Ajouter une tâche / Un jeu'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
