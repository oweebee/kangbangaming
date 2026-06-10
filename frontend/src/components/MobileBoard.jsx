import { useState } from 'react';
import GameCard from './GameCard.jsx';

export default function MobileBoard({ columns, byColumn, onCardClick, onRemoveGame }) {
  const [activeColId, setActiveColId] = useState(columns[0]?.id || null);

  // Si la colonne active a disparu (ex: supprimée), prendre la première
  const currentColId = columns.find(c => c.id === activeColId)?.id || columns[0]?.id || null;
  const games = byColumn[currentColId] || [];

  if (columns.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        Ajoute une colonne pour commencer
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Tabs colonnes */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 12px',
        overflowX: 'auto', flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        scrollbarWidth: 'none',
      }}>
        {columns.map(col => {
          const active = col.id === currentColId;
          const count = (byColumn[col.id] || []).length;
          return (
            <button
              key={col.id}
              onClick={() => setActiveColId(col.id)}
              style={{
                flexShrink: 0,
                background: active ? 'var(--accent)' : 'var(--surface2)',
                border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 20,
                padding: '6px 14px',
                color: active ? '#fff' : 'var(--text-muted)',
                fontSize: 12, fontWeight: active ? 700 : 400,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all .15s',
              }}
            >
              {col.emoji && <span style={{ fontSize: 14 }}>{col.emoji}</span>}
              {col.label}
              <span style={{
                background: active ? 'rgba(255,255,255,.25)' : 'var(--surface3)',
                borderRadius: 99, padding: '1px 6px', fontSize: 10,
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Liste de jeux */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {games.length === 0 && (
          <div style={{
            textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
            padding: '40px 20px', border: '1px dashed var(--border)', borderRadius: 10,
          }}>Aucun jeu dans cette colonne</div>
        )}
        {games.map(game => (
          <GameCard
            key={game.appid}
            game={game}
            onClick={() => onCardClick(game)}
            onRemove={() => onRemoveGame(game.appid)}
            isDragging={false}
            onDragStart={() => {}}
            onDragEnd={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
