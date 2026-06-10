import { useState } from 'react';

function formatPlaytime(minutes) {
  if (minutes === 0) return 'Jamais joué';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function GameCard({ game, onDragStart, onDragEnd, onClick, isDragging }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: 'grab',
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s, transform 0.15s, box-shadow 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = '#444';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Header image */}
      {!imgError ? (
        <img
          src={game.header_img}
          alt={game.name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: 70, objectFit: 'cover', display: 'block' }}
          draggable={false}
        />
      ) : (
        <div style={{
          width: '100%',
          height: 70,
          background: 'var(--steam)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
        }}>🎮</div>
      )}

      {/* Info */}
      <div style={{ padding: '8px 10px' }}>
        <div style={{
          fontWeight: 600,
          fontSize: 12,
          lineHeight: '1.3',
          marginBottom: 6,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }} title={game.name}>
          {game.name}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 11 }}>
          <span>⏱ {formatPlaytime(game.playtime_minutes)}</span>
        </div>
      </div>
    </div>
  );
}
