import { useState, useEffect } from 'react';
import { getDateInfo } from './TaskModal.jsx';
import { getTaskType } from '../taskTypes.jsx';

const API = '/api';

// ── Catégoriser une tâche selon ses dates ──────────────────────────────────────
function categorize(task) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in3   = new Date(today); in3.setDate(in3.getDate() + 3);

  function parseD(s) { return s ? new Date(s + 'T00:00:00') : null; }

  if (task.done) return null; // terminée → jamais dans l'échéancier

  // Période complète (startDate + endDate)
  if (task.startDate && task.endDate) {
    const start = parseD(task.startDate);
    const end   = parseD(task.endDate);
    if (today > end)    return { cat: 'overdue',  refDate: end };
    if (today >= start) return { cat: 'active',   refDate: end }; // en cours
    if (start <= in3)   return { cat: 'upcoming', refDate: start };
    return null; // trop loin
  }

  // Date d'échéance unique
  if (task.dueDate) {
    const due = parseD(task.dueDate);
    if (today > due)                       return { cat: 'overdue',  refDate: due };
    if (today.getTime() === due.getTime()) return { cat: 'active',   refDate: due };
    if (due <= in3)                        return { cat: 'upcoming', refDate: due };
    return null;
  }

  // startDate seule (sans endDate) → traiter comme échéance
  if (task.startDate) {
    const start = parseD(task.startDate);
    if (today > start)                       return { cat: 'overdue',  refDate: start };
    if (today.getTime() === start.getTime()) return { cat: 'active',   refDate: start };
    if (start <= in3)                        return { cat: 'upcoming', refDate: start };
    return null;
  }

  return null;
}

const CAT_META = {
  overdue:  { label: 'Échues',                  color: '#e05555', icon: '⚠',  },
  active:   { label: "Aujourd'hui / En cours",  color: '#3db86a', icon: '📍', },
  upcoming: { label: 'Dans 3 jours',            color: '#c9a010', icon: '🕐', },
};

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
          <span style={{ fontSize: 12 }}>{tt?.emoji || task.emoji || '📋'}</span>
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
    <div style={{ marginBottom: 24 }}>
      <div
        onClick={() => setCollapsed(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: collapsed ? 0 : 12,
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 13 }}>{meta.icon}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1 }}>
          {meta.label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 99, padding: '1px 7px' }}>
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
  for (const cat of Object.keys(categorized)) {
    categorized[cat].sort((a, b) => a._refDate - b._refDate);
  }

  const total = categorized.overdue.length + categorized.active.length + categorized.upcoming.length;

  return (
    <div style={{
      width: 240, flexShrink: 0,
      borderRight: '1px solid var(--border)',
      overflowY: 'auto',
      padding: '28px 20px',
    }}>
      {/* Header — même style que les sections de la page d'accueil */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#47a7f5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#47a7f5', textTransform: 'uppercase', letterSpacing: '0.08em', flex: 1 }}>Échéances</span>
        {total > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: categorized.overdue.length > 0 ? '#e05555' : 'var(--text-muted)',
            background: categorized.overdue.length > 0 ? 'rgba(200,40,40,0.12)' : 'var(--surface2)',
            borderRadius: 99, padding: '1px 7px',
            border: categorized.overdue.length > 0 ? '1px solid rgba(200,40,40,0.3)' : 'none',
          }}>{total}</span>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 11, textAlign: 'center', padding: 20 }}>Chargement…</div>
      ) : total === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 4px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 11, fontWeight: 600 }}>Aucune échéance</div>
          <div style={{ fontSize: 10, marginTop: 4, opacity: 0.6 }}>Toutes les tâches avec des dates sont à jour</div>
        </div>
      ) : (
        <>
          <Section cat="overdue"  tasks={categorized.overdue}  onOpenTask={onOpenTask} />
          <Section cat="active"   tasks={categorized.active}   onOpenTask={onOpenTask} />
          <Section cat="upcoming" tasks={categorized.upcoming} onOpenTask={onOpenTask} />
        </>
      )}
    </div>
  );
}
