import { useState, useCallback, useRef } from 'react';
import { TASK_TYPES, getTaskType } from '../taskTypes.jsx';
import NotesSection from './NotesSection.jsx';
import ProgressSlider from './ProgressSlider.jsx';

const CARD_EMOJIS = [
  '🎮','🕹️','🏆','🥇','⭐','💎','🔥','❄️','⚡','🎯',
  '📦','🚀','💀','👾','🛡️','⚔️','🗡️','🧩','🎲','🃏',
  '✅','⏳','🔒','🎵','🎬','📺','🖥️','🧠','💡','🌟',
  '🐉','🦁','🐺','🤖','👑','🎭','🏰','🌋','🌊','🌙',
];

function LibraryBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: '#1b2838', color: '#c7d5e0',
      fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 4, flexShrink: 0,
    }}>
      <svg width="9" height="9" viewBox="0 0 256 256" fill="#c7d5e0"><circle cx="128" cy="128" r="128"/></svg>
      Bibliothèque
    </span>
  );
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── SearchModal ───────────────────────────────────────────────────────────────
// props:
//   api, token, boardGames, onAdd, onRemove, onClose  — always
//   customOnly   — hide Steam tab (task board context)
//   initialGame  — when set, opens in edit mode (pre-fills fields)
//   onSave       — called with updated game object in edit mode

