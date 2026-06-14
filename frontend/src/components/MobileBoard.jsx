import { useState, useRef, useEffect, useCallback } from 'react';
import GameCard from './GameCard.jsx';

export default function MobileBoard({ columns, byColumn, onCardClick, onArchiveGame, onUnarchiveGame, onDeleteGame, onEditGame, isTaskBoard, onToggleDone, onToggleUrgent, onUpdateAssignees, onClickNotes, genreColors = {}, hiddenCardIds = new Set(), showHiddenCards = false, onHideCard, onUnhideCard, compact = false }) {
  const [activeColId, setActiveColId] = useState(columns[0]?.id || null);
  const containerRef   = useRef(null);
  const trackRef       = useRef(null);
  const tabBarRef      = useRef(null);
  const tabButtonRefs  = useRef({});
  const dragRef        = useRef({ active: false, startX: 0, startY: 0, startTime: 0, isHorizontal: null, w: 0 });
  const activeIdxRef   = useRef(0);

  const currentColId    = columns.find(c => c.id === activeColId)?.id || columns[0]?.id || null;
  const currentColIndex = columns.findIndex(c => c.id === currentColId);

  // Keep ref in sync with state
  useEffect(() => { activeIdxRef.current = currentColIndex; }, [currentColIndex]);

  // Snap track to given index (with or without animation)
  const snapToIndex = useCallback((idx, animate = true) => {
    const el  = containerRef.current;
    const trk = trackRef.current;
    if (!el || !trk) return;
    trk.style.transition = animate
      ? 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      : 'none';
    trk.style.transform = `translateX(${-idx * el.offsetWidth}px)`;
  }, []);

  // Animate to new position whenever currentColIndex changes (tab click, back button…)
  useEffect(() => { snapToIndex(currentColIndex, true); }, [currentColIndex, snapToIndex]);

  // Scroll active tab chip into view
  useEffect(() => {
    const btn = tabButtonRefs.current[currentColId];
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentColId]);

  // Native touch events — must be non-passive for preventDefault on horizontal swipes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const N = columns.length;

    const onStart = (e) => {
      const d = dragRef.current;
      d.active = true; d.isHorizontal = null;
      d.startX = e.touches[0].clientX; d.startY = e.touches[0].clientY;
      d.startTime = Date.now(); d.w = el.offsetWidth;
      const trk = trackRef.current;
      if (trk) trk.style.transition = 'none';
    };

    const onMove = (e) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.touches[0].clientX - d.startX;
      const dy = e.touches[0].clientY - d.startY;
      // Decide gesture direction on first significant movement
      if (d.isHorizontal === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5))
        d.isHorizontal = Math.abs(dx) > Math.abs(dy);
      if (!d.isHorizontal) return;
      e.preventDefault(); // block scroll only when swiping horizontally
      const base = -activeIdxRef.current * d.w;
      let x = base + dx;
      // Rubber-band at both ends
      if (x > 0)             x = dx * 0.15;
      if (x < -(N-1) * d.w) x = -(N-1) * d.w + (x + (N-1) * d.w) * 0.15;
      const trk = trackRef.current;
      if (trk) trk.style.transform = `translateX(${x}px)`;
    };

    const onEnd = (e) => {
      const d = dragRef.current;
      if (!d.active) return;
      d.active = false;
      if (!d.isHorizontal) return;
      const dx      = e.changedTouches[0].clientX - d.startX;
      const dt      = Date.now() - d.startTime;
      const isFlick = dt < 300 && Math.abs(dx) > 25;
      let idx = activeIdxRef.current;
      if ((dx < -d.w * 0.3 || (isFlick && dx < 0)) && idx < N - 1) idx++;
      else if ((dx > d.w * 0.3 || (isFlick && dx > 0)) && idx > 0) idx--;
      const trk = trackRef.current;
      if (trk) {
        trk.style.transition = 'transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        trk.style.transform  = `translateX(${-idx * d.w}px)`;
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
  }, [columns]); // re-attach if columns list changes

  const goToCol = (colId) => {
    const idx = columns.findIndex(c => c.id === colId);
    if (idx !== -1) { snapToIndex(idx, true); setActiveColId(colId); }
  };

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
                {colGames.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '40px 20px', border: '1px dashed var(--border)', borderRadius: 10 }}>
                    Aucun jeu dans cette colonne
                  </div>
                )}
                {colGames.map(game => (
                  <GameCard
                    key={game.appid}
                    game={game}
                    onClick={() => onCardClick(game)}
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
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
