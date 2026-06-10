import { useState, useEffect, useCallback } from 'react';
import KanbanBoard from './components/KanbanBoard.jsx';
import GameModal from './components/GameModal.jsx';

const API = import.meta.env.VITE_API_URL || '/api';

const COLUMNS = [
  { id: 'backlog',    label: 'Backlog',     emoji: '📦', color: '#4a4a6a' },
  { id: 'playing',   label: 'En cours',    emoji: '🎮', color: '#1a6b3c' },
  { id: 'finished',  label: 'Terminé',     emoji: '✅', color: '#1a4a6b' },
  { id: 'platinum',  label: 'Platine',     emoji: '🏆', color: '#7a5a1a' },
];

export default function App() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [dragging, setDragging] = useState(null);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/games`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setGames(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  const moveGame = useCallback(async (appid, column) => {
    // Optimistic update
    setGames(prev => prev.map(g => g.appid === appid ? { ...g, column } : g));
    try {
      await fetch(`${API}/kanban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appid, column }),
      });
    } catch (e) {
      console.error('Erreur sauvegarde kanban:', e);
    }
  }, []);

  const filtered = games.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const byColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = filtered.filter(g => g.column === col.id);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{
        background: 'var(--steam)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 256 259" fill="none">
            <path d="M128 0C57.3 0 0 57.3 0 128c0 56.4 36.3 104.5 87.1 121.8L128 128l40.9 121.8C219.7 232.5 256 184.4 256 128 256 57.3 198.7 0 128 0z" fill="#1b2838"/>
            <path d="M128 22c-58.4 0-106 47.6-106 106S69.6 234 128 234s106-47.6 106-106S186.4 22 128 22z" fill="#c7d5e0"/>
          </svg>
          <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--steam-light)' }}>Steam Kanban</span>
        </div>

        <input
          type="search"
          placeholder="Rechercher un jeu..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1,
            maxWidth: 320,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '7px 12px',
            color: 'var(--text)',
            fontSize: 13,
            outline: 'none',
          }}
        />

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', color: 'var(--text-muted)', fontSize: 13 }}>
          {COLUMNS.map(col => (
            <span key={col.id}>{col.emoji} {byColumn[col.id]?.length || 0}</span>
          ))}
          <span style={{ color: 'var(--text-muted)' }}>· {games.length} jeux total</span>
        </div>

        <button
          onClick={fetchGames}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: '6px 10px',
            color: 'var(--text)',
            fontSize: 13,
          }}
          title="Actualiser"
        >↻</button>
      </header>

      {/* Content */}
      {loading && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <div>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>⏳</div>
            <div>Chargement de ta bibliothèque Steam...</div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            background: '#3a1a1a',
            border: '1px solid #6a2a2a',
            borderRadius: 10,
            padding: 24,
            maxWidth: 500,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ color: '#ff6b6b', fontWeight: 600, marginBottom: 8 }}>Erreur de connexion</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{error}</div>
            <button onClick={fetchGames} style={{
              marginTop: 16,
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              color: '#000',
              fontWeight: 600,
            }}>Réessayer</button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <KanbanBoard
          columns={COLUMNS}
          byColumn={byColumn}
          dragging={dragging}
          setDragging={setDragging}
          moveGame={moveGame}
          onCardClick={setSelectedGame}
        />
      )}

      {selectedGame && (
        <GameModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          api={API}
        />
      )}
    </div>
  );
}
