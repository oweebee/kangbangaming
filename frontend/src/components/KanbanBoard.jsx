import { useState, useRef, useEffect } from 'react';
import GameCard from './GameCard.jsx';

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
          style={{ flex: 1, background: 'var(--surface3)', border: '1px solid var(--accent)', borderRadius: 5, padding: '3px 7px', color: 'var(--text)', fontSize: 12, fontWeight: 600, outline: 'none' }}
        />
      ) : (
        <span onDoubleClick={() => setEditing(true)} title="Double-clic pour renommer"
          style={{ flex: 1, fontWeight: 600, fontSize: 12, cursor: 'text', userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: col.color || 'var(--text)' }}
        >{col.label}</span>
      )}

      <span style={{ background: 'var(--surface3)', borderRadius: 99, padding: '1px 7px', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{col._count || 0}</span>

      <button onClick={() => onDelete(col.id)} title="Supprimer la colonne" style={{
        background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', opacity: 0.45, padding: '0 2px', flexShrink: 0,
      }}>✕</button>
    </div>
  );
}

export default function KanbanBoard({ columns, byColumn, dragging, setDragging, moveGame, onCardClick, onRemoveGame, onRenameColumn, onDeleteColumn, onSetEmoji, onReorderColumns }) {
  const [draggingColId, setDraggingColId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);

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
    <div style={{ display: 'flex', flex: 1, gap: '10px', padding: '14px', overflowX: 'auto', overflowY: 'hidden' }}>
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
              if (draggingColId) setDragOverColId(col.id);
              else e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={e => {
              e.preventDefault();
              if (draggingColId) { handleColDrop(col.id); }
              else {
                e.currentTarget.style.background = '';
                if (dragging && dragging.column !== col.id) moveGame(dragging.appid, col.id);
                setDragging(null);
              }
            }}
            onDragEnter={e => { if (!draggingColId) e.currentTarget.style.background = 'rgba(192,87,10,.07)'; }}
            onDragLeave={e => { if (!draggingColId) e.currentTarget.style.background = ''; }}
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
                  Glisse des jeux ici
                </div>
              )}
              {games.map(game => (
                <GameCard key={game.appid} game={game}
                  onDragStart={() => setDragging(game)} onDragEnd={() => setDragging(null)}
                  onClick={() => onCardClick(game)} onRemove={() => onRemoveGame(game.appid)}
                  isDragging={dragging?.appid === game.appid}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
