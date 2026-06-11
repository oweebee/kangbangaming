import { useState, useEffect } from 'react';
import { getDateInfo } from './TaskModal.jsx';
import { getTaskType } from '../taskTypes.jsx';

const API = '/api';

// ── Catégoriser une tâche selon ses dates ──────────────────────────────────────
function categorize(task) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in3   = new Date(today); in3.setDate(in3.getDate() + 3);

  function parseD(s) { return s ? new Date(s + 'T00:00:00') : null; }

  let refDate = null; // date de référence pour trier

  if (task.dueDate) {
    refDate = parseD(task.dueDate);
  } else if (task.endDate) {
    refDate = parseD(task.endDate);
  } else if (task.startDate) {
    refDate = parseD(task.startDate);
  }

  if (!refDate) return null;

  // overdue : date de fin passée (ou dueDate passée), non terminée
  if (task.done) return null; // terminée → jamais dans l'échéancier (on peut afficher "done" séparément)

  if (task.startDate && task.endDate) {
    const start = parseD(task.startDate);
    const end   = parseD(task.endDate);
    if (today < start) {
      if (start <= in3) return { cat: 'upcoming', refDate: start };
      return null; // trop loin dans le futur
    }
    if (today > end) return { cat: 'overdue', refDate: end };
    return { cat: 'active', refDate: end }; // en cours
  }

  if (task.dueDate) {
    const due = parseD(task.dueDate);
    if (today > due) return { cat: 'overdue', refDate: due };
    if (today.getTime() === due.getTime()) return { cat: 'active', refDate: due };
    if (due <= in3) return { cat: 'upcoming', refDate: due };
    return null;
  }

  return null;
}

const CAT_META = {
  overdue:  { label: 'Échues',        color: '#e05555', icon: '⚠', bg: 'rgba(200,40,40,0.08)',  border: 'rgba(200,40,40,0.25)' },
  active:   { label: "Aujourd'hui / En cours", color: '#3db86a', icon: '📍', bg: 'rgba(40,160,80,0.08)',  border: 'rgba(40,160,80,0.25)' },
  upcoming: { label: 'Dans 3 jours',  color: '#c9a010', icon: '🕐', bg: 'rgba(180,140,10,0.08)', border: 'rgba(180,140,10,0.25)' },
};

function formatShort(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function TaskMiniCard({ task, onOpen }) {
  const tt = task.taskType ? getTaskType(task.taskType) : null;
  const info = getDateInfo(task);
  const isCustom = task.type === 'custom';

  return (
    <div
      onClick={() => onOpen(task)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--surface2)', border: `1px solid ${tt ? tt.border : 'var(--border)'}`,
        borderRadius: 7, padding: '7px 9px', cursor: 'pointer',
        transition: 'background .1s, border-color .1s',
        minWidth: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface3, var(--surface))'; e.currentTarget.style.borderColor = tt ? tt.border : 'var(--accent)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.borderColor = tt ? tt.border : 'var(--border)'; }}
    >
      {/* Miniature */}
      <div style={{
        width: 30, height: 18, borderRadius: 3, overflow: 'hidden', flexShrink: 0,
        background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {task.header_img ? (
          <img src={task.header_img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : isCustom ? (
          <span style={{ fontSize: 12 }}>{tt?.emoji || task.emoji || '🎮'}</span>
        ) : (
          <span style={{ fontSize: 12 }}>🎮</span>
        )}
      </div>

      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.name}
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.boardName}{task.ownerUsername ? ` · ${task.ownerUsername}` : ''}
        </div>
      </div>

      {/* Badge date */}
      {info && (
        <div style={{
          fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3, flexShrink: 0,
          color: info.color, border: `1px solid ${info.border}`, background: info.bg,
          whiteSpace: 'nowrap',
        }}>
          {info.label}
        </div>
      )}
    </div>
  );
}

function Section({ cat, tasks, onOpenTask }) {
  const [collapsed, setCollapsed] = useState(cat === 'upcoming');
  const meta = CAT_META[cat];
  if (tasks.length === 0) return null;

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        onClick={() => setCollapsed(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: collapsed ? 0 : 8,
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 12 }}>{meta.icon}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.07em', flex: 1 }}>
          {meta.label}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 99, padding: '1px 6px' }}>
          {tasks.length}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', transition: 'transform .15s', display: 'block', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</span>
      </div>
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {tasks.map((t, i) => (
            <TaskMiniCard key={`${t.boardId}-${t.gameId}-${i}`} task={t} onOpen={onOpenTask} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DeadlinePanel({ token, onOpenTask }) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API}/deadlines`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setTasks(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  // Catégoriser
  const categorized = { overdue: [], active: [], upcoming: [] };
  for (const task of tasks) {
    const c = categorize(task);
    if (c && categorized[c.cat]) categorized[c.cat].push({ ...task, _refDate: c.refDate });
  }
  // Trier chaque catégorie par date croissante
  for (const cat of Object.keys(categorized)) {
    categorized[cat].sort((a, b) => a._refDate - b._refDate);
  }

  const total = categorized.overdue.length + categorized.active.length + categorized.upcoming.length;

  return (
    <div style={{
      width: 240, flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 14px 10px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
      }}>
        <span style={{ fontSize: 15 }}>📅</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.07em', flex: 1 }}>Échéances</span>
        {total > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: categorized.overdue.length > 0 ? '#e05555' : 'var(--text-muted)',
            background: categorized.overdue.length > 0 ? 'rgba(200,40,40,0.12)' : 'var(--surface2)',
            borderRadius: 99, padding: '1px 7px',
            border: categorized.overdue.length > 0 ? '1px solid rgba(200,40,40,0.3)' : 'none',
          }}>{total}</span>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 20px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', padding: 20 }}>Chargement…</div>
        ) : total === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>Aucune échéance</div>
            <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6 }}>Toutes tes tâches avec des dates sont à jour</div>
          </div>
        ) : (
          <>
            <Section cat="overdue"  tasks={categorized.overdue}  onOpenTask={onOpenTask} />
            <Section cat="active"   tasks={categorized.active}   onOpenTask={onOpenTask} />
            <Section cat="upcoming" tasks={categorized.upcoming} onOpenTask={onOpenTask} />
          </>
        )}
      </div>
    </div>
  );
}
