import { useState, useEffect } from 'react';
import NotesSection from './NotesSection.jsx';
import { StatusToggles, DatePicker } from './CardControls.jsx';
import { formatPlaytime, authHeaders } from '../utils.js';
import ModalBackdrop from './ModalBackdrop.jsx';
import SwipeTabs from './SwipeTabs.jsx';
import { useLang } from '../i18n.js';
import { isSteamAccessBlocked, SteamAccessNotice } from './SteamUI.jsx';

export default function GameModal({ game, onClose, api, token, onPatchGame, onSoftDeleteNote, defaultTab = 'info', currentUser, appUsers = [] }) {
  const { t } = useLang();
  const steamBlocked = isSteamAccessBlocked(currentUser);
  const [achievements, setAchievements] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);
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

  // Infos publiques Steam (joueurs en ligne, avis, Metacritic, prix, genres…) —
  // même endpoint que le cartouche d'en-tête (SteamEncart), mis en cache côté
  // serveur par appid, donc sûr à appeler par carte sans surcharge.
  useEffect(() => {
    async function loadInfo() {
      try {
        const res = await fetch(`${api}/steam/gameinfo/${game.appid}`, {
          headers: token ? authHeaders(token) : {},
        });
        setGameInfo(res.ok ? await res.json() : null);
      } catch {
        setGameInfo(null);
      }
    }
    loadInfo();
  }, [game.appid, api, token]);

  const filteredAchievements = (achievements?.achievements?.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  }) || []).slice().sort((a, b) => (a.unlocked === b.unlocked ? 0 : a.unlocked ? -1 : 1));

  // Couleurs/emoji de la pastille avis, identiques à SteamEncart
  const reviewScoreVal = gameInfo?.reviewScore ?? 0;
  const reviewColor = reviewScoreVal >= 8 ? '#4cd882' : reviewScoreVal >= 5 ? '#f5c518' : '#f87575';
  const reviewEmoji = reviewScoreVal >= 8 ? '👍' : reviewScoreVal >= 5 ? '😐' : '👎';

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
            { id: 'info',         label: t('game.tab_info') },
            { id: 'notes',        label: `${t('game.tab_notes')}${notesCount > 0 ? ` (${notesCount})` : ''}` },
            { id: 'achievements', label: t('game.tab_achievements') },
          ]}
          activeTab={tab}
          onTabChange={setTab}
        >

          {/* ── Panneau Infos ── */}
          <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Cartouche infos Steam (joueurs, avis, Metacritic, prix, genres…) */}
            {gameInfo && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 12px', fontSize: 12,
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  {gameInfo.playerCount !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3db86a', boxShadow: '0 0 6px #3db86a88', display: 'inline-block', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{gameInfo.playerCount.toLocaleString('fr-FR')}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1 }}>{t('ginfo.in_game')}</div>
                      </div>
                    </div>
                  )}
                  {gameInfo.reviewScoreDesc && (
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                      onClick={() => window.open(`https://store.steampowered.com/app/${game.appid}/#app_reviews_hash`, '_blank')}
                      title={t('ginfo.see_reviews')}
                    >
                      <span style={{ fontSize: 14, lineHeight: 1 }}>{reviewEmoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: reviewColor, lineHeight: 1.2 }}>{gameInfo.reviewScoreDesc}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1 }}>
                          {gameInfo.positivePercent !== null ? t('ginfo.positive_pct', { percent: gameInfo.positivePercent }) : ''}
                          {gameInfo.totalReviews ? ` · ${gameInfo.totalReviews.toLocaleString('fr-FR')}` : ''}
                        </div>
                      </div>
                    </div>
                  )}
                  {gameInfo.metacritic !== null && (
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: gameInfo.metacriticUrl ? 'pointer' : 'default' }}
                      onClick={() => gameInfo.metacriticUrl && window.open(gameInfo.metacriticUrl, '_blank')}
                      title={gameInfo.metacriticUrl ? t('ginfo.see_metacritic') : undefined}
                    >
                      <div style={{ width: 24, height: 24, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#000', background: gameInfo.metacritic >= 75 ? '#6c3' : gameInfo.metacritic >= 50 ? '#fc3' : '#f00', flexShrink: 0 }}>
                        {gameInfo.metacritic}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.3 }}>Meta<br/>critic</div>
                    </div>
                  )}
                  {gameInfo.price && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {gameInfo.discount > 0 && (
                        <span style={{ background: '#4c6b22', color: '#a4d007', fontWeight: 900, fontSize: 10, padding: '1px 4px', borderRadius: 3, flexShrink: 0 }}>
                          -{gameInfo.discount}%
                        </span>
                      )}
                      <div>
                        {gameInfo.discount > 0 && gameInfo.priceInitial && (
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', textDecoration: 'line-through', lineHeight: 1 }}>{gameInfo.priceInitial}</div>
                        )}
                        <div style={{ fontWeight: 700, color: gameInfo.discount > 0 ? '#a4d007' : 'var(--text)', lineHeight: 1.2 }}>{gameInfo.price}</div>
                      </div>
                    </div>
                  )}
                </div>
                {(gameInfo.genres?.length || gameInfo.multiplayerLabel || gameInfo.earlyAccess || gameInfo.comingSoon) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {gameInfo.earlyAccess && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(220,50,50,0.18)', color: '#ff5555', border: '2px solid rgba(220,50,50,0.85)', whiteSpace: 'nowrap' }}>{t('ginfo.early_access')}</span>
                    )}
                    {gameInfo.comingSoon && !gameInfo.earlyAccess && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(245,197,24,0.12)', color: '#f5c518', border: '2px solid rgba(245,197,24,0.75)', whiteSpace: 'nowrap' }}>{t('ginfo.coming_soon')}</span>
                    )}
                    {gameInfo.multiplayerLabel && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'rgba(71,167,245,0.15)', color: '#47a7f5', border: '2px solid rgba(71,167,245,0.75)', whiteSpace: 'nowrap' }}>👥 {gameInfo.multiplayerLabel}</span>
                    )}
                    {(gameInfo.genres || []).map(g => (
                      <span key={g} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)', border: '2px solid rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>{g}</span>
                    ))}
                  </div>
                )}
                {(gameInfo.developer || gameInfo.releaseDate) && (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 10, color: 'var(--text-muted)' }}>
                    {gameInfo.developer && <span>🛠 {gameInfo.developer}</span>}
                    {gameInfo.developer && gameInfo.releaseDate && <span style={{ opacity: 0.4 }}>·</span>}
                    {gameInfo.releaseDate && <span>📅 {gameInfo.releaseDate}</span>}
                  </div>
                )}
              </div>
            )}

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
              {!loading && steamBlocked && (!achievements || achievements?.total === 0) && <SteamAccessNotice />}
              {!loading && !steamBlocked && !achievements && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>{t('game.no_ach')}</div>}
              {!loading && !steamBlocked && achievements?.total === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>{t('game.no_ach_game')}</div>}
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

        </SwipeTabs>
      </div>
    </ModalBackdrop>
  );
}
