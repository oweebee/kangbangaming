import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import GameCard from './GameCard.jsx';
import { useLang } from '../i18n.js';

// ── Petite flèche SVG pour le bouton "Déplacer vers" ─────────────────────────
function MoveIcon() {
  return (
    <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5 9 2 12 5 15"/>
      <polyline points="19 9 22 12 19 15"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  );
}

// ── Picker de colonnes (bottom sheet) ────────────────────────────────────────
function ColumnPicker({ columns, currentColId, onSelect, onClose }) {
  const { t } = useLang();
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        onTouchEnd={e => { e.preventDefault(); onClose(); }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 900,
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 901,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        borderRadius: '16px 16px 0 0', padding: '16px 16px 32px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>
          {t('card.move_to')} …
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {columns.filter(c => c.id !== currentColId).map(col => (
            <button
              key={col.id}
              onClick={() => { onSelect(col.id); onClose(); }}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '12px 14px',
                color: 'var(--text)', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              {col.emoji && <span>{col.emoji}</span>}
              {col.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── MobileBoard ───────────────────────────────────────────────────────────────
export default function MobileBoard({
  columns, byColumn,
  onCardClick, onArchiveGame, onUnarchiveGame, onDeleteGame, onEditGame,
  isTaskBoard, onToggleDone, onToggleUrgent, onUpdateAssignees, onClickNotes,
  genreColors = {}, hiddenCardIds = new Set(), showHiddenCards = false,
  onHideCard, onUnhideCard, compact = false,
  moveGame, onReorderGames, onAddToColumn,
}) {
  const { t } = useLang();
  const [activeColId,  setActiveColId]  = useState(columns[0]?.id || null);
  const [movePicker,   setMovePicker]   = useState(null); // { game, colId }

  // ── Drag-to-reorder state ────────────────────────────────────────────────
  // dragState.current = { active, colId, appid, fromIdx, toIdx, startY, startClientY, cardHeight, longPressTimer }
  const dragState      = useRef({ active: false });
  const [dragAppid,    setDragAppid]    = useState(null);
  const [dragToIdx,    setDragToIdx]    = useState(null);
  const [dragColId,    setDragColId]    = useState(null);

  // ── Swipe entre colonnes ─────────────────────────────────────────────────
  const containerRef   = useRef(null);
  const trackRef       = useRef(null);
  const tabBarRef      = useRef(null);
  const tabButtonRefs  = useRef({});
  const swipeRef       = useRef({ active: false, startX: 0, startY: 0, startTime: 0, isHorizontal: null, w: 0 });
  const activeIdxRef   = useRef(0);

  const currentColId    = columns.find(c => c.id === activeColId)?.id || columns[0]?.id || null;
  const currentColIndex = columns.findIndex(c => c.id === currentColId);

  useEffect(() => { activeIdxRef.current = currentColIndex; }, [currentColIndex]);

  const snapToIndex = useCallback((idx, animate = true) => {
    const el  = containerRef.current;
    const trk = trackRef.current;
    if (!el || !trk) return;
    trk.style.transition = animate
      ? 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      : 'none';
    trk.style.transform = `translateX(${-idx * el.offsetWidth}px)`;
  }, []);

  useLayoutEffect(() => { snapToIndex(currentColIndex, false); }, []); // eslint-disable-line
  useEffect(() => { snapToIndex(currentColIndex, true); }, [currentColIndex, snapToIndex]);

  // Scroll tab into view
  useEffect(() => {
    const btn = tabButtonRefs.current[currentColId];
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentColId]);

  // ── Swipe column touch events (only when drag is NOT active) ─────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const N = columns.length;

    const onStart = (e) => {
      if (dragState.current.active) return;
      const s = swipeRef.current;
      s.active = true; s.isHorizontal = null;
      s.startX = e.touches[0].clientX; s.startY = e.touches[0].clientY;
      s.startTime = Date.now(); s.w = el.offsetWidth;
      const trk = trackRef.current;
      if (trk) trk.style.transition = 'none';
    };

    const onMove = (e) => {
      if (dragState.current.active) return;
      const s = swipeRef.current;
      if (!s.active) return;
      const dx = e.touches[0].clientX - s.startX;
      const dy = e.touches[0].clientY - s.startY;
      if (s.isHorizontal === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5))
        s.isHorizontal = Math.abs(dx) > Math.abs(dy);
      if (!s.isHorizontal) return;
      e.preventDefault();
      const base = -activeIdxRef.current * s.w;
      let x = base + dx;
      if (x > 0)             x = dx * 0.15;
      if (x < -(N-1) * s.w) x = -(N-1) * s.w + (x + (N-1) * s.w) * 0.15;
      const trk = trackRef.current;
      if (trk) trk.style.transform = `translateX(${x}px)`;
    };

    const onEnd = (e) => {
      if (dragState.current.active) return;
      const s = swipeRef.current;
      if (!s.active) return;
      s.active = false;
      if (!s.isHorizontal) return;
      const dx      = e.changedTouches[0].clientX - s.startX;
      const dt      = Date.now() - s.startTime;
      const isFlick = dt < 300 && Math.abs(dx) > 25;
      let idx = activeIdxRef.current;
      if ((dx < -s.w * 0.3 || (isFlick && dx < 0)) && idx < N - 1) idx++;
      else if ((dx > s.w * 0.3 || (isFlick && dx > 0)) && idx > 0) idx--;
      const trk = trackRef.current;
      if (trk) {
        trk.style.transition = 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        trk.style.transform  = `translateX(${-idx * s.w}px)`;
      }
      if (idx !== activeIdxRef.current) setActiveColId(columns[idx].id);
    };

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, [columns]);

  const goToCol = (colId) => {
    const idx = columns.findIndex(c => c.id === colId);
    if (idx !== -1) { snapToIndex(idx, true); setActiveColId(colId); }
  };

  // ── Drag-to-reorder handlers ─────────────────────────────────────────────
  const handleCardTouchStart = useCallback((e, game, colId, colGames) => {
    if (!onReorderGames) return;
    const touch   = e.touches[0];
    const fromIdx = colGames.findIndex(g => g.appid === game.appid);
    const d       = dragState.current;

    // Long press timer: 400 ms
    d.longPressTimer = setTimeout(() => {
      d.active      = true;
      d.colId       = colId;
      d.appid       = game.appid;
      d.fromIdx     = fromIdx;
      d.toIdx       = fromIdx;
      d.startClientY = touch.clientY;
      d.cardHeight  = e.currentTarget.offsetHeight + 8; // gap
      d.colGames    = colGames;
      setDragAppid(game.appid);
      setDragToIdx(fromIdx);
      setDragColId(colId);
      // Vibrate feedback if available
      if (navigator.vibrate) navigator.vibrate(40);
    }, 400);
  }, [onReorderGames]);

  const handleCardTouchMove = useCallback((e) => {
    const d = dragState.current;
    clearTimeout(d.longPressTimer);
    if (!d.active) return;
    e.stopPropagation(); // prevent column swipe
    const dy       = e.touches[0].clientY - d.startClientY;
    const newIdx   = Math.max(0, Math.min(
      d.colGames.length - 1,
      d.fromIdx + Math.round(dy / d.cardHeight)
    ));
    d.toIdx = newIdx;
    setDragToIdx(newIdx);
  }, []);

  const handleCardTouchEnd = useCallback(() => {
    const d = dragState.current;
    clearTimeout(d.longPressTimer);
    if (!d.active) { d.active = false; return; }

    // Reorder
    const games     = [...d.colGames];
    const [moved]   = games.splice(d.fromIdx, 1);
    games.splice(d.toIdx, 0, moved);
    onReorderGames?.(d.colId, games.map(g => g.appid));

    d.active = false;
    setDragAppid(null);
    setDragToIdx(null);
    setDragColId(null);
  }, [onReorderGames]);

  // Cancel long press on any significant touch move before 400ms
  const handleCardTouchMoveEarly = useCallback(() => {
    clearTimeout(dragState.current.longPressTimer);
  }, []);

  if (columns.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        Ajoute une colonne pour commencer
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Barre d'onglets colonnes ── */}
      <div style={{ position: 'relative', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        <div ref={tabBarRef} style={{ display: 'flex', gap: 6, padding: '10px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {columns.map(col => {
            const active = col.id === currentColId;
            const count  = (byColumn[col.id] || []).length;
            return (
              <button
                key={col.id}
                ref={el => { tabButtonRefs.current[col.id] = el; }}
                onClick={() => goToCol(col.id)}
                style={{
                  flexShrink: 0,
                  background: active ? 'var(--accent)' : 'var(--surface2)',
                  border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 20, padding: '6px 14px',
                  color: active ? '#fff' : 'var(--text-muted)',
                  fontSize: 12, fontWeight: active ? 700 : 400,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'background .15s, border-color .15s, color .15s',
                }}
              >
                {col.emoji && <span style={{ fontSize: 14 }}>{col.emoji}</span>}
                {col.label}
                <span style={{ background: active ? 'rgba(255,255,255,.25)' : 'var(--surface3)', borderRadius: 99, padding: '1px 6px', fontSize: 10 }}>{count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 20, background: 'linear-gradient(to right, var(--surface), transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 20, background: 'linear-gradient(to left, var(--surface), transparent)', pointerEvents: 'none' }} />
      </div>

      {/* ── Zone de slide ── */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div
          ref={trackRef}
          style={{
            display: 'flex',
            width: `${columns.length * 100}%`,
            height: '100%',
            willChange: 'transform',
          }}
        >
          {columns.map((col) => {
            const colGames = (byColumn[col.id] || []).filter(g => showHiddenCards ? true : !hiddenCardIds.has(String(g.appid)));

            // Si un drag est en cours sur cette colonne, réordonner visuellement
            let displayGames = colGames;
            if (dragAppid && dragColId === col.id) {
              const arr = [...colGames];
              const fi  = arr.findIndex(g => g.appid === dragAppid);
              if (fi !== -1 && dragToIdx !== null) {
                const [moved] = arr.splice(fi, 1);
                arr.splice(dragToIdx, 0, moved);
                displayGames = arr;
              }
            }

            return (
              <div
                key={col.id}
                style={{
                  width: `${100 / columns.length}%`,
                  height: '100%',
                  overflowY: 'auto',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}
              >
                {displayGames.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '40px 20px', border: '1px dashed var(--border)', borderRadius: 10 }}>
                    Aucune carte dans cette colonne
                  </div>
                )}
                {displayGames.map(game => {
                  const isBeingDragged = dragAppid === game.appid;
                  return (
                    <div
                      key={game.appid}
                      style={{
                        opacity:   isBeingDragged ? 0.55 : 1,
                        transform: isBeingDragged ? 'scale(0.97)' : 'none',
                        transition: 'opacity .15s, transform .15s',
                        touchAction: 'pan-y',
                      }}
                      onTouchStart={e => handleCardTouchStart(e, game, col.id, colGames)}
                      onTouchMove={e => {
                        handleCardTouchMoveEarly();
                        handleCardTouchMove(e);
                      }}
                      onTouchEnd={handleCardTouchEnd}
                    >
                      <GameCard
                        game={game}
                        onClick={() => { if (!dragState.current.active) onCardClick(game); }}
                        onArchive={() => onArchiveGame(game.appid)}
                        onUnarchive={() => onUnarchiveGame(game.appid)}
                        onDelete={() => onDeleteGame(game.appid)}
                        onEdit={onEditGame}
                        isTaskBoard={isTaskBoard}
                        isDragging={false}
                        onDragStart={() => {}}
                        onDragEnd={() => {}}
                        onToggleDone={onToggleDone ? (done) => onToggleDone(game.appid, done) : undefined}
                        onToggleUrgent={onToggleUrgent ? (urgent) => onToggleUrgent(game.appid, urgent) : undefined}
                        onUpdateAssignees={onUpdateAssignees ? (assignees) => onUpdateAssignees(game.appid, assignees) : undefined}
                        onClickNotes={onClickNotes ? () => onClickNotes(game) : undefined}
                        genreColor={game.type !== 'custom' ? (genreColors[String(game.appid)] || '#66c0f4') : (game.color || null)}
                        isHidden={hiddenCardIds.has(String(game.appid))}
                        onHide={onHideCard ? () => onHideCard(game.appid) : undefined}
                        onUnhide={onUnhideCard ? () => onUnhideCard(game.appid) : undefined}
                        compact={compact}
                      />
                      {/* Bouton "Déplacer vers" — visible quand > 1 colonne */}
                      {columns.length > 1 && moveGame && !isBeingDragged && (
                        <button
                          onTouchEnd={e => { e.stopPropagation(); e.preventDefault(); setMovePicker({ game, colId: col.id }); }}
                          onClick={e => { e.stopPropagation(); setMovePicker({ game, colId: col.id }); }}
                          style={{
                            marginTop: 4,
                            width: '100%',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: 7,
                            padding: '9px 8px',
                            color: 'var(--text-muted)',
                            fontSize: 12,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                          }}
                        >
                          <MoveIcon />
                          {t('card.move_to')}
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* ── Bouton "+ carte" en bas de colonne ── */}
                {onAddToColumn && (
                  <button
                    onClick={() => onAddToColumn(col.id)}
                    style={{
                      width: '100%', marginTop: 4, flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(192,87,10,0.12) 0%, rgba(192,87,10,0.04) 100%)',
                      border: '1.5px solid rgba(192,87,10,0.35)',
                      borderRadius: 7, padding: '9px 8px',
                      color: 'var(--accent)', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', textAlign: 'center',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    + {isTaskBoard ? t('col.add_task') : t('col.add_card_game')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Column picker (bottom sheet) ── */}
      {movePicker && (
        <ColumnPicker
          columns={columns}
          currentColId={movePicker.colId}
          onSelect={(targetColId) => moveGame(movePicker.game.appid, targetColId)}
          onClose={() => setMovePicker(null)}
        />
      )}
    </div>
  );
}
