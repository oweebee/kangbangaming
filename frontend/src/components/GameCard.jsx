import { useState } from 'react';
import { getTaskType } from '../taskTypes.jsx';
import { getDateInfo } from './TaskModal.jsx';
import { progressColor } from './ProgressSlider.jsx';
import AssigneeAvatars from './AssigneeAvatars.jsx';
import { formatPlaytime } from '../utils.js';
import { useLang } from '../i18n.js';

const COMPACT_ICON_SIZE = 32; // 40 * 0.8 (-20%)

export default function GameCard({ game, onDragStart, onDragEnd, onClick, onArchive, onUnarchive, onDelete, onEdit, isDragging, readOnly, isTaskBoard, compact = false, assignees = [], appUsers = [], onToggleDone, onToggleUrgent, onUpdateAssignees, onClickNotes, genreColor = null, isHidden = false, onHide, onUnhide }) {
  const { t } = useLang();
  const [imgError, setImgError] = useState(false);
  const [ttImgError, setTtImgError] = useState(false);
  const isCustom   = game.type === 'custom';
  const isArchived = !!game.archived;
  const isUrgent   = !!game.urgent;
  const isDone     = !!game.done;
  const notesCount = (game.notes || []).length;
  const tt         = game.taskType ? getTaskType(game.taskType) : null;
  const customColor = isCustom && !tt ? (game.color || '#66c0f4') : null;
  const TtFallback = tt?.FallbackIcon;
  const dateInfo  = getDateInfo(game);

  return (
    <div
      draggable={!readOnly && !isArchived}
      onDragStart={readOnly || isArchived ? undefined : e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={readOnly || isArchived ? undefined : onDragEnd}
      onClick={readOnly || isArchived ? undefined : onClick}
      style={{
        position: 'relative',
        background: isArchived ? 'var(--surface2)' : tt ? tt.bg : customColor ? `${customColor}12` : 'var(--surface2)',
        border: isArchived ? '2px solid #787878' : isDone ? '2px solid #3db86a' : isUrgent ? '2px solid #dc3c3c' : tt ? `2px solid ${tt.border}` : customColor ? `2px solid ${customColor}` : `2px solid ${genreColor || '#66c0f4'}`,
        borderRadius: 8,
        overflow: 'hidden',
        cursor: readOnly || isArchived ? 'default' : 'grab',
        opacity: isDragging ? 0.35 : isArchived ? 0.6 : isHidden ? 0.5 : 1,
        transform: isDragging ? 'rotate(2deg) scale(1.03)' : undefined,
        boxShadow: isDragging ? '0 8px 28px rgba(0,0,0,0.55)' : undefined,
        transition: 'opacity 0.15s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s',
        userSelect: 'none',
        filter: isArchived ? 'saturate(0.3)' : isHidden ? 'saturate(0.4) brightness(0.75)' : 'none',
      }}
      onMouseEnter={readOnly || isArchived ? undefined : e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = isDone ? '#3db86a' : isUrgent ? '#dc3c3c' : tt ? tt.border : customColor ? customColor : (genreColor || '#66c0f4');
      }}
      onMouseLeave={readOnly || isArchived ? undefined : e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = isDone ? '#3db86a' : isUrgent ? '#dc3c3c' : tt ? tt.border : customColor ? customColor : (genreColor || '#66c0f4');
      }}
    >
      {/* ── Image area — masquée en mode compact ── */}
      {!compact && isCustom && tt ? (
        <div style={{ width: '100%', position: 'relative' }}>
          {/* Image pleine largeur, hauteur auto — pas de rognage */}
          {tt.img && !ttImgError ? (
            <img
              src={tt.img}
              alt={tt.label}
              onError={() => setTtImgError(true)}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: 88,
              background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {TtFallback ? <TtFallback /> : <span style={{ fontSize: 32 }}>{tt.emoji}</span>}
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: 4, left: 5,
            background: tt.badgeBg, color: tt.badgeText,
            fontSize: 8, fontWeight: 700, padding: '2px 6px',
            borderRadius: 4, letterSpacing: '0.04em',
          }}>{(tt.labelKey ? t(tt.labelKey) : tt.label).toUpperCase()}</div>
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
            }}>{t('card.badge_archived')}</div>
          )}
        </div>
      ) : !compact && isCustom ? (
        <div style={{
          width: '100%', height: 88, position: 'relative',
          background: customColor
            ? `linear-gradient(135deg, ${customColor}30 0%, ${customColor}18 50%, ${customColor}08 100%)`
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
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
            }}>{t('card.badge_archived')}</div>
          )}
        </div>
      ) : !compact && !imgError && game.header_img ? (
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
            }}>{t('card.badge_archived')}</div>
          )}
        </div>
      ) : !compact ? (
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
            }}>{t('card.badge_archived')}</div>
          )}
        </div>
      ) : null}

      {/* ── Info area ── */}
      <div style={{ padding: compact ? '4px 9px' : '7px 9px', paddingRight: compact ? 26 : 9, paddingBottom: compact ? COMPACT_ICON_SIZE + 6 : 7 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          <div style={{
            fontWeight: 600, fontSize: compact ? 13 : 14, lineHeight: compact ? '1.2' : '1.3', marginBottom: compact ? 1 : 3,
            wordBreak: 'break-word', flex: 1,
            ...(compact ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : {}),
          }} title={game.name}>{game.name}</div>

          {/* Boutons inline — NON-compact seulement */}
          {!compact && (<>
            {!isArchived && onToggleDone && (
              <button onClick={e => { e.stopPropagation(); onToggleDone(!isDone); }} title={isDone ? t('card.mark_undone') : t('card.mark_done')}
                style={{ background: isDone ? 'rgba(61,184,106,0.22)' : 'rgba(255,255,255,0.10)', border: `1px solid ${isDone ? '#3db86a' : 'rgba(255,255,255,0.28)'}`, borderRadius: 4, width: 20, height: 20, padding: 0, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone ? '#3db86a' : 'rgba(255,255,255,0.65)', transition: 'all .15s' }}>
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            )}
            {!isArchived && onToggleUrgent && (
              <button onClick={e => { e.stopPropagation(); onToggleUrgent(!isUrgent); }} title={isUrgent ? t('card.remove_urgent') : t('card.add_urgent')}
                style={{ background: isUrgent ? 'rgba(220,60,60,0.22)' : 'rgba(255,255,255,0.10)', border: `1px solid ${isUrgent ? '#dc3c3c' : 'rgba(255,255,255,0.28)'}`, borderRadius: 4, width: 20, height: 20, padding: 0, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isUrgent ? '#ff6060' : 'rgba(255,255,255,0.65)', transition: 'all .15s' }}>
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </button>
            )}
            {!readOnly && (
              <div style={{ display: 'flex', gap: 3, flexShrink: 0, alignItems: 'center' }}>
                {!isArchived && onEdit && isCustom && (
                  <button onClick={e => { e.stopPropagation(); onEdit(game); }} title={t('card.edit_title')}
                    style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: 4, width: 20, height: 20, padding: 0, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.65)' }}>
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </button>
                )}
                {!isArchived && (isHidden ? onUnhide : onHide) && (
                  <button onClick={e => { e.stopPropagation(); isHidden ? onUnhide() : onHide(); }} title={isHidden ? t('card.show') : t('card.hide')}
                    style={{ background: isHidden ? 'rgba(60,150,240,0.18)' : 'rgba(255,255,255,0.10)', border: `1px solid ${isHidden ? 'rgba(60,150,240,0.55)' : 'rgba(255,255,255,0.28)'}`, borderRadius: 4, width: 20, height: 20, padding: 0, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isHidden ? '#70b8ff' : 'rgba(255,255,255,0.65)' }}>
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      {isHidden ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>}
                    </svg>
                  </button>
                )}
                {isArchived ? ((onUnarchive || onDelete) && <>
                  {onUnarchive && <button onClick={e => { e.stopPropagation(); onUnarchive(); }} title={t('card.restore')} style={{ background: 'rgba(96,144,192,0.18)', border: '1px solid rgba(96,144,192,0.45)', borderRadius: 4, width: 20, height: 20, padding: 0, cursor: 'pointer', flexShrink: 0, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6090c0' }}>↩</button>}
                  {onDelete && <button onClick={e => { e.stopPropagation(); onDelete(); }} title={t('card.delete_perm')} style={{ background: 'rgba(192,64,64,0.18)', border: '1px solid rgba(192,64,64,0.45)', borderRadius: 4, width: 20, height: 20, padding: 0, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c04040' }}><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>}
                </>) : (onArchive && (
                  <button onClick={e => { e.stopPropagation(); onArchive(); }} title={t('card.archive_btn')}
                    style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.28)', borderRadius: 4, width: 20, height: 20, padding: 0, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.65)' }}>
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                  </button>
                ))}
              </div>
            )}
          </>)}
        </div>

        {/* Sub-info row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: compact ? 14 : 18, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isCustom
              ? <span style={{ color: tt ? tt.textColor : 'var(--accent)', opacity: 0.8 }}>
                  {tt ? (tt.labelKey ? t(tt.labelKey) : tt.label) : null}
                </span>
              : formatPlaytime(game.playtime_minutes)
            }
          </div>

          {/* Badges urgent + date — toujours dans la ligne info */}
          {isUrgent && !isArchived && (
            <div style={{ background: 'rgba(200,30,30,0.15)', color: '#ff6060', border: '2px solid #dc3c3c', borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 900, whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '0.04em' }}>⚠ URGENT</div>
          )}
          {dateInfo && (
            <div style={{ background: dateInfo.bg, color: dateInfo.color, border: `2px solid ${dateInfo.border}`, borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
              📅 {dateInfo.label}
            </div>
          )}
        </div>
      </div>

      {/* ── Compact : colonne de boutons absolue haut-droite ── */}
      {compact && !readOnly && (
        <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', flexDirection: 'row', gap: 2, zIndex: 5 }}>
          {!isArchived && onToggleDone && (
            <button onClick={e => { e.stopPropagation(); onToggleDone(!isDone); }} title={isDone ? t('card.mark_undone') : t('card.mark_done')}
              style={{ background: isDone ? 'rgba(61,184,106,0.22)' : 'rgba(255,255,255,0.10)', border: `1px solid ${isDone ? '#3db86a' : 'rgba(255,255,255,0.28)'}`, borderRadius: 3, width: 16, height: 16, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDone ? '#3db86a' : 'rgba(255,255,255,0.65)', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          )}
          {!isArchived && onToggleUrgent && (
            <button onClick={e => { e.stopPropagation(); onToggleUrgent(!isUrgent); }} title={isUrgent ? t('card.remove_urgent') : t('card.add_urgent')}
              style={{ background: isUrgent ? 'rgba(220,60,60,0.22)' : 'rgba(255,255,255,0.10)', border: `1px solid ${isUrgent ? '#dc3c3c' : 'rgba(255,255,255,0.28)'}`, borderRadius: 3, width: 16, height: 16, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isUrgent ? '#ff6060' : 'rgba(255,255,255,0.65)', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </button>
          )}
          {!isArchived && onEdit && isCustom && (
            <button onClick={e => { e.stopPropagation(); onEdit(game); }} title={t('card.edit_title')}
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 3, width: 16, height: 16, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.55)', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            </button>
          )}
          {!isArchived && (isHidden ? onUnhide : onHide) && (
            <button onClick={e => { e.stopPropagation(); isHidden ? onUnhide() : onHide(); }} title={isHidden ? t('card.show') : t('card.hide')}
              style={{ background: isHidden ? 'rgba(60,150,240,0.18)' : 'rgba(255,255,255,0.10)', border: `1px solid ${isHidden ? 'rgba(60,150,240,0.5)' : 'rgba(255,255,255,0.22)'}`, borderRadius: 3, width: 16, height: 16, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isHidden ? '#70b8ff' : 'rgba(255,255,255,0.55)', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {isHidden ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>}
              </svg>
            </button>
          )}
          {isArchived ? (<>
            {onUnarchive && <button onClick={e => { e.stopPropagation(); onUnarchive(); }} title={t('card.restore')} style={{ background: 'rgba(96,144,192,0.18)', border: '1px solid rgba(96,144,192,0.4)', borderRadius: 3, width: 16, height: 16, padding: 0, cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6090c0', flexShrink: 0 }}>↩</button>}
            {onDelete && <button onClick={e => { e.stopPropagation(); onDelete(); }} title={t('card.delete')} style={{ background: 'rgba(192,64,64,0.18)', border: '1px solid rgba(192,64,64,0.4)', borderRadius: 3, width: 16, height: 16, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c04040', flexShrink: 0 }}><svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>}
          </>) : (onArchive && (
            <button onClick={e => { e.stopPropagation(); onArchive(); }} title={t('card.archive_btn')}
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 3, width: 16, height: 16, padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.55)', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            </button>
          ))}
        </div>
      )}
      {/* ── Compact mode: icône bas-droite + avatars ── */}
      {compact && (
        <>
          {/* Icône bas-droite */}
          <div style={{
            position: 'absolute',
            bottom: typeof game.progress === 'number' && !isArchived ? 9 : 6,
            right: 6,
            width: COMPACT_ICON_SIZE,
            height: COMPACT_ICON_SIZE,
            borderRadius: 6,
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.4)',
            background: 'var(--surface2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {/* Carte Steam → icône du jeu */}
            {!isCustom && game.icon_img && (
              <img src={game.icon_img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {!isCustom && !game.icon_img && (
              <span style={{ fontSize: 18, lineHeight: 1 }}>🎮</span>
            )}
            {/* Tâche avec type → image type */}
            {isCustom && tt && !ttImgError && tt.img && (
              <img src={tt.img} alt={tt.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
            {isCustom && tt && (ttImgError || !tt.img) && (
              <span style={{ fontSize: 18, lineHeight: 1 }}>{tt.emoji}</span>
            )}
            {/* Tâche manuelle sans type → emoji de la tâche */}
            {isCustom && !tt && (
              <span style={{ fontSize: 18, lineHeight: 1 }}>{game.emoji || '🎮'}</span>
            )}
          </div>
          {/* Avatars en mode compact — bas gauche */}
          {assignees?.length > 0 && appUsers?.length > 0 && (
            <AssigneeAvatars
              assignees={assignees}
              appUsers={appUsers}
              size={COMPACT_ICON_SIZE}
              borderColor={tt ? tt.border : 'var(--border)'}
              bottom={typeof game.progress === 'number' && !isArchived ? 9 : 6}
              left={6}
            />
          )}
        </>
      )}


      {/* Done badge overlay on image */}
      {isDone && !isArchived && !compact && (
        <div style={{
          position: 'absolute', top: 5, left: 5,
          background: 'rgba(30,100,50,0.92)', color: '#5de085',
          fontSize: 9, fontWeight: 800, padding: '2px 6px',
          borderRadius: 4, letterSpacing: '0.06em',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          {t('card.badge_done')}
        </div>
      )}


      {/* ── Progress bar — shown when progress is set ── */}
      {typeof game.progress === 'number' && !isArchived && (
        <div style={{ height: 5, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
          <div style={{
            width: `${game.progress}%`, height: '100%',
            background: isDone ? '#3db86a' : (progressColor(game.progress) || '#c03030'),
            transition: 'width .3s, background .3s',
          }} />
        </div>
      )}

      {/* ── Bulle notes ── */}
      {notesCount > 0 && !isArchived && (
        <button
          onClick={e => { e.stopPropagation(); if (onClickNotes) onClickNotes(); else if (onClick) onClick(); }}
          title={`${notesCount} note${notesCount > 1 ? 's' : ''} — ouvrir l'onglet notes`}
          style={{
            position: 'absolute',
            ...(compact ? {
              bottom: typeof game.progress === 'number' && !isArchived ? 9 : 6,
              right: 6 + COMPACT_ICON_SIZE + 4,
            } : {
              top: isUrgent ? 26 : 5,
              right: 5,
            }),
            background: 'rgba(80,150,240,0.22)',
            border: '1px solid rgba(80,150,240,0.55)',
            borderRadius: 5, padding: '2px 5px',
            fontSize: compact ? 9 : 10, fontWeight: 700,
            color: '#7ab8ff',
            cursor: 'pointer', zIndex: 4,
            display: 'flex', alignItems: 'center', gap: 3,
            lineHeight: 1, userSelect: 'none',
            boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          }}
        >
          <svg viewBox="0 0 24 24" width={compact ? 9 : 10} height={compact ? 9 : 10} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {notesCount}
        </button>
      )}
    </div>
  );
}
