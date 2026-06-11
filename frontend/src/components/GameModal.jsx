import { useState, useEffect } from 'react';
import NotesSection from './NotesSection.jsx';

function formatPlaytime(minutes) {
  if (!minutes || minutes === 0) return 'Jamais joué';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function GameModal({ game, onClose, api, token, onPatchGame, defaultTab = 'achievements' }) {
  const [achievements, setAchievements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(defaultTab);
  const [filter, setFilter] = useState('all');
  const notesCount = (game.notes || []).length;
  const isDone   = !!game.done;
  const isUrgent = !!game.urgent;
  const handleSaveNotes    = (notes)   => { if (onPatchGame) onPatchGame(game.appid, { notes }); };
  const handleToggleDone   = ()        => { if (onPatchGame) onPatchGame(game.appid, { done: !isDone }); };
  const handleToggleUrgent = ()        => { if (onPatchGame) onPatchGame(game.appid, { urgent: !isUrgent }); };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${api}/steam/achievements/${game.appid}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  const filteredAchievements = achievements?.achievements?.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  }) || [];

  return (
    <div onClick={handleBackdrop} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 20, backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
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
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
          <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{game.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
              ⏱ {formatPlaytime(game.playtime_minutes)}
              {achievements && achievements.total > 0 && (
                <span style={{ marginLeft: 12 }}>
                  🏆 {achievements.unlocked}/{achievements.total} succès ({achievements.percent}%)
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

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '8px 16px 0', flexShrink: 0 }}>
          {[['achievements', '🏆 Succès'], ['info', 'ℹ️ Infos'], ['notes', `📝 Notes${notesCount > 0 ? ` (${notesCount})` : ''}`]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              background: 'none', border: 'none',
              borderBottom: tab === id ? '2px solid var(--accent)' : '2px solid transparent',
              padding: '6px 12px', color: tab === id ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: tab === id ? 600 : 400, fontSize: 13, marginBottom: -1, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {tab === 'achievements' && (
            <>
              {achievements && achievements.total > 0 && (
                <div style={{ padding: '10px 16px', flexShrink: 0, display: 'flex', gap: 6 }}>
                  {[['all', 'Tous', achievements.total], ['unlocked', '✅ Débloqués', achievements.unlocked], ['locked', '🔒 Verrouillés', achievements.total - achievements.unlocked]].map(([id, label, count]) => (
                    <button key={id} onClick={() => setFilter(id)} style={{
                      background: filter === id ? 'var(--accent)' : 'var(--surface2)',
                      border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px',
                      color: filter === id ? '#000' : 'var(--text-muted)',
                      fontSize: 12, fontWeight: filter === id ? 600 : 400, cursor: 'pointer',
                    }}>{label} {count}</button>
                  ))}
                </div>
              )}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
                {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Chargement des succès...</div>}
                {!loading && !achievements && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Aucun succès disponible pour ce jeu.</div>}
                {!loading && achievements?.total === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Ce jeu n'a pas de succès.</div>}
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
          )}

          {tab === 'info' && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Terminée + Urgent côte à côte */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleToggleDone} style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                  background: isDone ? 'rgba(61,184,106,0.12)' : 'var(--surface2)',
                  border: `1.5px solid ${isDone ? '#3db86a' : 'var(--border)'}`,
                  borderRadius: 9, padding: '11px 14px', cursor: 'pointer',
                  transition: 'all .15s', textAlign: 'left',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${isDone ? '#3db86a' : 'rgba(255,255,255,0.25)'}`,
                    background: isDone ? '#3db86a' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isDone && <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isDone ? '#3db86a' : 'var(--text)' }}>
                    {isDone ? 'Terminée ✓' : 'Terminée'}
                  </span>
                </button>
                <button onClick={handleToggleUrgent} style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                  background: isUrgent ? 'rgba(220,40,40,0.12)' : 'var(--surface2)',
                  border: `1.5px solid ${isUrgent ? 'rgba(220,60,60,0.6)' : 'var(--border)'}`,
                  borderRadius: 9, padding: '11px 14px', cursor: 'pointer',
                  transition: 'all .15s', textAlign: 'left',
                }}>
                  <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>⚠</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isUrgent ? '#ff6060' : 'var(--text-muted)' }}>
                    {isUrgent ? 'Urgent !' : 'Urgent'}
                  </span>
                </button>
              </div>
              {/* Infos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['App ID', game.appid],
                  ['Temps de jeu', formatPlaytime(game.playtime_minutes)],
                  ['Store Steam', <a href={`https://store.steampowered.com/app/${game.appid}`} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Ouvrir ↗</a>],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: 'var(--text-muted)', minWidth: 100, fontSize: 13 }}>{label}</span>
                    <span style={{ fontSize: 13 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <NotesSection
                notes={game.notes || []}
                onSave={handleSaveNotes}
                compact={false}
                token={token}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
