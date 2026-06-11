// ── Composants partagés pour les contrôles de carte ──────────────────────────
// StatusToggles : boutons Terminée + Urgent côte à côte
// DatePicker    : sélecteur date unique / période
// Importés par TaskModal, GameModal, SearchModal

export function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '11px 14px',
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none',
};

// ── Terminée + Urgent côte à côte ─────────────────────────────────────────────
export function StatusToggles({ isDone, onToggleDone, isUrgent, onToggleUrgent }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        type="button"
        onClick={onToggleDone}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: isDone ? 'rgba(61,184,106,0.12)' : 'var(--surface2)',
          border: `1.5px solid ${isDone ? '#3db86a' : 'var(--border)'}`,
          borderRadius: 9, padding: '11px 14px', cursor: 'pointer',
          transition: 'all .15s', textAlign: 'left',
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${isDone ? '#3db86a' : 'rgba(255,255,255,0.25)'}`,
          background: isDone ? '#3db86a' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .15s',
        }}>
          {isDone && (
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: isDone ? '#3db86a' : 'var(--text)' }}>
          {isDone ? 'Terminée ✓' : 'Terminée'}
        </span>
      </button>

      <button
        type="button"
        onClick={onToggleUrgent}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: isUrgent ? 'rgba(220,40,40,0.12)' : 'var(--surface2)',
          border: `1.5px solid ${isUrgent ? 'rgba(220,60,60,0.6)' : 'var(--border)'}`,
          borderRadius: 9, padding: '11px 14px', cursor: 'pointer',
          transition: 'all .15s', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>⚠</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: isUrgent ? '#ff6060' : 'var(--text-muted)' }}>
          {isUrgent ? 'Urgent !' : 'Urgent'}
        </span>
      </button>
    </div>
  );
}

// ── Sélecteur de date / période ───────────────────────────────────────────────
export function DatePicker({ dateMode, onDateModeChange, dueDate, onDueDateChange, startDate, onStartDateChange, endDate, onEndDateChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>
        📅 Date <span style={{ opacity: 0.55 }}>(facultatif)</span>
      </label>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          ['none',   '✕  Aucune'],
          ['single', '📌 Une date'],
          ['period', '↔ Période'],
        ].map(([mode, lbl]) => (
          <button key={mode} type="button"
            onClick={() => onDateModeChange(mode)}
            style={{
              padding: '7px 15px', borderRadius: 18, cursor: 'pointer', fontSize: 13,
              background: dateMode === mode ? 'var(--accent)' : 'var(--surface2)',
              border: dateMode === mode ? '2px solid var(--accent)' : '2px solid var(--border)',
              color: dateMode === mode ? '#fff' : 'var(--text-muted)',
              fontWeight: dateMode === mode ? 700 : 500,
              transition: 'all .15s',
            }}
          >{lbl}</button>
        ))}
      </div>

      {dateMode === 'single' && (
        <input type="date" value={dueDate} onChange={e => onDueDateChange(e.target.value)}
          style={{ ...inputStyle, colorScheme: 'dark' }} />
      )}
      {dateMode === 'period' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)}
            style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 20, flexShrink: 0 }}>→</span>
          <input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)}
            style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }} />
        </div>
      )}

      {dateMode === 'single' && dueDate && (
        <div style={{
          marginTop: 9, padding: '8px 13px', borderRadius: 8,
          background: 'rgba(180,140,10,0.12)', border: '1px solid rgba(180,140,10,0.35)',
          fontSize: 13, color: 'var(--text-muted)',
        }}>
          📅 Échéance : <strong style={{ color: '#d4b020' }}>{formatDateLabel(dueDate)}</strong>
        </div>
      )}
      {dateMode === 'period' && (startDate || endDate) && (
        <div style={{
          marginTop: 9, padding: '8px 13px', borderRadius: 8,
          background: 'rgba(40,100,200,0.12)', border: '1px solid rgba(60,130,220,0.35)',
          fontSize: 13, color: 'var(--text-muted)',
        }}>
          📅 {startDate ? <strong style={{ color: '#80b8f0' }}>{formatDateLabel(startDate)}</strong> : '…'}
          {' → '}
          {endDate ? <strong style={{ color: '#80b8f0' }}>{formatDateLabel(endDate)}</strong> : '…'}
        </div>
      )}
    </div>
  );
}
