import { useState, useEffect, useRef } from 'react';
import GameCard from './GameCard.jsx';
import { useLang } from '../i18n.js';

const API = '/api';

// ── Catégoriser ────────────────────────────────────────────────────────────────

// parseD : gère "YYYY-MM-DD", ISO complet, ou tout autre format Date-valide.
// Toujours renvoie minuit LOCAL pour que les comparaisons soient cohérentes.
function parseD(s) {
  if (!s) return null;
  let d;
  // Format "YYYY-MM-DD" → on force minuit local explicitement
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, day] = s.split('-').map(Number);
    d = new Date(y, m - 1, day, 0, 0, 0, 0);
  } else {
    d = new Date(s);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0); // normalise à minuit local
  }
  return isNaN(d.getTime()) ? null : d;
}

function categorize(task) {
  const now   = new Date(); now.setHours(0, 0, 0, 0);
  const today = now.getTime();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowt = tomorrow.getTime();
  const in3   = new Date(now); in3.setDate(in3.getDate() + 3);
  const in3t  = in3.getTime();

  if (task.done) return null;

  function classifyFuture(refDate) {
    const t = refDate.getTime();
    if (t === tomorrowt) return 'tomorrow';
    if (t <= in3t)       return 'upcoming';
    return null;
  }

  if (task.startDate && task.endDate) {
    const start = parseD(task.startDate), end = parseD(task.endDate);
    if (!start || !end) return null;
    if (today > end.getTime())    return { cat: 'overdue',  refDate: end };
    if (today >= start.getTime()) return { cat: 'active',   refDate: end };
    const cat = classifyFuture(start);
    return cat ? { cat, refDate: start } : null;
  }
  if (task.dueDate) {
    const due = parseD(task.dueDate);
    if (!due) return null;
    const duet = due.getTime();
    if (today > duet)   return { cat: 'overdue',  refDate: due };
    if (today === duet) return { cat: 'active',   refDate: due };
    const cat = classifyFuture(due);
    return cat ? { cat, refDate: due } : null;
  }
  if (task.startDate) {
    const start = parseD(task.startDate);
    if (!start) return null;
    const st = start.getTime();
    if (today > st)   return { cat: 'overdue',  refDate: start };
    if (today === st) return { cat: 'active',   refDate: start };
    const cat = classifyFuture(start);
    return cat ? { cat, refDate: start } : null;
  }
  return null;
}

// CAT_META labels are now fetched via t() inside components

const OverdueIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#e05555" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="rgba(224,85,85,0.2)"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

// ── Convertit un task API → objet game attendu par GameCard ───────────────────
function taskToGame(task) {
  return {
    appid:            task.gameId,
    name:             task.name,
    header_img:       task.header_img  || null,
    icon_img:         task.icon_img    || null,
    type:             task.type        || 'steam',
    taskType:         task.taskType    || null,
    emoji:            task.emoji       || null,
    progress:         typeof task.progress === 'number' ? task.progress : null,
    done:             !!task.done,
    urgent:           !!task.urgent,
    dueDate:          task.dueDate     || null,
    startDate:        task.startDate   || null,
    endDate:          task.endDate     || null,
    archived:         false,
    playtime_minutes: null,
    notes:            [],
  };
}

