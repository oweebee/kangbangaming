import { useState } from 'react';
import { getTaskType } from '../taskTypes.jsx';

function formatPlaytime(minutes) {
  if (!minutes || minutes === 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function GameCard({ game, onDragStart, onDragEnd, onClick, onRemove, isDragging, readOnly }) {
  const [imgError, setImgError] = useState(false);
  const isCustom = game.type === 'custom';
  const tt = game.taskType ? getTaskType(game.taskType) : null;
  const TtIcon = tt?.Icon;

  return (
    <div
      draggable={!readOnly}
      onDragStart={readOnly ? undefined : e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={readOnly ? undefined : onDragEnd}
      onClick={readOnly ? undefined : onClick}
      style={{
        background: tt ? tt.bg : 'var(--surface2)',
        border: tt ? `1.5px solid ${tt.border}` : '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: readOnly ? 'default' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s, transform 0.15s, box-shadow 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={readOnly ? undefined : e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.4)`;
        e.currentTarget.style.borderColor = tt ? tt.border : '#444';
      }}
      onMouseLeave={readOnly ? undefined : e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = tt ? tt.border : 'var(--border)';
      }}
    >
      {/* Image area */}
      {isCustom && tt ? (
        /* Task-typed card — illustration + badge */
        <div style={{
          width: '100%', height: 88, position: 'relative',
          background: tt.imgBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <TtIcon />
          <div style={{
            position: 'absolute', bottom: 4, left: 5,
            background: tt.badgeBg, color: tt.badgeText,
            fontSize: 8, fontWeight: 700, padding: '2px 6px',
            borderRadius: 4, letterSpacing: '0.04em',
          }}>{tt.label.toUpperCase()}</div>
        </div>
      ) : isCustom ? (
        <div style={{
          width: '100%', height: 88,
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42,
        }}>{game.emoji || '🎮'}</div>
      ) : !imgError && game.header_img ? (
        <img
          src={game.header_img}
          alt={game.name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: 88, objectFit: 'cover', display: 'block' }}
          draggable={false}
        />
      ) : (
        <div style={{
          width: '100%', height: 88,
          background: 'var(--steam)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>🎮</div>
      )}

      <div style={{ padding: '8px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          <div style={{
            fontWeight: 600, fontSize: 12, lineHeight: '1.3', marginBottom: 4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
          }} title={game.name}>{game.name}</div>
          {!readOnly && (
            <button
              onClick={e => { e.stopPropagation(); onRemove(); }}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                fontSize: 14, cursor: 'pointer', opacity: 0.5, padding: '0 0 0 4px',
                lineHeight: 1, flexShrink: 0,
              }}
              title="Retirer du board"
            >✕</button>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          {isCustom
            ? <span style={{ color: tt ? tt.textColor : 'var(--accent)', opacity: 0.8 }}>
                {tt ? `${tt.emoji} ${tt.label}` : 'Carte perso'}
              </span>
            : formatPlaytime(game.playtime_minutes)
          }
        </div>
      </div>
    </div>
  );
}
