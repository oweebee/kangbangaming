import { useState, useEffect, useCallback, useRef } from 'react';
import KanbanBoard from './components/KanbanBoard.jsx';
import MobileBoard from './components/MobileBoard.jsx';
import GameModal from './components/GameModal.jsx';
import SearchModal from './components/SearchModal.jsx';
import LoginPage from './components/LoginPage.jsx';
import RegisterPage from './components/RegisterPage.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import SteamSettings from './components/SteamSettings.jsx';
import PublicBoards from './components/PublicBoards.jsx';

const EMOJIS = [
  '🎮','🕹️','🏆','🥇','⭐','💎','🔥','❄️','⚡','🎯',
  '📦','🚀','💀','👾','🛡️','⚔️','🗡️','🧩','🎲','🃏',
  '✅','⏳','🔒','🔓','💤','👀','🧠','💪','🎪','🌟',
  '📋','📌','🔖','🏁','🚩','💬','🎵','🎬','📺','🖥️',
];

function useMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = e => setMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return mobile;
}

function BoardEmojiPicker({ current, onSelect, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);
  return (
    <div ref={ref} style={{
      position: 'absolute', left: '100%', top: 0, zIndex: 100,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 8, marginLeft: 6,
      display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2,
      boxShadow: '0 8px 24px rgba(0,0,0,.6)',
    }}>
      <button onClick={() => onSelect('')} style={{ background: current === '' ? 'var(--accent-dim)' : 'none', border: current === '' ? '1px solid var(--accent)' : '1px solid transparent', borderRadius: 5, width: 28, height: 28, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
      {EMOJIS.map(e => (
        <button key={e} onClick={() => onSelect(e)} style={{ background: current === e ? 'var(--accent-dim)' : 'none', border: current === e ? '1px solid var(--accent)' : '1px solid transparent', borderRadius: 5, width: 28, height: 28, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{e}</button>
      ))}
    </div>
  );
}

const API = import.meta.env.VITE_API_URL || '/api';

function getSavedAuth() {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return token && user ? { token, user } : null;
  } catch { return null; }
}
function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function App() {
  const isMobile = useMobile();

  // Auth
  const [authPage, setAuthPage] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);

  // Modals
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSteamSettings, setShowSteamSettings] = useState(false);
  const [showPublicBoards, setShowPublicBoards] = useState(false);

  // Board state
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
  const [emojiPickerFor, setEmojiPickerFor] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // Board game search
  const [boardSearchQuery, setBoardSearchQuery] = useState('');
  const [boardSearchResults, setBoardSearchResults] = useState([]);
  const [boardSearchLoading, setBoardSearchLoading] = useState(false);
  const [selectedBoardGame, setSelectedBoardGame] = useState(null);
  const [showBoardSearch, setShowBoardSearch] = useState(false);
  const boardDebounce = useRef(null);

  useEffect(() => {
    const saved = getSavedAuth();
    if (saved) { setCurrentUser(saved.user); setToken(saved.token); }
  }, []);

  const handleLogin = (user, tok) => { setCurrentUser(user); setToken(tok); };
  const handleSteamSave = ({ steamAvatar, steamPersonaName }) => {
    setCurrentUser(prev => ({ ...prev, steamAvatar: steamAvatar || null, steamPersonaName: steamPersonaName || null }));
    // Persist to localStorage
    const saved = JSON.parse(localStorage.getItem('user') || '{}');
    localStorage.setItem('user', JSON.stringify({ ...saved, steamAvatar: steamAvatar || null, steamPersonaName: steamPersonaName || null }));
  };
  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setCurrentUser(null); setToken(null); setBoards([]); setActiveBoardId(null); setColumns([]); setGames([]);
  };

  const fetchBoards = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${API}/boards`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { handleLogout(); return; }
    const data = await res.json();
    setBoards(data);
    if (data.length > 0 && !activeBoardId) { setActiveBoardId(data[0].id); setColumns(data[0].columns || []); }
  }, [token, activeBoardId]);

  const fetchGames = useCallback(async (boardId) => {
    if (!boardId || !token) return;
    setLoading(true);
    try { const res = await fetch(`${API}/boards/${boardId}/games`, { headers: { Authorization: `Bearer ${token}` } }); setGames(await res.json()); }
    catch { setGames([]); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (token) fetchBoards(); }, [token]);
  useEffect(() => {
    if (!activeBoardId) return;
    const board = boards.find(b => b.id === activeBoardId);
    if (board) setColumns(board.columns || []);
    fetchGames(activeBoardId);
  }, [activeBoardId]);

  // Board game search
  const searchBoardGames = useCallback(async (q) => {
    if (!q.trim() || !token) { setBoardSearchResults([]); return; }
    setBoardSearchLoading(true);
    try {
      const res = await fetch(`${API}/steam/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
      setBoardSearchResults((await res.json()).slice(0, 6));
    } catch { setBoardSearchResults([]); } finally { setBoardSearchLoading(false); }
  }, [token]);

  const handleBoardSearchInput = (val) => {
    setBoardSearchQuery(val);
    clearTimeout(boardDebounce.current);
    boardDebounce.current = setTimeout(() => searchBoardGames(val), 350);
  };
  const selectBoardGame = (game) => { setSelectedBoardGame(game); setNewBoardName(game.name); setShowBoardSearch(false); setBoardSearchQuery(''); setBoardSearchResults([]); };
  const clearBoardGame = () => { setSelectedBoardGame(null); setNewBoardName(''); };
  const resetNewBoard = () => { setShowNewBoard(false); setNewBoardName(''); setSelectedBoardGame(null); setBoardSearchQuery(''); setBoardSearchResults([]); setShowBoardSearch(false); };

  // Boards CRUD
  const createBoard = async () => {
    const name = newBoardName.trim();
    if (!name) return;
    const res = await fetch(`${API}/boards`, {
      method: 'POST', headers: authHeaders(token),
      body: JSON.stringify({ name, emoji: '', gameIcon: selectedBoardGame ? (selectedBoardGame.icon_img || selectedBoardGame.header_img) : null }),
    });
    const board = await res.json();
    setBoards(prev => [...prev, board]);
    setActiveBoardId(board.id); setColumns(board.columns || []); setGames([]);
    resetNewBoard();
  };

  const setBoardEmoji = async (boardId, emoji) => {
    await fetch(`${API}/boards/${boardId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ emoji }) });
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, emoji } : b));
  };

  const toggleBoardPublic = async (boardId, isPublic) => {
    await fetch(`${API}/boards/${boardId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ public: isPublic }) });
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, public: isPublic } : b));
  };

  const deleteBoard = async (boardId) => {
    if (!confirm('Supprimer ce board ?')) return;
    await fetch(`${API}/boards/${boardId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const remaining = boards.filter(b => b.id !== boardId);
    setBoards(remaining);
    if (activeBoardId === boardId) { setActiveBoardId(remaining[0]?.id || null); setColumns(remaining[0]?.columns || []); setGames([]); }
  };

  // Columns CRUD
  const addColumn = async () => {
    const res = await fetch(`${API}/boards/${activeBoardId}/columns`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ label: 'Nouvelle colonne' }) });
    const col = await res.json();
    setColumns(prev => [...prev, col]);
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, columns: [...(b.columns || []), col] } : b));
  };
  const renameColumn = async (colId, label) => {
    await fetch(`${API}/boards/${activeBoardId}/columns/${colId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ label }) });
    const updated = columns.map(c => c.id === colId ? { ...c, label } : c);
    setColumns(updated); setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, columns: updated } : b));
  };
  const setColumnEmoji = async (colId, emoji) => {
    await fetch(`${API}/boards/${activeBoardId}/columns/${colId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ emoji }) });
    const updated = columns.map(c => c.id === colId ? { ...c, emoji } : c);
    setColumns(updated); setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, columns: updated } : b));
  };
  const deleteColumn = async (colId) => {
    if (!confirm('Supprimer cette colonne ? Les jeux seront déplacés dans la première colonne.')) return;
    await fetch(`${API}/boards/${activeBoardId}/columns/${colId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const updated = columns.filter(c => c.id !== colId);
    setColumns(updated); setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, columns: updated } : b));
    fetchGames(activeBoardId);
  };

  // Games CRUD
  const addGame = async (game) => {
    const firstColId = columns[0]?.id;
    await fetch(`${API}/boards/${activeBoardId}/games`, {
      method: 'POST', headers: authHeaders(token),
      body: JSON.stringify({ appid: game.appid, name: game.name, header_img: game.header_img, icon_img: game.icon_img, column: firstColId, type: game.type || 'steam', emoji: game.emoji || null }),
    });
    fetchGames(activeBoardId);
  };
  const removeGame = async (appid) => {
    await fetch(`${API}/boards/${activeBoardId}/games/${appid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setGames(prev => prev.filter(g => g.appid !== appid));
  };
  const moveGame = useCallback(async (appid, column) => {
    setGames(prev => prev.map(g => g.appid === appid ? { ...g, column } : g));
    await fetch(`${API}/boards/${activeBoardId}/games/${appid}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ column }) });
  }, [activeBoardId, token]);

  // Auth screens
  if (!currentUser) {
    if (authPage === 'register') return <RegisterPage onLogin={handleLogin} onGoLogin={() => setAuthPage('login')} />;
    return <LoginPage onLogin={handleLogin} onGoRegister={() => setAuthPage('register')} />;
  }

  const filtered = games.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()));
  const byColumn = columns.reduce((acc, col) => { acc[col.id] = filtered.filter(g => g.column === col.id); return acc; }, {});
  const knownColIds = new Set(columns.map(c => c.id));
  const orphans = filtered.filter(g => !knownColIds.has(g.column));
  if (orphans.length > 0 && columns[0]) byColumn[columns[0].id] = [...(byColumn[columns[0].id] || []), ...orphans];
  const activeBoard = boards.find(b => b.id === activeBoardId);

  // ── Sidebar ───────────────────────────────────────────────────────────────

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28, fill: 'var(--accent)', flexShrink: 0 }}>
          <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256zM155.7 384.3l-30.5-12.6a52.79 52.79 0 0 0 27.2 25.8c26.9 11.2 57.8-1.6 69-28.4 5.4-13 5.5-27.3.1-40.3-5.4-13-15.5-23.2-28.5-28.6-12.7-5.3-26.4-5.5-38.8-1.4l31.5 13c19.8 8.2 29.2 30.9 20.9 50.7-8.3 19.9-31 29.2-50.9 21zm173.8-129.9c-34.4 0-62.4-28-62.4-62.3s28-62.3 62.4-62.3 62.4 28 62.4 62.3-27.9 62.3-62.4 62.3zm.1-15.6c25.9 0 46.9-21 46.9-46.8 0-25.9-21-46.8-46.9-46.8s-46.9 21-46.9 46.8c.1 25.8 21.1 46.8 46.9 46.8z"/>
        </svg>
        <span style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text)', flex: 1 }}>Kanban Gaming</span>
        {isMobile && <button onClick={() => setShowDrawer(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>}
      </div>

      {/* Boards publics button */}
      <div style={{ padding: '6px 6px 0' }}>
        <button
          onClick={() => { setShowPublicBoards(true); if (isMobile) setShowDrawer(false); }}
          style={{
            width: '100%', background: 'none', border: '1px solid var(--border)',
            borderRadius: 7, padding: '6px 8px', color: 'var(--text-muted)', fontSize: 11,
            cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 13 }}>🌐</span>
          <span>Boards Publics</span>
        </button>
      </div>

      {/* Boards list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px' }}>
        {boards.map(b => (
          <div key={b.id}
            onClick={() => { setActiveBoardId(b.id); setColumns(b.columns || []); setEmojiPickerFor(null); if (isMobile) setShowDrawer(false); }}
            style={{
              padding: '6px 8px', borderRadius: 7, cursor: 'pointer', marginBottom: 2,
              background: activeBoardId === b.id ? 'var(--accent-dim)' : 'transparent',
              borderLeft: activeBoardId === b.id ? '3px solid var(--accent)' : '3px solid transparent',
              color: activeBoardId === b.id ? 'var(--text)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'background .12s', position: 'relative',
            }}
          >
            {b.gameIcon ? (
              <img src={b.gameIcon} alt="" style={{ width: 22, height: 22, objectFit: 'cover', borderRadius: '50%', flexShrink: 0, border: '1px solid var(--border)' }} />
            ) : (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={e => { e.stopPropagation(); setEmojiPickerFor(emojiPickerFor === b.id ? null : b.id); }}
                  style={{ background: b.emoji ? 'transparent' : 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 4, width: 22, height: 22, fontSize: b.emoji ? 13 : 9, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >{b.emoji || '+'}</button>
                {emojiPickerFor === b.id && (
                  <BoardEmojiPicker current={b.emoji || ''} onSelect={emoji => { setBoardEmoji(b.id, emoji); setEmojiPickerFor(null); }} onClose={() => setEmojiPickerFor(null)} />
                )}
              </div>
            )}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{b.name}</span>
            {/* Public toggle */}
            <button
              onClick={e => { e.stopPropagation(); toggleBoardPublic(b.id, !b.public); }}
              title={b.public ? 'Board public — cliquer pour rendre privé' : 'Board privé — cliquer pour rendre public'}
              style={{ background: 'none', border: 'none', fontSize: 11, padding: 0, cursor: 'pointer', flexShrink: 0, opacity: b.public ? 1 : 0.3, lineHeight: 1 }}
            >{b.public ? '🌐' : '🔒'}</button>
            <button onClick={e => { e.stopPropagation(); deleteBoard(b.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, padding: 0, opacity: 0.4, cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>

      {/* New board form */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
        {showNewBoard ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {selectedBoardGame && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', borderRadius: 6, padding: '5px 8px' }}>
                <img src={selectedBoardGame.icon_img || selectedBoardGame.header_img} alt="" style={{ width: 22, height: 22, objectFit: 'cover', borderRadius: '50%', flexShrink: 0, border: '1px solid var(--border)' }} />
                <span style={{ flex: 1, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{selectedBoardGame.name}</span>
                <button onClick={clearBoardGame} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>✕</button>
              </div>
            )}
            {!selectedBoardGame && (
              <div style={{ position: 'relative' }}>
                {showBoardSearch ? (
                  <>
                    <input autoFocus value={boardSearchQuery} onChange={e => handleBoardSearchInput(e.target.value)} placeholder="Rechercher un jeu..."
                      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
                    {(boardSearchLoading || boardSearchResults.length > 0) && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, marginTop: 2, boxShadow: '0 8px 20px rgba(0,0,0,.5)', maxHeight: 200, overflowY: 'auto' }}>
                        {boardSearchLoading && <div style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)' }}>Recherche...</div>}
                        {boardSearchResults.map(g => (
                          <div key={g.appid} onClick={() => selectBoardGame(g)}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                            onMouseLeave={e => e.currentTarget.style.background = ''}>
                            <img src={g.header_img} alt="" style={{ width: 42, height: 24, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <button onClick={() => setShowBoardSearch(true)} style={{ width: '100%', background: 'var(--surface2)', border: '1px dashed var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', textAlign: 'left' }}>🎮 Associer un jeu Steam...</button>
                )}
              </div>
            )}
            <input autoFocus={!showBoardSearch} value={newBoardName} onChange={e => setNewBoardName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createBoard()} placeholder="Nom du board"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={createBoard} style={{ flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 5, padding: '5px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Créer</button>
              <button onClick={resetNewBoard} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '5px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewBoard(true)} style={{ width: '100%', background: 'none', border: '1px dashed var(--border)', borderRadius: 7, padding: '7px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer' }}>+ Nouveau board</button>
        )}
      </div>

      {/* User footer */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {currentUser.steamAvatar ? (
          <img src={currentUser.steamAvatar} alt="" style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid var(--border)', flexShrink: 0, cursor: 'pointer' }} onClick={() => setShowSteamSettings(true)} title="Paramètres Steam" />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--surface3)', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer' }} onClick={() => setShowSteamSettings(true)} title="Configurer Steam">👤</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUser.steamPersonaName || currentUser.username}
          </div>
          {currentUser.role === 'admin' && <div style={{ fontSize: 9, color: '#f5a500', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>admin</div>}
        </div>
        <button onClick={() => setShowSteamSettings(true)} title="Paramètres Steam" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 7px', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
          <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 12, height: 12, fill: 'currentColor', display: 'block' }}>
            <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256z"/>
          </svg>
        </button>
        {currentUser.role === 'admin' && (
          <button onClick={() => setShowAdmin(true)} title="Panneau admin" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 7px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>⚙️</button>
        )}
        <button onClick={handleLogout} title="Déconnexion" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 7px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>↪</button>
      </div>
    </>
  );

  // ── Mobile layout ─────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {showDrawer && (
          <>
            <div onClick={() => setShowDrawer(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200 }} />
            <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 288, background: '#111', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 201, boxShadow: '4px 0 24px rgba(0,0,0,.5)' }}>
              {sidebarContent}
            </aside>
          </>
        )}
        <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button onClick={() => setShowDrawer(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>☰</button>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeBoard?.name || 'Kanban Gaming'}</span>
          {activeBoardId && <button onClick={() => setShowSearch(true)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '7px 14px', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>+ Carte</button>}
        </header>
        {!activeBoardId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Crée un board pour commencer</div>
        ) : loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
        ) : games.length === 0 && columns.length > 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ fontSize: 36 }}>🎮</div>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>Board vide</div>
            <button onClick={() => setShowSearch(true)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '10px 24px', color: '#fff', fontWeight: 700, fontSize: 13 }}>+ Ajouter une carte</button>
          </div>
        ) : (
          <MobileBoard columns={columns} byColumn={byColumn} onCardClick={setSelectedGame} onRemoveGame={removeGame} />
        )}
        {activeBoardId && (
          <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '8px 12px', display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={addColumn} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px', color: 'var(--text-muted)', fontSize: 12 }}>+ Colonne</button>
          </div>
        )}
        <footer style={{ position: 'fixed', bottom: 0, right: 0, padding: '3px 10px', fontSize: 9, color: 'var(--text-muted)', pointerEvents: 'none' }}>Développé par Oweebee</footer>
        {showSearch && <SearchModal api={API} token={token} boardGames={games} onAdd={addGame} onRemove={removeGame} onClose={() => setShowSearch(false)} />}
        {selectedGame && <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} api={API} token={token} />}
        {showAdmin && <AdminPanel token={token} currentUser={currentUser} onClose={() => setShowAdmin(false)} />}
        {showSteamSettings && <SteamSettings token={token} onSave={handleSteamSave} onClose={() => setShowSteamSettings(false)} />}
        {showPublicBoards && <PublicBoards token={token} currentUser={currentUser} onClose={() => setShowPublicBoards(false)} />}
      </div>
    );
  }

  // ── Desktop layout ────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: 252, background: '#111', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {sidebarContent}
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>{activeBoard?.name || '—'}</span>
          {activeBoard && (
            <span
              onClick={() => toggleBoardPublic(activeBoard.id, !activeBoard.public)}
              title={activeBoard.public ? 'Public — cliquer pour rendre privé' : 'Privé — cliquer pour rendre public'}
              style={{ fontSize: 12, color: activeBoard.public ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {activeBoard.public ? '🌐 Public' : '🔒 Privé'}
            </span>
          )}
          <input type="search" placeholder="Filtrer..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text)', fontSize: 12, outline: 'none', maxWidth: 200 }} />
          {activeBoardId && (
            <>
              <button onClick={addColumn} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>+ Colonne</button>
              <button onClick={() => setShowSearch(true)} style={{ marginLeft: 'auto', background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '7px 16px', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ Ajouter une carte</button>
            </>
          )}
        </header>
        {!activeBoardId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Crée un board pour commencer</div>
        ) : loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
        ) : games.length === 0 && columns.length > 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{ fontSize: 36 }}>🎮</div>
            <div style={{ fontWeight: 700, color: 'var(--text)' }}>Board vide</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ajoute un jeu Steam ou crée une carte personnalisée</div>
            <button onClick={() => setShowSearch(true)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 8, padding: '10px 24px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Ajouter une carte</button>
          </div>
        ) : (
          <KanbanBoard columns={columns} byColumn={byColumn} dragging={dragging} setDragging={setDragging} moveGame={moveGame} onCardClick={setSelectedGame} onRemoveGame={removeGame} onRenameColumn={renameColumn} onDeleteColumn={deleteColumn} onSetEmoji={setColumnEmoji} />
        )}
      </div>
      <footer style={{ position: 'fixed', bottom: 0, right: 0, padding: '5px 12px', fontSize: 10, color: 'var(--text-muted)', pointerEvents: 'none' }}>Développé par Oweebee</footer>
      {showSearch && <SearchModal api={API} token={token} boardGames={games} onAdd={addGame} onRemove={removeGame} onClose={() => setShowSearch(false)} />}
      {selectedGame && <GameModal game={selectedGame} onClose={() => setSelectedGame(null)} api={API} token={token} />}
      {showAdmin && <AdminPanel token={token} currentUser={currentUser} onClose={() => setShowAdmin(false)} />}
      {showSteamSettings && <SteamSettings token={token} onSave={handleSteamSave} onClose={() => setShowSteamSettings(false)} />}
      {showPublicBoards && <PublicBoards token={token} currentUser={currentUser} onClose={() => setShowPublicBoards(false)} />}
    </div>
  );
}
