import { useState, useEffect } from 'react';
import NotesSection from './NotesSection.jsx';
import { StatusToggles, DatePicker } from './CardControls.jsx';
import { formatPlaytime, authHeaders } from '../utils.js';
import ModalBackdrop from './ModalBackdrop.jsx';
import SwipeTabs from './SwipeTabs.jsx';
import { useLang } from '../i18n.js';

export default function GameModal({ game, onClose, api, token, onPatchGame, onSoftDeleteNote, defaultTab = 'achievements', currentUser, appUsers = [] }) {
  const { t } = useLang();
  const [achievements, setAchievements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(defaultTab);
  const [filter, setFilter] = useState('all');
  const notesCount = (game.notes || []).filter(n => !n.deletedAt).length;
  const isDone   = !!game.done;
  const isUrgent = !!game.urgent;
  const handleSaveNotes    = (notes)   => { if (onPatchGame) onPatchGame(game.appid, { notes }); };
  const handleToggleDone   = ()        => { if (onPatchGame) onPatchGame(game.appid, { done: !isDone }); };
  const handleToggleUrgent = ()        => { if (onPatchGame) onPatchGame(game.appid, { urgent: !isUrgent }); };

  // Date state
  const [dateMode,  setDateMode]  = useState(game.startDate ? 'period' : game.dueDate ? 'single' : 'none');
  const [dueDate,   setDueDate]   = useState(game.dueDate   || '');
  const [startDate, setStartDate] = useState(game.startDate || '');
  const [endDate,   setEndDate]   = useState(game.endDate   || '');
  const [dueTime,   setDueTime]   = useState(game.dueTime   || '');
  const [startTime, setStartTime] = useState(game.startTime || '');
  const [endTime,   setEndTime]   = useState(game.endTime   || '');

  const handleDateModeChange = (mode) => {
    setDateMode(mode);
    if (mode === 'none')   { setDueDate(''); setStartDate(''); setEndDate(''); setDueTime(''); setStartTime(''); setEndTime(''); if (onPatchGame) onPatchGame(game.appid, { dueDate: null, startDate: null, endDate: null, dueTime: null, startTime: null, endTime: null }); }
    if (mode === 'single') { setStartDate(''); setEndDate(''); setStartTime(''); setEndTime(''); }
    if (mode === 'period') { setDueDate(''); setDueTime(''); }
  };
  const handleDueDateChange   = (v) => { setDueDate(v);   if (onPatchGame) onPatchGame(game.appid, { dueDate: v || null }); };
  const handleStartDateChange = (v) => { setStartDate(v); if (onPatchGame) onPatchGame(game.appid, { startDate: v || null }); };
  const handleEndDateChange   = (v) => { setEndDate(v);   if (onPatchGame) onPatchGame(game.appid, { endDate: v || null }); };
  const handleDueTimeChange   = (v) => { setDueTime(v);   if (onPatchGame) onPatchGame(game.appid, { dueTime: v || null }); };
  const handleStartTimeChange = (v) => { setStartTime(v); if (onPatchGame) onPatchGame(game.appid, { startTime: v || null }); };
  const handleEndTimeChange   = (v) => { setEndTime(v);   if (onPatchGame) onPatchGame(game.appid, { endTime: v || null }); };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${api}/steam/achievements/${game.appid}`, {
          headers: token ? authHeaders(token) : {},
        });
        const data = await res.json();
        const achs = data.achievements || [];
        const unlocked = achs.filter(a => a.achieved).length;
        setAchievements({
          achievements: achs.map(a => ({ ...a, unlocked: a.achieved })),
          total: achs.length,
          unlocked,
          percent: achs.length > 0 ? Math.round(unlocked / achs.length * 100) : 0,
        });
      } catch {
        setAchievements(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [game.appid, api, token]);

  const filteredAchievements = achievements?.achievements?.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  }) || [];

  return (
    <ModalBackdrop onClose={onClose}>
      <div style={{
        background: 'var(--surface)', border: '2px solid var(--border)', borderRadius: 14,
        width: '100%', maxWidth: 620, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header with game art */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img
            src={game.header_img} alt={game.name}
            style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--surface) 0%, transparent 60%)' }} />
          <button onClick={onClose} style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
          <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{game.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              ⏱ {formatPlaytime(game.playtime_minutes, t('game.never_played'))}
              {achievements && achievements.total > 0 && (
                <span style={{ marginLeft: 12 }}>
                  🏆 {achievements.unlocked}/{achievements.total} {t('game.tab_achievements').replace('🏆 ', '')} ({achievements.percent}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {achievements && achievements.total > 0 && (
          <div style={{ padding: '0 16px', flexShrink: 0 }}>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${achievements.percent}%`,
                background: achievements.percent === 100 ? 'var(--gold)' : 'var(--accent)',
                borderRadius: 2, transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}

        <SwipeTabs
          tabs={[
            { id: 'achievements', label: t('game.tab_achievements') },
            { id: 'info',         label: t('game.tab_info') },
            { id: 'notes',        label: `${t('game.tab_notes')}${notesCount > 0 ? ` (${notesCount})` : ''}` },
          ]}
          activeTab={tab}
          onTabChange={setTab}
        >

          {/* ── Panneau Succès ── */}
          <>
            {achievements && achievements.total > 0 && (
              <div style={{ padding: '10px 16px', flexShrink: 0, display: 'flex', gap: 6 }}>
                {[['all', t('game.filter_all'), achievements.total], ['unlocked', t('game.filter_unlocked'), achievements.unlocked], ['locked', t('game.filter_locked'), achievements.total - achievements.unlocked]].map(([id, label, count]) => (
                  <button key={id} onClick={() => setFilter(id)} style={{
                    background: filter === id ? 'var(--accent)' : 'var(--surface2)',
                    border: '2px solid var(--border)', borderRadius: 6, padding: '4px 10px',
                    color: filter === id ? '#000' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: filter === id ? 600 : 400, cursor: 'pointer',
                  }}>{label} {count}</button>
                ))}
              </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
              {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>{t('game.loading_ach')}</div>}
              {!loading && !achievements && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>{t('game.no_ach')}</div>}
              {!loading && achievements?.total === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>{t('game.no_ach_game')}</div>}
              {!loading && filteredAchievements.map((a, i) => (
                <div key={a.apiname || i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0', borderBottom: '1px solid var(--border)',
                  opacity: a.unlocked ? 1 : 0.5,
                }}>
                  {a.icon ? (
                    <img src={a.icon} alt="" style={{ width: 40, height: 40, borderRadius: 6, flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div style={{ width: 40, height: 40, background: 'var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{a.unlocked ? '✅' : '🔒'}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>{a.name}</div>
                    {a.description && <div style={{ color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.4 }}>{a.description}</div>}
                  </div>
                  {a.unlocked && <div style={{ color: 'var(--accent)', fontSize: 11, flexShrink: 0 }}>✓</div>}
                </div>
              ))}
            </div>
          </>

          {/* ── Panneau Infos ── */}
          <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Terminée + Urgent */}
            <StatusToggles
              isDone={isDone} onToggleDone={handleToggleDone}
              isUrgent={isUrgent} onToggleUrgent={handleToggleUrgent}
            />

            {/* Date */}
            <DatePicker
              dateMode={dateMode}
              onDateModeChange={handleDateModeChange}
              dueDate={dueDate}
              onDueDateChange={handleDueDateChange}
              dueTime={dueTime}
              onDueTimeChange={handleDueTimeChange}
              startDate={startDate}
              onStartDateChange={handleStartDateChange}
              startTime={startTime}
              onStartTimeChange={handleStartTimeChange}
              endDate={endDate}
              onEndDateChange={handleEndDateChange}
              endTime={endTime}
              onEndTimeChange={handleEndTimeChange}
            />
            {/* Infos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['App ID', game.appid],
                [t('game.playtime'), formatPlaytime(game.playtime_minutes, t('game.never_played'))],
                [t('game.store'), <a href={`https://store.steampowered.com/app/${game.appid}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>{t('game.open')}</a>],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: 'var(--text-muted)', minWidth: 100, fontSize: 13 }}>{label}</span>
                  <span style={{ fontSize: 13 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Panneau Notes ── */}
          <div style={{ overflowY: 'auto', padding: 16 }}>
            <NotesSection
              notes={game.notes || []}
              onSave={handleSaveNotes}
              onSoftDeleteNote={onSoftDeleteNote ? (noteId) => onSoftDeleteNote(game.appid, noteId) : undefined}
              draftKey={`game_${game.appid}`}
              compact={false}
              token={token}
              currentUser={currentUser}
              appUsers={appUsers}
            />
          </div>

        </SwipeTabs>
      </div>
    </ModalBackdrop>
  );
}
