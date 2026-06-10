import { useState } from 'react';
import GameCard from './GameCard.jsx';

function ColumnHeader({ col, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(col.label);

  const commit = () => {
    const trimmed = label.trim();
    if (trimmed && trimmed !== col.label) onRename(col.id, trimmed);
    else setLabel(col.label);
    setEditing(false);
  };

  return (
    <div style={{
      padding: '10px 12px',
      borderBottom: `2px solid var(--accent)`,
      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
    }}>
      {editing ? (
        <input
          autoFocus value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setLabel(col.label); setEditing(false); } }}
          style={{
            flex: 1, background: 'var(--surface3)', border: '1px solid var(--accent)',
            borderRadius: 5, padding: '3px 7px', color: 'var(--text)', fontSize: 12,
            fontWeight: 600, outline: 'none',
          }}
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          title="Double-clic pour renommer"
          style={{ flex: 1, fontWeight: 600, fontSize: 12, cursor: 'text', userSelect: 'none' }}
        >{col.label}</span>
      )}
      <span style={{
        background: 'var(--surface3)', borderRadius: 99, padding: '1px 7px',
        fontSize: 11, color: 'var(--text-muted)', flexShrink: 0,
      }}>{col._count || 0}</span>
      <button
        onClick={() => onDelete(col.id)}
        title="Supprimer la colonne"
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', opacity: 0.5, padding: '0 2px', flexShrink: 0 }}
      >✕</button>
    </div>
  );
}

export default function KanbanBoard({ columns, byColumn, dragging, setDragging, moveGame, onCardClick, onRemoveGame, onRenameColumn, onDeleteColumn }) {

  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    e.currentTarget.style.background = '';
    if (dragging && dragging.column !== colId) moveGame(dragging.appid, colId);
    setDragging(null);
  };

  return (
    <div style={{
      display: 'flex', flex: 1, gap: '10px', padding: '14px',
      overflowX: 'auto', overflowY: 'hidden',
    }}>
      {columns.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Ajoute une colonne pour commencer
        </div>
      )}

      {columns.map(col => {
        const games = byColumn[col.id] || [];
        const colWithCount = { ...col, _count: games.length };

        return (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, col.id)}
            onDragEnter={e => { e.currentTarget.style.background = 'rgba(192,87,10,.06)'; }}
            onDragLeave={e => { e.currentTarget.style.background = ''; }}
            style={{
              flex: '1 1 0', minWidth: 210, maxWidth: 300,
              display: 'flex', flexDirection: 'column',
              background: 'var(--surface)', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', overflow: 'hidden',
              transition: 'background .15s',
            }}
          >
            <ColumnHeader col={colWithCount} onRename={onRenameColumn} onDelete={onDeleteColumn} />

            <div style={{
              flex: 1, overflowY: 'auto', padding: '8px',
              display: 'flex', flexDirection: 'column', gap: '7px',
            }}>
              {games.length === 0 && (
                <div style={{
                  textAlign: 'center', color: 'var(--text-muted)', fontSize: 11,
                  padding: '20px 8px', border: '1px dashed var(--border)', borderRadius: 7,
                }}>Glisse des jeux ici</div>
              )}
              {games.map(game => (
                <GameCard
                  key={game.appid} game={game}
                  onDragStart={() => setDragging(game)}
                  onDragEnd={() => setDragging(null)}
                  onClick={() => onCardClick(game)}
                  onRemove={() => onRemoveGame(game.appid)}
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
