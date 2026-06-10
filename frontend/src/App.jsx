import { useState, useEffect, useCallback } from 'react';
import KanbanBoard from './components/KanbanBoard.jsx';
import GameModal from './components/GameModal.jsx';
import SearchModal from './components/SearchModal.jsx';

const API = import.meta.env.VITE_API_URL || '/api';

const COLUMNS = [
  { id: 'backlog',   label: 'Backlog',   emoji: '📦', color: '#4a4a6a' },
  { id: 'playing',  label: 'En cours',  emoji: '🎮', color: '#1a6b3c' },
  { id: 'finished', label: 'Terminé',   emoji: '✅', color: '#1a4a6b' },
  { id: 'platinum', label: 'Platine',   emoji: '🏆', color: '#7a5a1a' },
];

export default function App() {
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [showNewBoard, setShowNewBoard] = useState(false);

  const fetchBoards = useCallback(async () => {
    const res = await fetch(`${API}/boards`);
    const data = await res.json();
    setBoards(data);
    if (data.length > 0 && !activeBoardId) {
      setActiveBoardId(data[0].id);
    }
  }, [activeBoardId]);

  const fetchGames = useCallback(async (boardId) => {
    if (!boardId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/boards/${boardId}/games`);
      const data = await res.json();
      setGames(Array.isArray(data) ? data : []);
    } catch {
      setGames([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoards(); }, []);
  useEffect(() => { if (activeBoardId) fetchGames(activeBoardId); }, [activeBoardId]);

  const createBoard = async () => {
    const name = newBoardName.trim();
    if (!name) return;
    const res = await fetch(`${API}/boards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const board = await res.json();
    setBoards(prev => [...prev, board]);
    setActiveBoardId(board.id);
    setNewBoardName('');
    setShowNewBoard(false);
  };

  const deleteBoard = async (boardId) => {
    if (!confirm('Supprimer ce board ?')) return;
    await fetch(`${API}/boards/${boardId}`, { method: 'DELETE' });
    const remaining = boards.filter(b => b.id !== boardId);
    setBoards(remaining);
    if (activeBoardId === boardId) {
      setActiveBoardId(remaining[0]?.id || null);
      setGames([]);
    }
  };

  const addGame = async (game) => {
    await fetch(`${API}/boards/${activeBoardId}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appid: game.appid, column: 'backlog' }),
    });
    fetchGames(activeBoardId);
  };

  const removeGame = async (appid) => {
    await fetch(`${API}/boards/${activeBoardId}/games/${appid}`, { method: 'DELETE' });
    setGames(prev => prev.filter(g => g.appid !== appid));
  };

  const moveGame = useCallback(async (appid, column) => {
    setGames(prev => prev.map(g => g.appid === appid ? { ...g, column } : g));
    await fetch(`${API}/boards/${activeBoardId}/games/${appid}/column`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column }),
    });
  }, [activeBoardId]);

  const filtered = games.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase())
  );

  const byColumn = COLUMNS.reduce((acc, col) => {
    acc[col.id] = filtered.filter(g => g.column === col.id);
    return acc;
  }, {});

  const activeBoard = boards.find(b => b.id === activeBoardId);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar boards */}
      <aside style={{
        width: 200,
        background: '#111113',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{ padding: '14px 12px 8px', color: '#c7d5e0', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--border)' }}>
          🎮 Mes boards
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          {boards.map(b => (
            <div
              key={b.id}
              onClick={() => setActiveBoardId(b.id)}
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                background: activeBoardId === b.id ? 'var(--surface2)' : 'transparent',
                color: activeBoardId === b.id ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 2,
              }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{b.gameCount}</span>
              <button
                onClick={e => { e.stopPropagation(); deleteBoard(b.id); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, padding: 0, opacity: 0.5 }}
                title="Supprimer"
              >✕</button>
            </div>
          ))}
        </div>

        {/* Nouveau board */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
          {showNewBoard ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <input
                autoFocus
                value={newBoardName}
                onChange={e => setNewBoardName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createBoard()}
                placeholder="Nom du board"
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 5,
                  padding: '5px 8px',
                  color: 'var(--text)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={createBoard} style={{ flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 5, padding: '4px', color: '#000', fontSize: 11, fontWeight: 600 }}>Créer</button>
                <button onClick={() => setShowNewBoard(false)} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px', color: 'var(--text-muted)', fontSize: 11 }}>Annuler</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewBoard(true)}
              style={{
                width: '100%',
                background: 'none',
                border: '1px dashed var(--border)',
                borderRadius: 6,
                padding: '6px',
                color: 'var(--text-muted)',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >+ Nouveau board</button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{
          background: 'var(--steam)',
          borderBottom: '1px solid var(--border)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#c7d5e0' }}>
            {activeBoard?.name || 'Sélectionne un board'}
          </span>

          <input
            type="search"
            placeholder="Filtrer les jeux..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, maxWidth: 240,
              background: 'rgba(255,255,255,.08)',
              border: '1px solid var(--border)',
              borderRadius: 6, padding: '6px 10px',
              color: 'var(--text)', fontSize: 12, outline: 'none',
            }}
          />

          {activeBoardId && (
            <button
              onClick={() => setShowSearch(true)}
              style={{
                marginLeft: 'auto',
                background: 'var(--accent)',
                border: 'none', borderRadius: 6,
                padding: '6px 14px',
                color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >+ Ajouter un jeu</button>
          )}
        </header>

        {/* Board content */}
        {!activeBoardId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Crée un board pour commencer
          </div>
        ) : loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Chargement...
          </div>
        ) : games.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40 }}>🎮</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Ce board est vide</div>
            <div style={{ fontSize: 12 }}>Recherche un jeu pour l'ajouter</div>
            <button
              onClick={() => setShowSearch(true)}
              style={{
                background: 'var(--accent)', border: 'none', borderRadius: 8,
                padding: '10px 24px', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >+ Ajouter un jeu</button>
          </div>
        ) : (
          <KanbanBoard
            columns={COLUMNS}
            byColumn={byColumn}
            dragging={dragging}
            setDragging={setDragging}
            moveGame={moveGame}
            onCardClick={setSelectedGame}
            onRemoveGame={removeGame}
          />
        )}
      </div>

      {showSearch && (
        <SearchModal
          api={API}
          boardGames={games}
          onAdd={addGame}
          onClose={() => setShowSearch(false)}
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
