import { useState, useEffect, useCallback } from 'react';
import KanbanBoard from './components/KanbanBoard.jsx';
import GameModal from './components/GameModal.jsx';
import SearchModal from './components/SearchModal.jsx';

const API = import.meta.env.VITE_API_URL || '/api';

export default function App() {
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [columns, setColumns] = useState([]);
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
      setColumns(data[0].columns || []);
    }
  }, [activeBoardId]);

  const fetchGames = useCallback(async (boardId) => {
    if (!boardId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/boards/${boardId}/games`);
      setGames(await res.json());
    } catch { setGames([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBoards(); }, []);

  useEffect(() => {
    if (!activeBoardId) return;
    const board = boards.find(b => b.id === activeBoardId);
    if (board) setColumns(board.columns || []);
    fetchGames(activeBoardId);
  }, [activeBoardId]);

  // ── Boards ────────────────────────────────────────────────────────────────

  const createBoard = async () => {
    const name = newBoardName.trim();
    if (!name) return;
    const res = await fetch(`${API}/boards`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const board = await res.json();
    setBoards(prev => [...prev, board]);
    setActiveBoardId(board.id);
    setColumns(board.columns || []);
    setGames([]);
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
      setColumns(remaining[0]?.columns || []);
      setGames([]);
    }
  };

  // ── Colonnes ──────────────────────────────────────────────────────────────

  const addColumn = async () => {
    const res = await fetch(`${API}/boards/${activeBoardId}/columns`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: 'Nouvelle colonne' }),
    });
    const col = await res.json();
    setColumns(prev => [...prev, col]);
    setBoards(prev => prev.map(b => b.id === activeBoardId
      ? { ...b, columns: [...(b.columns || []), col] } : b));
  };

  const renameColumn = async (colId, label) => {
    await fetch(`${API}/boards/${activeBoardId}/columns/${colId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
    const updated = columns.map(c => c.id === colId ? { ...c, label } : c);
    setColumns(updated);
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, columns: updated } : b));
  };

  const deleteColumn = async (colId) => {
    if (!confirm('Supprimer cette colonne ? Les jeux seront déplacés dans la première colonne.')) return;
    await fetch(`${API}/boards/${activeBoardId}/columns/${colId}`, { method: 'DELETE' });
    const updated = columns.filter(c => c.id !== colId);
    setColumns(updated);
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, columns: updated } : b));
    fetchGames(activeBoardId);
  };

  // ── Jeux ──────────────────────────────────────────────────────────────────

  const addGame = async (game) => {
    await fetch(`${API}/boards/${activeBoardId}/games`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appid: game.appid }),
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column }),
    });
  }, [activeBoardId]);

  // ── Render ────────────────────────────────────────────────────────────────

  const filtered = games.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase())
  );

  const byColumn = columns.reduce((acc, col) => {
    acc[col.id] = filtered.filter(g => g.column === col.id);
    return acc;
  }, {});

  const activeBoard = boards.find(b => b.id === activeBoardId);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Sidebar */}
      <aside style={{
        width: 210, background: '#111', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{
          padding: '14px 14px 10px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>🎮</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Steam Kanban</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
          {boards.map(b => (
            <div
              key={b.id}
              onClick={() => { setActiveBoardId(b.id); setColumns(b.columns || []); }}
              style={{
                padding: '8px 10px', borderRadius: 7, cursor: 'pointer', marginBottom: 2,
                background: activeBoardId === b.id ? 'var(--accent-dim)' : 'transparent',
                borderLeft: activeBoardId === b.id ? '3px solid var(--accent)' : '3px solid transparent',
                color: activeBoardId === b.id ? 'var(--text)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background .12s',
              }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{b.name}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>{b.gameCount}</span>
              <button
                onClick={e => { e.stopPropagation(); deleteBoard(b.id); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, padding: 0, opacity: 0, cursor: 'pointer' }}
                className="del-btn"
              >✕</button>
            </div>
          ))}
        </div>

        <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
          {showNewBoard ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <input
                autoFocus value={newBoardName}
                onChange={e => setNewBoardName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createBoard()}
                placeholder="Nom du board"
                style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontSize: 12, outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={createBoard} style={{ flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 5, padding: '5px', color: '#fff', fontSize: 11, fontWeight: 700 }}>Créer</button>
                <button onClick={() => setShowNewBoard(false)} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '5px', color: 'var(--text-muted)', fontSize: 11 }}>Annuler</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewBoard(true)} style={{
              width: '100%', background: 'none',
              border: '1px dashed var(--border)', borderRadius: 7,
              padding: '7px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
            }}>+ Nouveau board</button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <header style={{
          background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>
            {activeBoard?.name || '—'}
          </span>
          <input
            type="search" placeholder="Filtrer..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '6px 10px', color: 'var(--text)', fontSize: 12, outline: 'none', maxWidth: 200,
            }}
          />
          {activeBoardId && (
            <>
              <button onClick={addColumn} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '6px 12px', color: 'var(--text-muted)', fontSize: 12,
              }}>+ Colonne</button>
              <button onClick={() => setShowSearch(true)} style={{
                marginLeft: 'auto', background: 'var(--accent)', border: 'none',
                borderRadius: 7, padding: '7px 16px', color: '#fff', fontWeight: 700, fontSize: 12,
              }}>+ Ajouter un jeu</button>
            </>
          )}
        </header>

        {/* Content */}
        {!activeBoardId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Crée un board pour commencer
          </div>
        ) : loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Chargement...
          </div>
        ) : games.length === 0 && columns.length > 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ fontSize: 36 }}>🎮</div>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>Board vide</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Recherche un jeu pour l'ajouter</div>
            <button onClick={() => setShowSearch(true)} style={{
              background: 'var(--accent)', border: 'none', borderRadius: 8,
              padding: '10px 24px', color: '#fff', fontWeight: 700, fontSize: 13,
            }}>+ Ajouter un jeu</button>
          </div>
        ) : (
          <KanbanBoard
            columns={columns}
            byColumn={byColumn}
            dragging={dragging}
            setDragging={setDragging}
            moveGame={moveGame}
            onCardClick={setSelectedGame}
            onRemoveGame={removeGame}
            onRenameColumn={renameColumn}
            onDeleteColumn={deleteColumn}
          />
        )}
      </div>

      {showSearch && (
        <SearchModal api={API} boardGames={games} onAdd={addGame} onClose={() => setShowSearch(false)} />
      )}
      {selectedGame && (
        <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} api={API} />
      )}
    </div>
  );
}
