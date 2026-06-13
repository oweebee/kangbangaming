import { useState } from 'react';
import { getTaskType } from '../taskTypes.jsx';
import { getDateInfo } from './TaskModal.jsx';
import { progressColor } from './ProgressSlider.jsx';
import AssigneeAvatars from './AssigneeAvatars.jsx';
import { AssigneeEditor } from './CardControls.jsx';

const COMPACT_ICON_SIZE = 40; // 33 * 1.2 ≈ 40

function formatPlaytime(minutes) {
  if (!minutes || minutes === 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function GameCard({ game, onDragStart, onDragEnd, onClick, onArchive, onUnarchive, onDelete, onEdit, isDragging, readOnly, isTaskBoard, compact = false, assignees = [], appUsers = [], onToggleDone, onToggleUrgent, onUpdateAssignees, onClickNotes, genreColor = null, isHidden = false, onHide, onUnhide }) {
  const [imgError, setImgError] = useState(false);
  const [ttImgError, setTtImgError] = useState(false);
  const isCustom   = game.type === 'custom';
  const isArchived = !!game.archived;
  const isUrgent   = !!game.urgent;
  const isDone     = !!game.done;
  const notesCount = (game.notes || []).length;
  const tt         = game.taskType ? getTaskType(game.taskType) : null;
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
        background: isArchived ? 'var(--surface2)' : tt ? tt.bg : 'var(--surface2)',
        border: isArchived ? '2px solid #787878' : isDone ? '2px solid #3db86a' : isUrgent ? '2px solid #dc3c3c' : tt ? `2px solid ${tt.border}` : !isCustom ? `2px solid ${genreColor || '#66c0f4'}` : '2px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: readOnly || isArchived ? 'default' : 'grab',
        opacity: isDragging ? 0.4 : isArchived ? 0.6 : isHidden ? 0.5 : 1,
        transition: 'opacity 0.15s, transform 0.15s, box-shadow 0.15s',
        userSelect: 'none',
        filter: isArchived ? 'saturate(0.3)' : isHidden ? 'saturate(0.4) brightness(0.75)' : 'none',
      }}
      onMouseEnter={readOnly || isArchived ? undefined : e => {
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
        e.currentTarget.style.borderColor = isDone ? '#3db86a' : isUrgent ? '#dc3c3c' : tt ? tt.border : !isCustom ? (genreColor || '#66c0f4') : '#555';
      }}
      onMouseLeave={readOnly || isArchived ? undefined : e => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = isDone ? '#3db86a' : isUrgent ? '#dc3c3c' : tt ? tt.border : !isCustom ? (genreColor || '#66c0f4') : 'var(--border)';
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
      ) : !compact && isCustom ? (
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
            }}>ARCHIVÉ</div>
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
            }}>ARCHIVÉ</div>
          )}
        </div>
      ) : null}

      {/* ── Info area ── */}
      <div style={{ padding: compact ? '4px 9px' : '7px 9px', paddingRight: compact ? 76 : 9, paddingBottom: compact ? COMPACT_ICON_SIZE + 6 : 7 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          <div style={{
            fontWeight: 600, fontSize: compact ? 13 : 14, lineHeight: compact ? '1.2' : '1.3', marginBottom: compact ? 1 : 3,
            wordBreak: 'break-word', flex: 1,
            ...(compact ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : {}),
          }} title={game.name}>{game.name}</div>

          {/* Bouton "terminée" — toujours rendu indépendamment de readOnly */}
          {!isArchived && onToggleDone && (
            <button
              onClick={e => { e.stopPropagation(); onToggleDone(!isDone); }}
              title={isDone ? 'Marquer non terminée' : 'Marquer terminée'}
              style={{
                background: isDone ? 'rgba(61,184,106,0.22)' : 'rgba(255,255,255,0.10)',
                border: `1px solid ${isDone ? '#3db86a' : 'rgba(255,255,255,0.28)'}`,
                borderRadius: 4, width: 20, height: 20, padding: 0,
                cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isDone ? '#3db86a' : 'rgba(255,255,255,0.65)',
                transition: 'all .15s',
                ...(compact ? { position: 'absolute', top: 4, right: 4, zIndex: 3 } : {}),
              }}
            >
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          )}

          {/* Bouton "urgent" */}
          {!isArchived && onToggleUrgent && (
            <button
              onClick={e => { e.stopPropagation(); onToggleUrgent(!isUrgent); }}
              title={isUrgent ? 'Retirer urgence' : 'Marquer urgent'}
              style={{
                background: isUrgent ? 'rgba(220,60,60,0.22)' : 'rgba(255,255,255,0.10)',
                border: `1px solid ${isUrgent ? '#dc3c3c' : 'rgba(255,255,255,0.28)'}`,
                borderRadius: 4, width: 20, height: 20, padding: 0,
                cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isUrgent ? '#ff6060' : 'rgba(255,255,255,0.65)',
                transition: 'all .15s',
                ...(compact ? { position: 'absolute', top: 4, right: onToggleDone ? 27 : 4, zIndex: 3 } : {}),
              }}
            >
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </button>
          )}

          {/* Action buttons — absolute en compact, inline sinon */}
          {!readOnly && (
            <div style={compact ? {
              position: 'absolute', top: 4,
              right: compact && onToggleDone && onToggleUrgent ? 50 : compact && (onToggleDone || onToggleUrgent) ? 27 : 4,
              zIndex: 2,
              display: 'flex', gap: 3, alignItems: 'center',
            } : {
              display: 'flex', gap: 3, flexShrink: 0, alignItems: 'center',
            }}>

              {/* ✏ Éditer */}
              {!isArchived && onEdit && isCustom && (
                <button
                  onClick={e => { e.stopPropagation(); onEdit(game); }}
                  title="Éditer"
                  style={{
                    background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: 4, width: 20, height: 20, padding: 0,
                    cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.65)',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                  </svg>
                </button>
              )}

              {/* Masquer / Réafficher — uniquement hors archive */}
              {!isArchived && (isHidden ? onUnhide : onHide) && (
                <button
                  onClick={e => { e.stopPropagation(); isHidden ? onUnhide() : onHide(); }}
                  title={isHidden ? 'Réafficher' : 'Masquer'}
                  style={{
                    background: isHidden ? 'rgba(60,150,240,0.18)' : 'rgba(255,255,255,0.10)',
                    border: `1px solid ${isHidden ? 'rgba(60,150,240,0.55)' : 'rgba(255,255,255,0.28)'}`,
                    borderRadius: 4, width: 20, height: 20, padding: 0,
                    cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isHidden ? '#70b8ff' : 'rgba(255,255,255,0.65)',
                  }}
                >
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    {isHidden
                      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    }
                  </svg>
                </button>
              )}

              {/* Archive / Restaurer / Supprimer */}
              {isArchived ? (
                (onUnarchive || onDelete) && (
                  <>
                    {onUnarchive && <button
                      onClick={e => { e.stopPropagation(); onUnarchive(); }}
                      title="Restaurer"
                      style={{
                        background: 'rgba(96,144,192,0.18)', border: '1px solid rgba(96,144,192,0.45)',
                        borderRadius: 4, width: 20, height: 20, padding: 0,
                        cursor: 'pointer', flexShrink: 0, fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6090c0',
                      }}
                    >↩</button>}
                    {onDelete && <button
                      onClick={e => { e.stopPropagation(); onDelete(); }}
                      title="Supprimer définitivement"
                      style={{
                        background: 'rgba(192,64,64,0.18)', border: '1px solid rgba(192,64,64,0.45)',
                        borderRadius: 4, width: 20, height: 20, padding: 0,
                        cursor: 'pointer', flexShrink: 0, fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >🗑</button>}
                  </>
                )
              ) : (
                onArchive && (
                  <button
                    onClick={e => { e.stopPropagation(); onArchive(); }}
                    title="Archiver"
                    style={{
                      background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.28)',
                      borderRadius: 4, width: 20, height: 20, padding: 0,
                      cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                    </svg>
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Sub-info row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: compact ? 14 : 18, overflow: 'hidden' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isCustom
              ? <span style={{ color: tt ? tt.textColor : 'var(--accent)', opacity: 0.8 }}>
                  {tt ? tt.label : (isTaskBoard ? 'Tâche' : 'Carte perso')}
                </span>
              : formatPlaytime(game.playtime_minutes)
            }
          </div>

          {/* Urgent badge in footer */}
          {isUrgent && !isArchived && (
            <div style={{
              background: 'rgba(200,30,30,0.15)',
              color: '#ff6060',
              border: '2px solid #dc3c3c',
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
              border: `2px solid ${dateInfo.border}`,
              borderRadius: 4, padding: '1px 6px',
              fontSize: 9, fontWeight: 700,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              📅 {dateInfo.label}
            </div>
          )}
        </div>

        {/* ── Assignee picker ── */}
        {isTaskBoard && appUsers.length > 0 && onUpdateAssignees && !isArchived && (
          <div style={{ marginTop: 6 }} onClick={e => e.stopPropagation()}>
            <AssigneeEditor
              assignees={game.assignees || []}
              appUsers={appUsers}
              onUpdateAssignees={onUpdateAssignees}
              compact
              stopPropagation
            />
          </div>
        )}
      </div>
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
          TERMINÉE
        </div>
      )}

      {/* Done badge on compact */}
      {isDone && !isArchived && compact && (
        <div style={{
          position: 'absolute', top: 4, left: 4,
          background: 'rgba(30,100,50,0.92)', color: '#5de085',
          width: 16, height: 16, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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

      {/* ── Bulle notes (compact + non-compact) ── */}
      {notesCount > 0 && !isArchived && (
        <button
          onClick={e => { e.stopPropagation(); if (onClickNotes) onClickNotes(); else if (onClick) onClick(); }}
          title={`${notesCount} note${notesCount > 1 ? 's' : ''} — ouvrir l'onglet notes`}
          style={{
            position: 'absolute',
            ...(compact ? {
              top: (isDone && !isArchived) ? 24 : 4,
              left: 4,
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

      {/* ── Urgent badge en mode compact (absent des images) ── */}
      {isUrgent && !isArchived && compact && (
        <div style={{
          position: 'absolute', top: 4,
          left: (isDone && !isArchived) || notesCount > 0 ? ((isDone && !isArchived) && notesCount > 0 ? 50 : 24) : 4,
          background: 'rgba(200,30,30,0.9)', color: '#fff',
          width: 16, height: 16, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 900, lineHeight: 1, zIndex: 4,
          boxShadow: '0 0 5px rgba(220,40,40,0.5)',
        }}>!</div>
      )}
    </div>
  );
}