// ── Section ────────────────────────────────────────────────────────────────────
function Section({ cat, tasks, onOpenTask, hiddenDeadlineIds, showHiddenDeadlines, onHideDeadline, onUnhideDeadline, compact = false }) {
  const { t } = useLang();
  const CAT_META = {
    overdue:  { label: t('deadline.cat_warning'),  color: '#e05555', icon: null },
    active:   { label: t('deadline.cat_today'),    color: '#3db86a', icon: '📍' },
    tomorrow: { label: t('deadline.cat_tomorrow'), color: '#e09020', icon: '📅' },
    upcoming: { label: t('deadline.cat_3days'),    color: '#c9a010', icon: '🕐' },
  };
  const [collapsed, setCollapsed] = useState(false);
  const [order, setOrder] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`dlOrder_${cat}`) || 'null') || []; } catch { return []; }
  });
  const [dragKey,      setDragKey]      = useState(null);
  const [dragOver,     setDragOver]     = useState(null);
  const [touchDragKey, setTouchDragKey] = useState(null);
  const [touchDragOver,setTouchDragOver]= useState(null);
  const touchTimerRef = useRef(null);
  const touchDragRef  = useRef({ active: false, key: null, overKey: null, scrollBlocker: null, pendingX: 0, pendingY: 0 });
  const meta = CAT_META[cat];
  if (tasks.length === 0) return null;

  const taskKey = t => `${t.boardId}__${t.gameId}`;

  function applyOrder(items) {
    if (!order || order.length === 0) return items;
    const map = new Map(items.map(t => [taskKey(t), t]));
    const sorted = order.map(k => map.get(k)).filter(Boolean);
    const extra = items.filter(t => !order.includes(taskKey(t)));
    return [...sorted, ...extra];
  }

  function applyReorder(fromKey, toKey) {
    if (!fromKey || fromKey === toKey) return;
    const base = applyOrder(tasks).map(taskKey);
    const from = base.indexOf(fromKey);
    const to   = base.indexOf(toKey);
    if (from === -1 || to === -1) return;
    const next = [...base];
    next.splice(from, 1);
    next.splice(to, 0, fromKey);
    try { localStorage.setItem(`dlOrder_${cat}`, JSON.stringify(next)); } catch {}
    setOrder(next);
  }

  function handleDrop(overId) {
    applyReorder(dragKey, overId);
    setDragKey(null); setDragOver(null);
  }

  function finishTouchDrop() {
    const { key, overKey, scrollBlocker } = touchDragRef.current;
    if (scrollBlocker) { document.removeEventListener('touchmove', scrollBlocker); }
    touchDragRef.current = { active: false, key: null, overKey: null, scrollBlocker: null, pendingX: 0, pendingY: 0 };
    setTouchDragKey(null); setTouchDragOver(null);
    applyReorder(key, overKey);
  }

  function cancelTouchDrag() {
    clearTimeout(touchTimerRef.current);
    const { scrollBlocker } = touchDragRef.current;
    if (scrollBlocker) { document.removeEventListener('touchmove', scrollBlocker); }
    touchDragRef.current = { active: false, key: null, overKey: null, scrollBlocker: null, pendingX: 0, pendingY: 0 };
    setTouchDragKey(null); setTouchDragOver(null);
  }

  const allSorted = applyOrder(tasks);
  const sorted = allSorted.filter(t => showHiddenDeadlines ? true : !hiddenDeadlineIds.has(taskKey(t)));

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        onClick={() => setCollapsed(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: collapsed ? 0 : 10, cursor: 'pointer', userSelect: 'none' }}
      >
        {cat === 'overdue' ? <OverdueIcon /> : <span style={{ fontSize: 11 }}>{meta.icon}</span>}
        <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.07em', flex: 1 }}>
          {meta.label}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 99, padding: '1px 6px' }}>
          {tasks.length}
        </span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', transition: 'transform .15s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
      </div>

      {!collapsed && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          {sorted.map((task, i) => {
            const game = taskToGame(task);
            const key = taskKey(task);
            const isTouchDragging = touchDragKey === key;
            const isTouchOver     = touchDragOver === key && touchDragKey !== key;
            return (
              <div
                key={`${key}-${i}`}
                data-dlkey={key}
                draggable
                onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setDragKey(key); }}
                onDragEnd={() => { setDragKey(null); setDragOver(null); }}
                onDragOver={e => { e.preventDefault(); setDragOver(key); }}
                onDrop={e => { e.preventDefault(); handleDrop(key); }}
                onContextMenu={e => e.preventDefault()}
                onTouchStart={e => {
                  clearTimeout(touchTimerRef.current);
                  touchDragRef.current = { active: false, key, overKey: null, scrollBlocker: null, pendingX: e.touches[0].clientX, pendingY: e.touches[0].clientY };
                  touchTimerRef.current = setTimeout(() => {
                    touchDragRef.current.active = true;
                    setTouchDragKey(key);
                    if (navigator.vibrate) navigator.vibrate(40);
                    const blocker = (ev) => ev.preventDefault();
                    touchDragRef.current.scrollBlocker = blocker;
                    document.addEventListener('touchmove', blocker, { passive: false });
                  }, 400);
                }}
                onTouchMove={e => {
                  const d = touchDragRef.current;
                  if (!d.active) {
                    const dx = Math.abs(e.touches[0].clientX - d.pendingX);
                    const dy = Math.abs(e.touches[0].clientY - d.pendingY);
                    if (dx > 5 || dy > 5) clearTimeout(touchTimerRef.current);
                    return;
                  }
                  const touch = e.touches[0];
                  const el = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('[data-dlkey]');
                  const overKey = el?.getAttribute('data-dlkey') ?? null;
                  d.overKey = overKey;
                  setTouchDragOver(overKey);
                }}
                onTouchEnd={e => {
                  clearTimeout(touchTimerRef.current);
                  if (!touchDragRef.current.active) { touchDragRef.current.active = false; return; }
                  e.preventDefault();
                  finishTouchDrop();
                }}
                onTouchCancel={cancelTouchDrag}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 4,
                  opacity: (dragKey === key || isTouchDragging) ? 0.4 : 1,
                  outline: (dragOver === key && dragKey !== key) || isTouchOver ? `2px dashed ${meta.color}` : 'none',
                  borderRadius: 8, cursor: 'grab',
                  transform: isTouchDragging ? 'rotate(1deg) scale(1.02)' : 'none',
                  boxShadow: isTouchDragging ? '0 6px 20px rgba(0,0,0,0.5)' : 'none',
                  transition: 'opacity .15s, transform .15s, box-shadow .15s',
                }}
              >
                <GameCard
                  game={game}
                  onClick={() => onOpenTask(task)}
                  readOnly={false}
                  isTaskBoard={task.type === 'custom'}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                  genreColor={task.type === 'custom' ? (task.color || null) : null}
                  isHidden={hiddenDeadlineIds.has(key)}
                  onHide={onHideDeadline ? () => onHideDeadline(key) : undefined}
                  onUnhide={onUnhideDeadline ? () => onUnhideDeadline(key) : undefined}
                  compact={compact}
                />
                {/* Nom du board */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 6px',
                  background: 'var(--surface2)', borderRadius: 5,
                  border: '1px solid var(--border)',
                }}>
                  {task.boardIcon
                    ? <img src={task.boardIcon} alt="" style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0 }} />
                    : <span style={{ fontSize: 11, flexShrink: 0 }}>📋</span>
                  }
                  <span style={{
                    fontSize: 10, color: isPublic ? '#47a7f5' : 'var(--text-muted)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    fontWeight: 600,
                  }}>
                    {task.boardName}
                  </span>
                  {isPublic && task.ownerUsername && (
                    <span style={{ fontSize: 9, color: '#47a7f5', opacity: 0.7, flexShrink: 0 }}>
                      🌐 {task.ownerUsername}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function DeadlinePanel({ token, onOpenTask, refreshKey = 0, hiddenDeadlineIds = new Set(), showHiddenDeadlines = false, onHideDeadline, onUnhideDeadline, onToggleShowHidden, compact = false, onEmpty }) {
  const { t } = useLang();
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [apiCount, setApiCount] = useState(null); // nb brut renvoyé par l'API
  const [manualKey, setManualKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API}/deadlines`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setApiCount(data.length);
        setTasks(data);
        setLoading(false);
        if (data.length === 0 && onEmpty) onEmpty();
      })
      .catch(() => { setApiCount(0); setLoading(false); if (onEmpty) onEmpty(); });
  }, [token, refreshKey, manualKey]);

  const categorized = { overdue: [], active: [], tomorrow: [], upcoming: [] };
  for (const task of tasks) {
    if (task.urgentOnly && !task.done) {
      // Tâches urgentes sans date → section Attention ! (après les tâches échues)
      categorized.overdue.push({ ...task, _refDate: new Date() });
    } else {
      const c = categorize(task);
      if (c && categorized[c.cat]) categorized[c.cat].push({ ...task, _refDate: c.refDate });
    }
  }
  for (const cat of Object.keys(categorized)) {
    categorized[cat].sort((a, b) => a._refDate - b._refDate);
  }

  const total = categorized.overdue.length + categorized.active.length + categorized.tomorrow.length + categorized.upcoming.length;
  const hiddenCount = hiddenDeadlineIds.size;

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#47a7f5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#47a7f5', textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1 }}>{t('deadline.header')}</span>
        {total > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: categorized.overdue.length > 0 ? '#e05555' : 'var(--text-muted)',
            background: categorized.overdue.length > 0 ? 'rgba(200,40,40,0.12)' : 'var(--surface2)',
            borderRadius: 99, padding: '1px 7px',
            border: categorized.overdue.length > 0 ? '1px solid rgba(200,40,40,0.3)' : 'none',
          }}>{total}</span>
        )}
        {/* Masquées (N) */}
        {hiddenCount > 0 && onToggleShowHidden && (
          <button
            onClick={onToggleShowHidden}
            title={showHiddenDeadlines ? t('deadline.hide_hidden') : t('deadline.show_hidden')}
            style={{
              background: showHiddenDeadlines ? 'rgba(40,120,200,0.22)' : 'var(--surface2)',
              border: showHiddenDeadlines ? '1px solid rgba(60,150,240,0.6)' : '1px solid var(--border)',
              borderRadius: 6, padding: '3px 7px', cursor: 'pointer',
              color: showHiddenDeadlines ? '#70b8ff' : 'var(--text-muted)',
              fontSize: 10, fontWeight: showHiddenDeadlines ? 700 : 400,
              display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {showHiddenDeadlines
                ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
              }
            </svg>
            {hiddenCount}
          </button>
        )}
        {/* Bouton actualiser */}
        <button
          onClick={() => setManualKey(k => k + 1)}
          title={t('deadline.refresh')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center', opacity: loading ? 0.4 : 0.7 }}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>{t('deadline.loading')}</div>
      ) : total === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 8px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 26, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{t('deadline.empty')}</div>
          {apiCount !== null && apiCount > 0 && (
            <div style={{ fontSize: 10, marginTop: 6, color: '#c9a010', background: 'rgba(200,160,0,0.08)', border: '1px solid rgba(200,160,0,0.25)', borderRadius: 6, padding: '5px 10px' }}>
              {t('deadline.count_hint', { apiCount })}
            </div>
          )}
          {(apiCount === 0) && (
            <div style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>{t('deadline.add_hint')}</div>
          )}
        </div>
      ) : (
        <>
          <Section cat="overdue"  tasks={categorized.overdue}   onOpenTask={onOpenTask} hiddenDeadlineIds={hiddenDeadlineIds} showHiddenDeadlines={showHiddenDeadlines} onHideDeadline={onHideDeadline} onUnhideDeadline={onUnhideDeadline} compact={compact} />
          <Section cat="active"   tasks={categorized.active}    onOpenTask={onOpenTask} hiddenDeadlineIds={hiddenDeadlineIds} showHiddenDeadlines={showHiddenDeadlines} onHideDeadline={onHideDeadline} onUnhideDeadline={onUnhideDeadline} compact={compact} />
          <Section cat="tomorrow" tasks={categorized.tomorrow}  onOpenTask={onOpenTask} hiddenDeadlineIds={hiddenDeadlineIds} showHiddenDeadlines={showHiddenDeadlines} onHideDeadline={onHideDeadline} onUnhideDeadline={onUnhideDeadline} compact={compact} />
          <Section cat="upcoming" tasks={categorized.upcoming}  onOpenTask={onOpenTask} hiddenDeadlineIds={hiddenDeadlineIds} showHiddenDeadlines={showHiddenDeadlines} onHideDeadline={onHideDeadline} onUnhideDeadline={onUnhideDeadline} compact={compact} />
        </>
      )}
    </>
  );
}
