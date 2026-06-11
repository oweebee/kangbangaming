import { useState } from 'react';
import { getTaskType } from '../taskTypes.jsx';
import { getDateInfo } from './TaskModal.jsx';
import { progressColor } from './ProgressSlider.jsx';

function formatPlaytime(minutes) {
  if (!minutes || minutes === 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function GameCard({ game, onDragStart, onDragEnd, onClick, onArchive, onUnarchive, onDelete, onEdit, isDragging, readOnly, isTaskBoard }) {
  const [imgError, setImgError] = useState(false);
  const isCustom   = game.type === 'custom';
  const isArchived = !!game.archived;
  const isUrgent   = !!game.urgent;
  const tt         = game.taskType ? getTaskType(game.taskType) : null;
  const TtIcon    = tt?.Icon;
  const dateInfo  = getDateInfo(game);

  return (
    <div
      draggable={!readOnly && !isArchived}
      onDragStart={readOnly || isArchived ? undefined : e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={readOnly || isArchived ? undefined : onDragEnd}
      onClick={readOnly || isArchived ? undefined : onClick}
      style={{
        background: isArchived ? 'var(--surface2)' : tt ? tt.bg : 'var(--surface2)',
        border: isArchived ? '1px solid rgba(120,120,120,0.3)' : isUrgent ? '1.5px solid rgba(220,60,60,0.6)' : tt ? `1.5px solid ${tt.border}` : '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: readOnly || isArchived ? 'default' : 'grab',
        opacity: isDragging ? 0.4 : isArchived ? 0.6 : 1,
        transition: 'opacity 0.15s, transform 0.15s, box-shadow 0.15s',
        userSelect: 'none',
        filter: isArchived ? 'saturate(0.3)' : 'none',
      }}
      onMouseEnter={readOnly || isArchived ? undefined : e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = isUrgent ? 'rgba(220,60,60,0.8)' : tt ? tt.border : '#444';
      }}
      onMouseLeave={readOnly || isArchived ? undefined : e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = isUrgent ? 'rgba(220,60,60,0.6)' : tt ? tt.border : 'var(--border)';
      }}
    >
      {/* ── Image area ── */}
      {isCustom && tt ? (
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
          {isUrgent && !isArchived && (
            <div style={{
              position: 'absolute', top: 5, right: 5,
              background: 'rgba(200,30,30,0.9)', color: '#fff',
              fontSize: 11, fontWeight: 900, padding: '2px 7px',
              borderRadius: 4, letterSpacing: '0.02em',
              boxShadow: '0 0 8px rgba(220,40,40,0.5)',
            }}>!</div>
          )}
          {isArchived && (
            <div style={{
              position: 'absolute', top: 5, right: 5,
              background: 'rgba(60,60,60,0.9)', color: '#aaa',
              fontSize: 8, fontWeight: 700, padding: '2px 6px',
              borderRadius: 4, letterSpacing: '0.06em',
            }}>ARCHIVÉ</div>
          )}
        </div>
      ) : isCustom ? (
        <div style={{
          width: '100%', height: 88, position: 'relative',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42,
        }}>
          {game.emoji || '🎮'}
          {isUrgent && !isArchived && (
            <div style={{
              position: 'absolute', top: 5, right: 5,
              background: 'rgba(200,30,30,0.9)', color: '#fff',
              fontSize: 11, fontWeight: 900, padding: '2px 7px',
              borderRadius: 4, letterSpacing: '0.02em',
              boxShadow: '0 0 8px rgba(220,40,40,0.5)',
            }}>!</div>
          )}
          {isArchived && (
            <div style={{
              position: 'absolute', top: 5, right: 5,
              background: 'rgba(60,60,60,0.9)', color: '#aaa',
              fontSize: 8, fontWeight: 700, padding: '2px 6px',
              borderRadius: 4, letterSpacing: '0.06em',
            }}>ARCHIVÉ</div>
          )}
        </div>
      ) : !imgError && game.header_img ? (
        <div style={{ position: 'relative' }}>
          <img
            src={game.header_img} alt={game.name}
            onError={() => setImgError(true)}
            style={{ width: '100%', height: 'auto', display: 'block' }}
            draggable={false}
          />
          {isUrgent && !isArchived && (
            <div style={{
              position: 'absolute', top: 5, right: 5,
              background: 'rgba(200,30,30,0.9)', color: '#fff',
              fontSize: 11, fontWeight: 900, padding: '2px 7px',
              borderRadius: 4, letterSpacing: '0.02em',
              boxShadow: '0 0 8px rgba(220,40,40,0.5)',
            }}>!</div>
          )}
          {isArchived && (
            <div style={{
              position: 'absolute', top: 5, right: 5,
              background: 'rgba(60,60,60,0.9)', color: '#aaa',
              fontSize: 8, fontWeight: 700, padding: '2px 6px',
              borderRadius: 4, letterSpacing: '0.06em',
            }}>ARCHIVÉ</div>
          )}
        </div>
      ) : (
        <div style={{
          width: '100%', height: 88, position: 'relative', background: 'var(--steam)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>
          🎮
          {isUrgent && !isArchived && (
            <div style={{
              position: 'absolute', top: 5, right: 5,
              background: 'rgba(200,30,30,0.9)', color: '#fff',
              fontSize: 11, fontWeight: 900, padding: '2px 7px',
              borderRadius: 4, letterSpacing: '0.02em',
              boxShadow: '0 0 8px rgba(220,40,40,0.5)',
            }}>!</div>
          )}
          {isArchived && (
            <div style={{
              position: 'absolute', top: 5, right: 5,
              background: 'rgba(60,60,60,0.9)', color: '#aaa',
              fontSize: 8, fontWeight: 700, padding: '2px 6px',
              borderRadius: 4, letterSpacing: '0.06em',
            }}>ARCHIVÉ</div>
          )}
        </div>
      )}

      {/* ── Info area ── */}
      <div style={{ padding: '7px 9px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          <div style={{
            fontWeight: 600, fontSize: 12, lineHeight: '1.3', marginBottom: 3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
          }} title={game.name}>{game.name}</div>

          {/* Action buttons */}
          {!readOnly && (
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              {!isArchived && onEdit && isCustom && (
                <button
                  onClick={e => { e.stopPropagation(); onEdit(game); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', opacity: 0.6, padding: '1px 3px',
                    lineHeight: 1, flexShrink: 0, display: 'flex', alignItems: 'center',
                  }}
                  title="Éditer"
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                  </svg>
                </button>
              )}
              {isArchived ? (
                <>
                  <button
                    onClick={e => { e.stopPropagation(); onUnarchive && onUnarchive(); }}
                    style={{
                      background: 'none', border: 'none', color: '#6090c0',
                      fontSize: 13, cursor: 'pointer', opacity: 0.8, padding: '0 2px',
                      lineHeight: 1, flexShrink: 0,
                    }}
                    title="Restaurer"
                  >↩</button>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete && onDelete(); }}
                    style={{
                      background: 'none', border: 'none', color: '#c04040',
                      fontSize: 13, cursor: 'pointer', opacity: 0.8, padding: '0 0 0 2px',
                      lineHeight: 1, flexShrink: 0,
                    }}
                    title="Supprimer définitivement"
                  >🗑</button>
                </>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); onArchive && onArchive(); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    fontSize: 14, cursor: 'pointer', opacity: 0.5, padding: '0 0 0 2px',
                    lineHeight: 1, flexShrink: 0,
                  }}
                  title="Archiver"
                >✕</button>
              )}
            </div>
          )}
        </div>

        {/* Sub-info row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, minHeight: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 0 }}>
            {isCustom
              ? <span style={{ color: tt ? tt.textColor : 'var(--accent)', opacity: 0.8 }}>
                  {tt ? `${tt.emoji} ${tt.label}` : (isTaskBoard ? 'Tâche' : 'Carte perso')}
                </span>
              : formatPlaytime(game.playtime_minutes)
            }
          </div>

          {/* Urgent badge in footer */}
          {isUrgent && !isArchived && (
            <div style={{
              background: 'rgba(200,30,30,0.15)',
              color: '#ff6060',
              border: '1px solid rgba(220,60,60,0.5)',
              borderRadius: 4, padding: '1px 6px',
              fontSize: 9, fontWeight: 900,
              whiteSpace: 'nowrap', flexShrink: 0,
              letterSpacing: '0.04em',
            }}>⚠ URGENT</div>
          )}

          {/* Date badge */}
          {dateInfo && (
            <div style={{
              background: dateInfo.bg,
              color: dateInfo.color,
              border: `1px solid ${dateInfo.border}`,
              borderRadius: 4, padding: '1px 6px',
              fontSize: 9, fontWeight: 700,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              📅 {dateInfo.label}
            </div>
          )}
        </div>
      </div>
      {/* ── Progress bar — shown when progress is set ── */}
      {typeof game.progress === 'number' && !isArchived && (
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            width: `${game.progress}%`, height: '100%',
            background: progressColor(game.progress) || '#c03030',
            transition: 'width .3s, background .3s',
          }} />
        </div>
      )}
    </div>
  );
}
