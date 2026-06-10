import { getTaskType } from '../taskTypes.jsx';

// ── Date helpers ──────────────────────────────────────────────────────────────

function parseLocalDate(str) {
  if (!str) return null;
  return new Date(str + 'T00:00:00');
}

function formatDate(d) {
  if (!d) return '';
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatShortDate(d) {
  if (!d) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function getDateInfo(game) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (game.startDate && game.endDate) {
    const start = parseLocalDate(game.startDate);
    const end   = parseLocalDate(game.endDate);
    const label = formatShortDate(start) + ' → ' + formatShortDate(end);
    const detail = formatDate(start) + ' → ' + formatDate(end);
    if (today < start) return { label, detail, status: 'future',  color: '#c9a010', bg: 'rgba(180,140,10,0.15)', border: 'rgba(180,140,10,0.45)' };
    if (today > end)   return { label, detail, status: 'past',    color: '#c03030', bg: 'rgba(160,20,20,0.15)',  border: 'rgba(160,20,20,0.45)' };
    return            { label, detail, status: 'active',  color: '#2a8a3a', bg: 'rgba(30,120,50,0.15)',  border: 'rgba(30,120,50,0.45)' };
  }

  if (game.dueDate) {
    const due   = parseLocalDate(game.dueDate);
    const label = formatShortDate(due);
    const detail = formatDate(due);
    if (today.getTime() === due.getTime()) return { label, detail, status: 'active', color: '#2a8a3a', bg: 'rgba(30,120,50,0.15)',  border: 'rgba(30,120,50,0.45)' };
    if (today < due)                       return { label, detail, status: 'future', color: '#c9a010', bg: 'rgba(180,140,10,0.15)', border: 'rgba(180,140,10,0.45)' };
    return                                 { label, detail, status: 'past',   color: '#c03030', bg: 'rgba(160,20,20,0.15)',  border: 'rgba(160,20,20,0.45)' };
  }

  return null;
}

const STATUS_LABEL = { future: 'À venir', active: 'En cours', past: 'Passée' };

// ── TaskModal ─────────────────────────────────────────────────────────────────

export default function TaskModal({ game, onClose, onEdit }) {
  const tt        = game.taskType ? getTaskType(game.taskType) : null;
  const TtIcon    = tt?.Icon;
  const dateInfo  = getDateInfo(game);

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20, backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: 'var(--surface)', border: tt ? `1.5px solid ${tt.border}` : '1px solid var(--border)',
        borderRadius: 14, width: '100%', maxWidth: 480,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* ── Header illustration / emoji ── */}
        <div style={{
          position: 'relative', height: 148, flexShrink: 0,
          background: tt ? tt.imgBg : 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {tt ? <TtIcon /> : (
            <span style={{ fontSize: 60, lineHeight: 1, userSelect: 'none' }}>{game.emoji || '🎮'}</span>
          )}

          {/* Gradient fade-to-surface at bottom */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--surface) 0%, transparent 55%)' }} />

          {/* Type badge top-left */}
          {tt && (
            <div style={{
              position: 'absolute', top: 10, left: 12,
              background: tt.badgeBg, color: tt.badgeText,
              fontSize: 9, fontWeight: 700, padding: '3px 8px',
              borderRadius: 5, letterSpacing: '0.05em',
            }}>{tt.emoji} {tt.label.toUpperCase()}</div>
          )}

          {/* Buttons top-right */}
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
            {onEdit && (
              <button
                onClick={onEdit}
                title="Éditer la tâche"
                style={{
                  background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 7, width: 32, height: 32, color: '#ccc', fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✏</button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 7, width: 32, height: 32, color: '#ccc', fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>

          {/* Title overlay */}
          <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 20, lineHeight: 1.2, color: 'var(--text)' }}>
              {game.name}
            </div>
            {tt && (
              <div style={{ fontSize: 12, marginTop: 3, color: tt.textColor, opacity: 0.85 }}>
                {tt.emoji} {tt.label}
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Date block */}
          {dateInfo && (
            <div style={{
              background: dateInfo.bg,
              border: `1px solid ${dateInfo.border}`,
              borderRadius: 9, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>📅</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: dateInfo.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  {STATUS_LABEL[dateInfo.status]}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{dateInfo.detail}</div>
              </div>
              <div style={{
                background: dateInfo.bg, border: `1px solid ${dateInfo.border}`,
                borderRadius: 5, padding: '2px 8px', fontSize: 11, color: dateInfo.color, fontWeight: 700,
              }}>
                {dateInfo.label}
              </div>
            </div>
          )}

          {/* Notes placeholder */}
          <div style={{
            background: 'var(--surface2)', border: '1px dashed var(--border)',
            borderRadius: 9, padding: '14px 14px',
            color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.7,
            fontStyle: 'italic', minHeight: 80,
          }}>
            Aucune note — clique sur ✏ pour ajouter des détails.
          </div>

          {/* Meta row — emoji only for untyped cards */}
          {!game.taskType && game.emoji && (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ background: 'var(--surface2)', borderRadius: 7, padding: '5px 10px', fontSize: 20 }}>
                {game.emoji}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export the date helper for use in GameCard
export { getDateInfo };