export default function SearchModal({ api, token, boardGames, onAdd, onRemove, onClose, customOnly, initialGame, onSave, isTaskBoard, appUsers = [] }) {
  const isEditMode = !!initialGame;

  const [tab, setTab] = useState(customOnly || isEditMode ? 'custom' : 'steam');

  // Steam search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(new Set(boardGames.map(g => g.appid)));
  const debounce = useRef(null);

  // Custom card fields — pre-fill from initialGame in edit mode
  const [customName,     setCustomName]     = useState(initialGame?.name      || '');
  const [customEmoji,    setCustomEmoji]    = useState(initialGame?.emoji     || '🎮');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [customTaskType, setCustomTaskType] = useState(initialGame?.taskType  || null);

  // Date fields
  const [dateMode, setDateMode] = useState(
    initialGame?.startDate ? 'period' : initialGame?.dueDate ? 'single' : 'none'
  );
  const [dueDate,    setDueDate]    = useState(initialGame?.dueDate    || '');
  const [startDate,  setStartDate]  = useState(initialGame?.startDate  || '');
  const [endDate,    setEndDate]    = useState(initialGame?.endDate    || '');

  // Extra fields
  const [urgent,    setUrgent]    = useState(!!initialGame?.urgent);
  const [assignees, setAssignees] = useState(initialGame?.assignees || []);
  const [notes,     setNotes]     = useState(initialGame?.notes     || []);
  const [notesDraft, setNotesDraft] = useState('');
  const [progress,  setProgress]  = useState(initialGame?.progress ?? null);
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);
  const assigneeMenuRef = useRef(null);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${api}/steam/search?q=${encodeURIComponent(q)}`, { headers: authHeaders });
      setResults(await res.json());
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [api, token]);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(q), 350);
  };

  const handleAdd = (game) => {
    onAdd(game);
    setAdded(prev => new Set([...prev, game.appid]));
    onClose();
  };

  const handleRemove = (game) => {
    if (onRemove) onRemove(game.appid);
    setAdded(prev => { const s = new Set(prev); s.delete(game.appid); return s; });
  };

  const handleSubmitCustom = () => {
    if (!customName.trim()) return;
    // Auto-save unsaved note draft
    const finalNotes = notesDraft.trim()
      ? [...notes, { id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, text: notesDraft.trim(), createdAt: new Date().toISOString(), editedAt: null }]
      : notes;
    const gameData = {
      appid:     initialGame?.appid || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name:      customName.trim(),
      type:      'custom',
      emoji:     customEmoji,
      header_img: null,
      icon_img:  null,
      taskType:  customTaskType,
      dueDate:   dateMode === 'single' ? (dueDate || null) : null,
      startDate: dateMode === 'period' ? (startDate || null) : null,
      endDate:   dateMode === 'period' ? (endDate || null) : null,
      urgent,
      assignees,
      notes: finalNotes,
      progress,
    };
    if (isEditMode && onSave) {
      onSave({ ...initialGame, ...gameData });
    } else {
      onAdd(gameData);
    }
    onClose();
  };

  const tabStyle = (active) => ({
    flex: 1, padding: '11px 0', background: 'none',
    border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    color: active ? 'var(--text)' : 'var(--text-muted)',
    fontWeight: active ? 700 : 400, fontSize: 15, cursor: 'pointer',
    transition: 'all .15s',
  });

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '11px 14px',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--text)', fontSize: 15, outline: 'none',
  };

  // Live preview derived values
  const previewTt = customTaskType ? getTaskType(customTaskType) : null;
  const PreviewIcon = previewTt?.FallbackIcon;

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20, backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, width: '100%', maxWidth: 600,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 17 }}>
              {isEditMode ? '✏ Modifier la tâche' : 'Ajouter une carte'}
            </span>
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
          {/* Tabs — hidden in edit mode or customOnly */}
          {!customOnly && !isEditMode && (
            <div style={{ display: 'flex' }}>
              <button style={tabStyle(tab === 'steam')} onClick={() => setTab('steam')}>
                <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 13, height: 13, fill: 'currentColor', marginRight: 5, verticalAlign: 'middle' }}>
                  <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256z"/>
                </svg>
                Jeu Steam
              </button>
              <button style={tabStyle(tab === 'custom')} onClick={() => setTab('custom')}>
                ✦ Carte personnalisée
              </button>
            </div>
          )}
        </div>

        {/* ── Steam tab ── */}
        {tab === 'steam' && (
          <>
            <div style={{ padding: '14px 20px 10px', flexShrink: 0 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', left: 13, width: 15, height: 15, fill: 'var(--accent)', pointerEvents: 'none', flexShrink: 0 }}>
                  <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256z"/>
                </svg>
                <input
                  autoFocus type="search"
                  placeholder="Rechercher un jeu Steam..."
                  value={query} onChange={handleInput}
                  style={{ ...inputStyle, paddingLeft: 38 }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
              {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 36, fontSize: 14 }}>Recherche...</div>}
              {!loading && query && results.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 36, fontSize: 14 }}>Aucun résultat</div>
              )}
              {!loading && !query && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 36, fontSize: 14, lineHeight: 1.8 }}>
                  Tape le nom d'un jeu.<br/>
                  Les jeux dans ta bibliothèque Steam sont identifiés.
                </div>
              )}
              {results.map(game => {
                const isAdded = added.has(game.appid);
                return (
                  <div key={game.appid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <img src={game.header_img} alt={game.name}
                      style={{ width: 104, height: 49, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }}
                      onError={e => { e.target.style.display = 'none'; }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</span>
                        {game.in_library && <LibraryBadge />}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                        {game.in_library && game.playtime_hours > 0 ? `⏱ ${game.playtime_hours}h jouées` : game.in_library ? 'Jamais joué' : ''}
                      </div>
                    </div>
                    {isAdded ? (
                      <button onClick={() => handleRemove(game)}
                        style={{ background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
                        ✓ Retirer
                      </button>
                    ) : (
                      <button onClick={() => handleAdd(game)}
                        style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '6px 12px', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                        + Ajouter
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Custom / edit tab ── */}
        {tab === 'custom' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {!isEditMode && (
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
                Crée une carte libre : projet perso, objectif, note de jeu…
              </p>
            )}

            {/* ── Live preview ── */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                background: 'var(--surface2)',
                border: previewTt ? `1.5px solid ${previewTt.border}` : '1px solid var(--border)',
                borderRadius: 9, width: 185, overflow: 'hidden',
              }}>
                <div style={{ width: '100%', position: 'relative' }}>
                  {previewTt ? (
                    previewTt.img ? (
                      <img src={previewTt.img} alt={previewTt.label} style={{ width: '100%', height: 'auto', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#111,#1a1a1a)' }}>
                        {PreviewIcon ? <PreviewIcon /> : <span style={{ fontSize: 32 }}>{previewTt.emoji}</span>}
                      </div>
                    )
                  ) : (
                    <div style={{ width: '100%', height: 100, background: 'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50 }}>
                      {customEmoji}
                    </div>
                  )}
                  {previewTt && (
                    <div style={{
                      position: 'absolute', bottom: 5, left: 7,
                      background: previewTt.badgeBg, color: previewTt.badgeText,
                      fontSize: 9, fontWeight: 700, padding: '2px 7px',
                      borderRadius: 4, letterSpacing: '0.04em',
                    }}>{previewTt.label.toUpperCase()}</div>
                  )}
                </div>
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: customName ? 'var(--text)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {customName || (customOnly ? 'Nom de la tâche…' : 'Nom de la carte…')}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Emoji picker — hidden when type is set ── */}
            {!customTaskType && (
              <div>
                <label style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)', marginBottom: 9 }}>Icône</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button
                    onClick={() => setShowEmojiPicker(p => !p)}
                    style={{
                      width: 50, height: 50, fontSize: 26, background: 'var(--surface2)',
                      border: '2px solid var(--accent)', borderRadius: 9, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >{customEmoji}</button>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Clique pour changer</span>
                </div>
                {showEmojiPicker && (
                  <div style={{
                    marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 5,
                    background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, padding: 10,
                  }}>
                    {CARD_EMOJIS.map(e => (
                      <button key={e} onClick={() => { setCustomEmoji(e); setShowEmojiPicker(false); }}
                        style={{
                          width: 38, height: 38, fontSize: 22, background: customEmoji === e ? 'var(--accent-dim)' : 'none',
                          border: customEmoji === e ? '1px solid var(--accent)' : '1px solid transparent',
                          borderRadius: 6, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>{e}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Name ── */}
            <div>
              <label style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)', marginBottom: 7 }}>
                {customOnly ? 'Nom de la tâche' : 'Nom de la carte'}
              </label>
              <input
                autoFocus
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmitCustom()}
                placeholder={customOnly ? 'Ex: Terminer la campagne principale…' : 'Ex: Mon projet…'}
                style={inputStyle}
              />
            </div>

            {/* ── Task type selector (Steam boards only) ── */}
            {customOnly && (
              <div>
                <label style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Type de tâche <span style={{ opacity: 0.55 }}>(facultatif)</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {TASK_TYPES.map(t => {
                    const active = customTaskType === t.id;
                    return (
                      <button key={t.id}
                        onClick={() => setCustomTaskType(active ? null : t.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '8px 14px',
                          background: active ? t.bg : 'var(--surface2)',
                          border: active ? `2px solid ${t.border}` : '2px solid var(--border)',
                          borderRadius: 22,
                          color: active ? t.textColor : 'var(--text-muted)',
                          fontSize: 13, fontWeight: active ? 700 : 500,
                          cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
                          boxShadow: active ? `0 0 8px ${t.border}` : 'none',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{t.emoji}</span>
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Date ── */}
            <div>
              <label style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>
                📅 Date <span style={{ opacity: 0.55 }}>(facultatif)</span>
              </label>
              {/* Mode buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[
                  ['none',   '✕  Aucune'],
                  ['single', '📌 Une date'],
                  ['period', '↔ Période'],
                ].map(([mode, lbl]) => (
                  <button key={mode}
                    onClick={() => setDateMode(mode)}
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
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'dark' }} />
              )}
              {dateMode === 'period' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: 20, flexShrink: 0 }}>→</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                    style={{ ...inputStyle, flex: 1, colorScheme: 'dark' }} />
                </div>
              )}
              {/* Date preview when set */}
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

            {/* ── URGENT toggle ── */}
            <div>
              <button
                type="button"
                onClick={() => setUrgent(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: 9, cursor: 'pointer',
                  background: urgent ? 'rgba(220,40,40,0.14)' : 'var(--surface2)',
                  border: urgent ? '2px solid rgba(220,60,60,0.7)' : '2px solid var(--border)',
                  color: urgent ? '#ff6060' : 'var(--text-muted)',
                  fontWeight: urgent ? 700 : 500, fontSize: 14,
                  transition: 'all .15s',
                  boxShadow: urgent ? '0 0 10px rgba(220,40,40,0.25)' : 'none',
                  width: '100%',
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>⚠</span>
                <span>URGENT</span>
                {urgent && <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.7 }}>Activé</span>}
              </button>
            </div>

            {/* ── Assignees (Steam boards only) ── */}
            {isTaskBoard && appUsers.length > 0 && (
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 14, color: 'var(--text-muted)', marginBottom: 10 }}>
                  👥 Assignés <span style={{ opacity: 0.55 }}>(facultatif)</span>
                </label>

                {/* Selected assignees chips */}
                {assignees.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {assignees.map(uid => {
                      const u = appUsers.find(x => x.id === uid);
                      if (!u) return null;
                      return (
                        <div key={uid} style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          background: 'var(--surface2)', border: '1px solid var(--border)',
                          borderRadius: 20, padding: '4px 10px 4px 5px',
                          fontSize: 13,
                        }}>
                          {u.steamAvatar ? (
                            <img src={u.steamAvatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                              {u.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <span style={{ color: 'var(--text)' }}>{u.steamPersonaName || u.username}</span>
                          <button
                            onClick={() => setAssignees(a => a.filter(id => id !== uid))}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', padding: '0 0 0 2px', lineHeight: 1 }}
                          >✕</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={() => setShowAssigneeMenu(v => !v)}
                  style={{
                    width: '100%', padding: '10px 12px', textAlign: 'left',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 8, color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <span>+ Ajouter un assigné</span>
                  <span style={{ marginLeft: 'auto', opacity: 0.4 }}>{showAssigneeMenu ? '▲' : '▼'}</span>
                </button>

                {showAssigneeMenu && (
                  <div ref={assigneeMenuRef} style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    borderRadius: 8, marginTop: 4, maxHeight: 180, overflowY: 'auto',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                  }}>
                    {appUsers
                      .filter(u => u.role !== 'admin' && !assignees.includes(u.id))
                      .map(u => (
                        <div key={u.id}
                          onClick={() => { setAssignees(a => [...a, u.id]); setShowAssigneeMenu(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          {u.steamAvatar ? (
                            <img src={u.steamAvatar} alt="" style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--border)' }} />
                          ) : (
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                              {u.username?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{u.username}</div>
                            {u.steamPersonaName && u.steamPersonaName !== u.username && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.steamPersonaName}</div>
                            )}
                          </div>
                        </div>
                      ))
                    }
                    {appUsers.filter(u => u.role !== 'admin' && !assignees.includes(u.id)).length === 0 && (
                      <div style={{ padding: '12px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>Tous les utilisateurs sont assignés</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Progress ── */}
            <ProgressSlider value={progress} onChange={setProgress} compact />

            {/* ── Notes ── */}
            <NotesSection notes={notes} onSave={setNotes} onDraftChange={setNotesDraft} compact token={token} />

          </div>

          {/* ── Submit sticky ── */}
          <div style={{ flexShrink: 0, padding: '14px 22px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <button
              onClick={handleSubmitCustom}
              disabled={!customName.trim()}
              style={{
                width: '100%', padding: '14px', background: 'var(--accent)', border: 'none', borderRadius: 9,
                color: '#fff', fontWeight: 700, fontSize: 17,
                cursor: customName.trim() ? 'pointer' : 'not-allowed',
                opacity: customName.trim() ? 1 : 0.5,
              }}
            >
              {isEditMode ? '✓ Enregistrer les modifications' : (customOnly ? '+ Créer la tâche' : '+ Créer la carte')}
            </button>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
