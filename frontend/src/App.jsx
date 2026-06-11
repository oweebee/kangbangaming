import React, { useState, useEffect, useCallback, useRef } from 'react';
import KanbanBoard from './components/KanbanBoard.jsx';
import MobileBoard from './components/MobileBoard.jsx';
import GameModal from './components/GameModal.jsx';
import TaskModal from './components/TaskModal.jsx';
import SearchModal from './components/SearchModal.jsx';
import LoginPage from './components/LoginPage.jsx';
import RegisterPage from './components/RegisterPage.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import SteamSettings from './components/SteamSettings.jsx';
import PublicBoards from './components/PublicBoards.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import GameStatsWidget from './components/GameStatsWidget.jsx';
import GlobalSearch from './components/GlobalSearch.jsx';

const DISCORD_ICON_URL = 'https://cdn.discordapp.com/icons/983316258302877747/ebcf20448ef8818f93e8f31afad9f8d9.webp?size=64';

function DiscordServerIcon({ size = 22, borderColor = 'var(--surface1)' }) {
  const [err, setErr] = React.useState(false);
  if (err) return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#5865f2', marginLeft: -(size * 0.2), position: 'relative', zIndex: 2, border: `2px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      <svg viewBox="0 0 127.14 96.36" xmlns="http://www.w3.org/2000/svg" style={{ width: '70%', height: '70%', fill: '#fff' }}><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>
    </div>
  );
  return <img src={DISCORD_ICON_URL} alt="" onError={() => setErr(true)} style={{ width: size, height: size, borderRadius: '50%', marginLeft: -(size * 0.2), position: 'relative', zIndex: 2, border: `2px solid ${borderColor}`, flexShrink: 0 }} />;
}

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

function HomeBoardCard({ board, isPublic, isFav, onToggleFav, onClick }) {
  const [favHover, setFavHover] = React.useState(false);
  return (
    <div
      style={{
        background: 'var(--surface1)',
        border: `1px solid ${isFav ? 'rgba(245,197,24,0.35)' : 'var(--border)'}`,
        borderRadius: 12, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Banner — clickable */}
      <div
        onClick={onClick}
        style={{ width: '100%', height: 110, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}
      >
        {(board.headerImg || board.gameIcon) ? (
          <img src={board.headerImg || board.gameIcon} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 44 }}>{board.emoji || '🎮'}</span>
        )}
      </div>
      {/* Info */}
      <div
        onClick={onClick}
        style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
      >
        {isFav && <svg viewBox="0 0 24 24" width="10" height="10" fill="#f5c518" stroke="#f5c518" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
        <span style={{ flex: 1, fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{board.name}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: (isPublic || board.public) ? '#3db86a' : '#f5a500', border: `1px solid ${(isPublic || board.public) ? '#3db86a' : '#f5a500'}`, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
          {(isPublic || board.public) ? 'Public' : 'Privé'}
        </span>
      </div>
      {/* Action bar */}
      {onToggleFav ? (
        <div style={{ display: 'flex', gap: 6, padding: '0 10px 10px' }}>
          <button
            onClick={onClick}
            style={{ flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '5px 0', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >▶ Afficher</button>
          <button
            onClick={e => { e.stopPropagation(); onToggleFav(isFav); }}
            onMouseEnter={() => setFavHover(true)}
            onMouseLeave={() => setFavHover(false)}
            style={{
              background: isFav
                ? (favHover ? 'rgba(220,50,50,.15)' : 'rgba(245,197,24,.12)')
                : 'var(--surface2)',
              border: isFav
                ? (favHover ? '1px solid rgba(220,50,50,.6)' : '1px solid rgba(245,197,24,.5)')
                : '1px solid var(--border)',
              borderRadius: 6, padding: '5px 10px', cursor: 'pointer',
              color: isFav ? (favHover ? '#e05555' : '#f5c518') : 'var(--text-muted)',
              fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
              transition: 'background .15s, border-color .15s, color .15s',
            }}
          >
            {isFav
              ? (favHover ? <><span style={{ fontSize: 12, lineHeight: 1 }}>✕</span> Retirer</> : <>📌 Épinglé</>)
              : <>📌 Épingler</>
            }
          </button>
        </div>
      ) : (
        <div style={{ padding: '0 10px 10px' }}>
          <button
            onClick={onClick}
            style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '5px 0', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >▶ Afficher</button>
        </div>
      )}
    </div>
  );
}

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
  const [publicBoardsKey, setPublicBoardsKey] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Favorites (public boards pinned to sidebar)
  const [favBoards, setFavBoards] = useState([]);
  // Personal board favorites (IDs only)
  const [personalFavIds, setPersonalFavIds] = useState([]);
  // Collaborative public board currently open (null = own boards mode)
  const [publicBoardMode, setPublicBoardMode] = useState(null); // { id, name, ownerUsername }

  // Home view
  const [showHome, setShowHome] = useState(true);
  const [homePublicBoards, setHomePublicBoards] = useState([]);

  // Board state
  const [boards, setBoards] = useState([]);
  const [boardOrder, setBoardOrder] = useState([]);  // persisted drag order
  const [boardDragId, setBoardDragId] = useState(null);
  const [boardDragOverId, setBoardDragOverId] = useState(null);
  const [favOrder, setFavOrder] = useState([]);
  const [favDragId, setFavDragId] = useState(null);
  const [favDragOverId, setFavDragOverId] = useState(null);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [editingGame,  setEditingGame]  = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [searchTargetCol, setSearchTargetCol] = useState(null);
  const [appUsers, setAppUsers] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [emojiPickerFor, setEmojiPickerFor] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  // Board name inline edit
  const [editingBoardName, setEditingBoardName] = useState(false);
  const [boardNameInput, setBoardNameInput] = useState('');

  // Steam game info for active board
  const [gameInfo, setGameInfo] = useState(null);

  // Global search: pending game to open after board loads
  const [pendingOpenGameId, setPendingOpenGameId] = useState(null);

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
    setCurrentUser(null); setToken(null); setBoards([]); setActiveBoardId(null); setColumns([]); setGames([]); setShowHome(true);
  };

  const fetchFavorites = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/user/favorites`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setFavBoards(await res.json());
    } catch {}
  }, [token]);

  const fetchPersonalFavorites = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/user/personal-favorites`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPersonalFavIds(await res.json());
    } catch {}
  }, [token]);

  const togglePersonalFavorite = async (boardId, isFav) => {
    const method = isFav ? 'DELETE' : 'POST';
    await fetch(`${API}/user/personal-favorites/${boardId}`, { method, headers: { Authorization: `Bearer ${token}` } });
    setPersonalFavIds(prev => isFav ? prev.filter(id => id !== boardId) : [...prev, boardId]);
  };

  const toggleFavorite = async (boardId, boardData, isFav) => {
    const method = isFav ? 'DELETE' : 'POST';
    await fetch(`${API}/user/favorites/${boardId}`, { method, headers: { Authorization: `Bearer ${token}` } });
    if (isFav) {
      setFavBoards(prev => prev.filter(b => b.id !== boardId));
    } else {
      setFavBoards(prev => [...prev, { ...boardData, isFavorite: true }]);
    }
  };

  // Returns the right API base for the active board context
  const boardApi = publicBoardMode ? `/api/public/boards/${publicBoardMode.id}` : null;

  const openPublicBoard = async (board) => {
    setPublicBoardMode(board);
    setShowPublicBoards(false);
    setShowHome(false);
    setActiveBoardId(null);
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [cols, gms] = await Promise.all([
        fetch(`${API}/public/boards/${board.id}/columns`, { headers: h }).then(r => r.json()),
        fetch(`${API}/public/boards/${board.id}/games`, { headers: h }).then(r => r.json()),
      ]);
      setColumns(cols);
      setGames(gms);
    } catch {} finally { setLoading(false); }
  };

  const closePublicBoard = () => {
    setPublicBoardMode(null);
    setActiveBoardId(null);
    setColumns([]); setGames([]);
    setShowHome(true);
  };

  const refreshPublicBoard = async () => {
    if (!publicBoardMode) return;
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${token}` };
      const [cols, gms] = await Promise.all([
        fetch(`${API}/public/boards/${publicBoardMode.id}/columns`, { headers: h }).then(r => r.json()),
        fetch(`${API}/public/boards/${publicBoardMode.id}/games`, { headers: h }).then(r => r.json()),
      ]);
      setColumns(cols);
      setGames(gms);
    } catch {} finally { setLoading(false); }
  };

  const fetchBoards = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${API}/boards`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { handleLogout(); return; }
    const data = await res.json();
    setBoards(data);
  }, [token, activeBoardId]);

  const saveBoardName = async () => {
    const name = boardNameInput.trim();
    setEditingBoardName(false);
    if (!name || !activeBoardId || name === activeBoard?.name) return;
    await fetch(`${API}/boards/${activeBoardId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, name } : b));
  };

  const fetchGames = useCallback(async (boardId) => {
    if (!boardId || !token) return;
    setLoading(true);
    try { const res = await fetch(`${API}/boards/${boardId}/games`, { headers: { Authorization: `Bearer ${token}` } }); setGames(await res.json()); }
    catch { setGames([]); } finally { setLoading(false); }
  }, [token]);

  // Open a game from global search after its board's games have loaded
  useEffect(() => {
    if (!pendingOpenGameId || games.length === 0) return;
    const game = games.find(g => g.appid === pendingOpenGameId);
    if (game) { setSelectedGame(game); setPendingOpenGameId(null); }
  }, [games, pendingOpenGameId]);

  const handleSearchGoToBoard = (boardId) => {
    setActiveBoardId(boardId);
    setShowHome(false);
    setPublicBoardMode(null);
    setShowPublicBoards(false);
  };

  const handleSearchOpenGame = (boardId, gameId) => {
    setActiveBoardId(boardId);
    setShowHome(false);
    setPublicBoardMode(null);
    setShowPublicBoards(false);
    setPendingOpenGameId(gameId);
  };

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/users/list`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(setAppUsers).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (token && currentUser) {
      fetchBoards(); fetchFavorites(); fetchPersonalFavorites();
      try { const saved = JSON.parse(localStorage.getItem(`boardOrder_${currentUser.id}`) || 'null'); if (Array.isArray(saved)) setBoardOrder(saved); } catch {}
      try { const saved = JSON.parse(localStorage.getItem(`favOrder_${currentUser.id}`) || 'null'); if (Array.isArray(saved)) setFavOrder(saved); } catch {}
    }
  }, [token]);
  useEffect(() => {
    if (!showHome || !token) return;
    fetch(`${API}/public/boards`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : []).then(setHomePublicBoards).catch(() => {});
  }, [showHome, token]);
  // Sync columns whenever activeBoardId OR boards changes (avoids race where boards loads after activeBoardId effect)
  useEffect(() => {
    if (!activeBoardId) return;
    const board = boards.find(b => b.id === activeBoardId);
    if (board) setColumns(board.columns || []);
  }, [activeBoardId, boards]);

  // Fetch games only when the active board changes
  useEffect(() => {
    if (!activeBoardId) return;
    fetchGames(activeBoardId);
  }, [activeBoardId]);

  // Fetch Steam game info when board changes
  // NOTE: activeSteamAppId is computed after the early return, so we derive it here from state
  // Use same fallback as the render path: board.headerImg OR first game with header_img
  useEffect(() => {
    const board = boards.find(b => b.id === activeBoardId);
    // publicBoardMode.headerImg already contains board.headerImg || firstGame.header_img from the API
    // Do NOT fall back to games[] here — games state may be stale from the previous board
    const headerImg = board?.headerImg || publicBoardMode?.headerImg || null;
    const appId = headerImg?.match(/apps\/(\d+)\//)?.[1] || null;
    if (!appId || !token) { setGameInfo(null); return; }
    fetch(`${API}/steam/gameinfo/${appId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(setGameInfo).catch(() => setGameInfo(null));
  }, [activeBoardId, boards, token, publicBoardMode]);

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
    try {
      const res = await fetch(`${API}/boards`, {
        method: 'POST', headers: authHeaders(token),
        body: JSON.stringify({ name, emoji: '', gameIcon: selectedBoardGame ? (selectedBoardGame.icon_img || selectedBoardGame.header_img) : null, headerImg: selectedBoardGame ? selectedBoardGame.header_img : null, gameBoard: !!selectedBoardGame }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert('Erreur création board: ' + (e.error || res.status)); return; }
      const board = await res.json();
      setBoards(prev => [...prev, board]);
      setActiveBoardId(board.id); setColumns(board.columns || []); setGames([]);
      resetNewBoard();
    } catch (err) { alert('Erreur réseau: ' + err.message); }
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
    try {
      const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
      const res = await fetch(`${boardApi}/columns`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ label: 'Nouvelle colonne' }) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); alert('Erreur colonne: ' + (e.error || res.status)); return; }
      const col = await res.json();
      setColumns(prev => [...prev, col]);
      if (!publicBoardMode) setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, columns: [...(b.columns || []), col] } : b));
    } catch (err) { alert('Erreur réseau: ' + err.message); }
  };
  const renameColumn = async (colId, label) => {
    const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
    await fetch(`${boardApi}/columns/${colId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ label }) });
    const updated = columns.map(c => c.id === colId ? { ...c, label } : c);
    setColumns(updated);
    if (!publicBoardMode) setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, columns: updated } : b));
  };
  const setColumnEmoji = async (colId, emoji) => {
    const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
    await fetch(`${boardApi}/columns/${colId}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ emoji }) });
    const updated = columns.map(c => c.id === colId ? { ...c, emoji } : c);
    setColumns(updated);
    if (!publicBoardMode) setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, columns: updated } : b));
  };
  const deleteColumn = async (colId) => {
    if (!confirm('Supprimer cette colonne ? Les jeux seront déplacés dans la première colonne.')) return;
    const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
    await fetch(`${boardApi}/columns/${colId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const updated = columns.filter(c => c.id !== colId);
    setColumns(updated);
    if (!publicBoardMode) {
      setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, columns: updated } : b));
      fetchGames(activeBoardId);
    } else {
      const res = await fetch(`${API}/public/boards/${publicBoardMode.id}/games`, { headers: authHeaders(token) });
      if (res.ok) setGames(await res.json());
    }
  };

  // Games CRUD
  const addGame = async (game, targetColId) => {
    const colId = targetColId || columns[0]?.id;
    const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
    await fetch(`${boardApi}/games`, {
      method: 'POST', headers: authHeaders(token),
      body: JSON.stringify({ appid: game.appid, name: game.name, header_img: game.header_img, icon_img: game.icon_img, column: colId, type: game.type || 'steam', emoji: game.emoji || null, taskType: game.taskType || null, urgent: game.urgent ?? false, assignees: game.assignees ?? [], notes: game.notes ?? [], progress: game.progress ?? null }),
    });
    if (publicBoardMode) {
      const res = await fetch(`${boardApi}/games`, { headers: authHeaders(token) });
      if (res.ok) setGames(await res.json());
    } else {
      fetchGames(activeBoardId);
    }
  };
  const removeGame = async (appid) => {
    const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
    await fetch(`${boardApi}/games/${appid}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setGames(prev => prev.filter(g => g.appid !== appid));
  };

  const archiveGame = async (appid) => {
    const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
    await fetch(`${boardApi}/games/${appid}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ archived: true }) });
    setGames(prev => prev.map(g => g.appid === appid ? { ...g, archived: true } : g));
  };

  const unarchiveGame = async (appid) => {
    const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
    await fetch(`${boardApi}/games/${appid}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ archived: false }) });
    setGames(prev => prev.map(g => g.appid === appid ? { ...g, archived: false } : g));
  };

  const reorderGamesInColumn = useCallback(async (colId, orderedAppids) => {
    setGames(prev => prev.map(g => {
      const idx = orderedAppids.indexOf(g.appid);
      if (idx !== -1) return { ...g, sortOrder: idx, column: colId };
      return g;
    }));
    const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
    await fetch(`${boardApi}/columns/${colId}/games/reorder`, {
      method: 'PATCH', headers: authHeaders(token),
      body: JSON.stringify({ order: orderedAppids }),
    });
  }, [activeBoardId, token, publicBoardMode]);

  const updateGame = async (updatedGame) => {
    const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
    const { appid, name, emoji, taskType, dueDate, startDate, endDate, urgent, assignees, notes, progress } = updatedGame;
    await fetch(`${boardApi}/games/${appid}`, {
      method: 'PATCH', headers: authHeaders(token),
      body: JSON.stringify({ name, emoji, taskType: taskType ?? null, dueDate: dueDate ?? null, startDate: startDate ?? null, endDate: endDate ?? null, urgent: urgent ?? false, assignees: assignees ?? [], notes: notes ?? [], progress: progress ?? null }),
    });
    setGames(prev => prev.map(g => g.appid === appid ? { ...g, ...updatedGame } : g));
  };

  // Generic field patch — used by TaskModal for immediate note/urgent/assignee saves
  const patchGame = async (appid, fields) => {
    const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
    await fetch(`${boardApi}/games/${appid}`, {
      method: 'PATCH', headers: authHeaders(token),
      body: JSON.stringify(fields),
    });
    setGames(prev => prev.map(g => g.appid === appid ? { ...g, ...fields } : g));
  };
  const moveGame = useCallback(async (appid, column) => {
    setGames(prev => prev.map(g => g.appid === appid ? { ...g, column } : g));
    const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
    await fetch(`${boardApi}/games/${appid}`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ column }) });
  }, [activeBoardId, token, publicBoardMode]);

  const reorderColumns = async (orderedIds) => {
    // Optimistic update
    const reordered = orderedIds.map(id => columns.find(c => c.id === id)).filter(Boolean);
    setColumns(reordered);
    if (!publicBoardMode) setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, columns: reordered } : b));
    const boardApi = publicBoardMode ? `${API}/public/boards/${publicBoardMode.id}` : `${API}/boards/${activeBoardId}`;
    await fetch(`${boardApi}/columns/reorder`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ order: orderedIds }) });
  };

  // Auth screens
  if (!currentUser) {
    if (authPage === 'register') return <RegisterPage onLogin={handleLogin} onGoLogin={() => setAuthPage('login')} />;
    return <LoginPage onLogin={handleLogin} onGoRegister={() => setAuthPage('register')} />;
  }

  const filtered = games.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()));
  const filteredForBoard = filtered.filter(g => showArchived ? true : !g.archived);
  const byColumn = columns.reduce((acc, col) => {
    acc[col.id] = filteredForBoard
      .filter(g => g.column === col.id)
      .sort((a, b) => {
        const sa = a.sortOrder ?? new Date(a.addedAt || 0).getTime();
        const sb = b.sortOrder ?? new Date(b.addedAt || 0).getTime();
        return sa - sb;
      });
    return acc;
  }, {});
  const knownColIds = new Set(columns.map(c => c.id));
  const activeBoard = boards.find(b => b.id === activeBoardId);
  // Banner image: prefer board's stored headerImg, fallback to first Steam game header_img
  const activeBoardHeaderImg = activeBoard?.headerImg || games.find(g => g.header_img)?.header_img || null;
  // Extract Steam appid from banner URL
  const activeSteamAppId = activeBoardHeaderImg?.match(/apps\/(\d+)\//)?.[1] || null;
  // true when the active board was created from a Steam game (task board)
  const isTaskBoard = !!(publicBoardMode ? publicBoardMode.gameIcon : activeBoard?.gameIcon);
  const orphans = filteredForBoard.filter(g => !knownColIds.has(g.column));
  if (orphans.length > 0 && columns[0]) byColumn[columns[0].id] = [...(byColumn[columns[0].id] || []), ...orphans];
  const archiveCount = games.filter(g => g.archived).length;

  // Reactive displayed game — stays in sync when patchGame mutates the games array
  const displayedGame = selectedGame
    ? (games.find(g => g.appid === selectedGame.appid) || selectedGame)
    : null;

  // Sorted boards (respects drag order)
  const sortedBoards = boardOrder.length > 0
    ? [...boards].sort((a, b) => {
        const ai = boardOrder.indexOf(a.id);
        const bi = boardOrder.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      })
    : boards;

  const handleBoardDrop = (targetId) => {
    if (!boardDragId || boardDragId === targetId) { setBoardDragId(null); setBoardDragOverId(null); return; }
    const base = boardOrder.length > 0 ? boardOrder : sortedBoards.map(b => b.id);
    const fromIdx = base.indexOf(boardDragId) !== -1 ? base.indexOf(boardDragId) : sortedBoards.findIndex(b => b.id === boardDragId);
    const toIdx   = base.indexOf(targetId)   !== -1 ? base.indexOf(targetId)   : sortedBoards.findIndex(b => b.id === targetId);
    const newOrder = [...base];
    // ensure all current board IDs are in newOrder
    sortedBoards.forEach(b => { if (!newOrder.includes(b.id)) newOrder.push(b.id); });
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    setBoardOrder(newOrder);
    localStorage.setItem(`boardOrder_${currentUser.id}`, JSON.stringify(newOrder));
    setBoardDragId(null); setBoardDragOverId(null);
  };

  // Sorted favBoards (respects drag order)
  const sortedFavBoards = favOrder.length > 0
    ? [...favBoards].sort((a, b) => {
        const ai = favOrder.indexOf(a.id);
        const bi = favOrder.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      })
    : favBoards;

  const handleFavDrop = (targetId) => {
    if (!favDragId || favDragId === targetId) { setFavDragId(null); setFavDragOverId(null); return; }
    const base = favOrder.length > 0 ? favOrder : sortedFavBoards.map(b => b.id);
    const fromIdx = base.indexOf(favDragId) !== -1 ? base.indexOf(favDragId) : sortedFavBoards.findIndex(b => b.id === favDragId);
    const toIdx   = base.indexOf(targetId)   !== -1 ? base.indexOf(targetId)   : sortedFavBoards.findIndex(b => b.id === targetId);
    const newOrder = [...base];
    sortedFavBoards.forEach(b => { if (!newOrder.includes(b.id)) newOrder.push(b.id); });
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, moved);
    setFavOrder(newOrder);
    localStorage.setItem(`favOrder_${currentUser.id}`, JSON.stringify(newOrder));
    setFavDragId(null); setFavDragOverId(null);
  };

  const openBoard = (b) => {
    setActiveBoardId(b.id);
    setColumns(b.columns || []);
    setShowHome(false);
    setPublicBoardMode(null);
    fetchGames(b.id);
  };

  const homeView = (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Boards publics de la communauté */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#3db86a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="10" cy="7" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M15 3.13a4 4 0 0 1 0 7.75"/><path d="M20 21v-2a4 4 0 0 0-3-3.85"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3db86a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Boards Publics</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 99, padding: '1px 7px' }}>{homePublicBoards.length}</span>
          </div>
          {homePublicBoards.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '16px 0' }}>Aucun board public disponible pour l'instant.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {homePublicBoards.map(b => (
                <HomeBoardCard key={b.id} board={b} isPublic onClick={() => openPublicBoard(b)} />
              ))}
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div style={{ borderTop: '1px solid var(--border)', marginBottom: 32 }} />

        {/* Mes boards */}
        {(() => {
          const favSet = new Set(personalFavIds);
          const favBoards2 = sortedBoards.filter(b => favSet.has(b.id));
          const otherBoards = sortedBoards.filter(b => !favSet.has(b.id));
          return (
            <>
              {favBoards2.length > 0 && (
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="#f5c518" stroke="#f5c518" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f5c518', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Épinglés</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 99, padding: '1px 7px' }}>{favBoards2.length}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {favBoards2.map(b => (
                      <HomeBoardCard key={b.id} board={b} isFav onToggleFav={(cur) => togglePersonalFavorite(b.id, cur)} onClick={() => openBoard(b)} />
                    ))}
                  </div>
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 14 }}>🔒</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f5a500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mes Boards</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 99, padding: '1px 7px' }}>{otherBoards.length}</span>
                </div>
                {sortedBoards.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '16px 0' }}>Crée un board pour commencer.</div>
                ) : otherBoards.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '8px 0' }}>Tous tes boards sont épinglés 📌</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {otherBoards.map(b => (
                      <HomeBoardCard key={b.id} board={b} isFav={false} onToggleFav={(cur) => togglePersonalFavorite(b.id, cur)} onClick={() => openBoard(b)} />
                    ))}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );

  // ── Sidebar ───────────────────────────────────────────────────────────────

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 35, height: 35, fill: 'var(--accent)', position: 'relative', zIndex: 1 }}>
            <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256zM155.7 384.3l-30.5-12.6a52.79 52.79 0 0 0 27.2 25.8c26.9 11.2 57.8-1.6 69-28.4 5.4-13 5.5-27.3.1-40.3-5.4-13-15.5-23.2-28.5-28.6-12.7-5.3-26.4-5.5-38.8-1.4l31.5 13c19.8 8.2 29.2 30.9 20.9 50.7-8.3 19.9-31 29.2-50.9 21zm173.8-129.9c-34.4 0-62.4-28-62.4-62.3s28-62.3 62.4-62.3 62.4 28 62.4 62.3-27.9 62.3-62.4 62.3zm.1-15.6c25.9 0 46.9-21 46.9-46.8 0-25.9-21-46.8-46.9-46.8s-46.9 21-46.9 46.8c.1 25.8 21.1 46.8 46.9 46.8z"/>
          </svg>
          <DiscordServerIcon size={35} borderColor="#111" />
        </div>
        <span onClick={() => { setShowHome(true); setActiveBoardId(null); setPublicBoardMode(null); setShowPublicBoards(false); }} style={{ fontWeight: 800, fontSize: 16, letterSpacing: '0.04em', color: 'var(--text)', flex: 1, cursor: 'pointer' }}>KangBanGaming</span>
        {isMobile && <button onClick={() => setShowDrawer(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>}
      </div>

      {/* Boards publics button */}
      <div style={{ padding: '6px 6px 0' }}>
        <button
          onClick={() => { setShowPublicBoards(true); if (isMobile) setShowDrawer(false); }}
          style={{
            width: '100%', background: 'none', border: '1px solid var(--border)',
            borderRadius: 7, padding: '6px 8px', color: 'var(--text-muted)', fontSize: 12,
            cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="10" cy="7" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M15 3.13a4 4 0 0 1 0 7.75"/><path d="M20 21v-2a4 4 0 0 0-3-3.85"/>
            </svg>
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Boards Publics</span>
        </button>
      </div>

      {/* Boards list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 6px' }}>
        {/* ⭐ Épinglés */}
        {personalFavIds.length > 0 && sortedBoards.some(b => personalFavIds.includes(b.id)) && (
          <>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#f5c518', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 6px 2px', opacity: 0.8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg viewBox="0 0 24 24" width="8" height="8" fill="#f5c518" stroke="#f5c518" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              Épinglés
            </div>
            {sortedBoards.filter(b => personalFavIds.includes(b.id)).map(b => (
          <div key={b.id}
            draggable
            onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setBoardDragId(b.id); }}
            onDragEnd={() => { setBoardDragId(null); setBoardDragOverId(null); }}
            onDragOver={e => { e.preventDefault(); setBoardDragOverId(b.id); }}
            onDrop={e => { e.preventDefault(); handleBoardDrop(b.id); }}
            onClick={() => { setActiveBoardId(b.id); setColumns(b.columns || []); setEmojiPickerFor(null); setShowHome(false); setPublicBoardMode(null); setShowPublicBoards(false); if (isMobile) setShowDrawer(false); }}
            style={{
              padding: '6px 8px', borderRadius: 7, cursor: 'grab', marginBottom: 2,
              background: boardDragOverId === b.id && boardDragId !== b.id ? 'var(--accent-dim)' : activeBoardId === b.id ? 'var(--accent-dim)' : 'transparent',
              borderLeft: activeBoardId === b.id ? '3px solid var(--accent)' : boardDragOverId === b.id && boardDragId !== b.id ? '3px solid #3db86a' : '3px solid transparent',
              color: activeBoardId === b.id ? 'var(--text)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: 5,
              opacity: boardDragId === b.id ? 0.4 : 1,
              transition: 'background .12s, opacity .12s', position: 'relative',
            }}
          >
            {b.gameIcon ? (
              <img src={b.gameIcon} alt="" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: '50%', flexShrink: 0, border: '1.5px solid white' }} />
            ) : (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={e => { e.stopPropagation(); setEmojiPickerFor(emojiPickerFor === b.id ? null : b.id); }}
                  style={{ background: b.emoji ? 'transparent' : 'var(--surface3)', border: '1.5px solid white', borderRadius: 4, width: 34, height: 34, fontSize: b.emoji ? 18 : 11, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >{b.emoji || '+'}</button>
                {emojiPickerFor === b.id && (
                  <BoardEmojiPicker current={b.emoji || ''} onSelect={emoji => { setBoardEmoji(b.id, emoji); setEmojiPickerFor(null); }} onClose={() => setEmojiPickerFor(null)} />
                )}
              </div>
            )}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{b.name}</span>
            {/* Public toggle */}
            <button
              onClick={e => { e.stopPropagation(); toggleBoardPublic(b.id, !b.public); }}
              title={b.public ? 'Board public — cliquer pour rendre privé' : 'Board privé — cliquer pour rendre public'}
              style={{ background: 'none', border: 'none', fontSize: 11, padding: 0, cursor: 'pointer', flexShrink: 0, opacity: b.public ? 1 : 0.3, lineHeight: 1 }}
            >{b.public ? (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="7" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M15 3.13a4 4 0 0 1 0 7.75"/><path d="M20 21v-2a4 4 0 0 0-3-3.85"/>
              </svg>
            ) : '🔒'}</button>
            <button onClick={e => { e.stopPropagation(); deleteBoard(b.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, padding: 0, opacity: 0.4, cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </div>
            ))}
          </>
        )}

        {/* Séparateur épinglés / autres */}
        {personalFavIds.length > 0 && sortedBoards.some(b => personalFavIds.includes(b.id)) && sortedBoards.some(b => !personalFavIds.includes(b.id)) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 4px 2px', margin: '2px 0 4px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Mes boards</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
        )}

        {/* Non-pinned boards */}
        {sortedBoards.filter(b => !personalFavIds.includes(b.id)).map(b => (
          <div key={b.id}
            draggable
            onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setBoardDragId(b.id); }}
            onDragEnd={() => { setBoardDragId(null); setBoardDragOverId(null); }}
            onDragOver={e => { e.preventDefault(); setBoardDragOverId(b.id); }}
            onDrop={e => { e.preventDefault(); handleBoardDrop(b.id); }}
            onClick={() => { setActiveBoardId(b.id); setColumns(b.columns || []); setEmojiPickerFor(null); setShowHome(false); setPublicBoardMode(null); setShowPublicBoards(false); if (isMobile) setShowDrawer(false); }}
            style={{
              padding: '6px 8px', borderRadius: 7, cursor: 'grab', marginBottom: 2,
              background: boardDragOverId === b.id && boardDragId !== b.id ? 'var(--accent-dim)' : activeBoardId === b.id ? 'var(--accent-dim)' : 'transparent',
              borderLeft: activeBoardId === b.id ? '3px solid var(--accent)' : boardDragOverId === b.id && boardDragId !== b.id ? '3px solid #3db86a' : '3px solid transparent',
              color: activeBoardId === b.id ? 'var(--text)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: 5,
              opacity: boardDragId === b.id ? 0.4 : 1,
              transition: 'background .12s, opacity .12s', position: 'relative',
            }}
          >
            {b.gameIcon ? (
              <img src={b.gameIcon} alt="" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: '50%', flexShrink: 0, border: '1.5px solid white' }} />
            ) : (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={e => { e.stopPropagation(); setEmojiPickerFor(emojiPickerFor === b.id ? null : b.id); }}
                  style={{ background: b.emoji ? 'transparent' : 'var(--surface3)', border: '1.5px solid white', borderRadius: 4, width: 34, height: 34, fontSize: b.emoji ? 18 : 11, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >{b.emoji || '+'}</button>
                {emojiPickerFor === b.id && (
                  <BoardEmojiPicker current={b.emoji || ''} onSelect={emoji => { setBoardEmoji(b.id, emoji); setEmojiPickerFor(null); }} onClose={() => setEmojiPickerFor(null)} />
                )}
              </div>
            )}
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{b.name}</span>
            <button
              onClick={e => { e.stopPropagation(); toggleBoardPublic(b.id, !b.public); }}
              title={b.public ? 'Board public — cliquer pour rendre privé' : 'Board privé — cliquer pour rendre public'}
              style={{ background: 'none', border: 'none', fontSize: 11, padding: 0, cursor: 'pointer', flexShrink: 0, opacity: b.public ? 1 : 0.3, lineHeight: 1 }}
            >{b.public ? (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="7" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M15 3.13a4 4 0 0 1 0 7.75"/><path d="M20 21v-2a4 4 0 0 0-3-3.85"/>
              </svg>
            ) : '🔒'}</button>
            <button onClick={e => { e.stopPropagation(); deleteBoard(b.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 11, padding: 0, opacity: 0.4, cursor: 'pointer', flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>

      {/* Followed public boards */}
      {favBoards.length > 0 && (
        <div style={{ padding: '4px 6px 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '4px 2px 4px 4px', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Boards publics suivis
          </div>
          {sortedFavBoards.map(b => (
            <div key={b.id}
              draggable
              onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; setFavDragId(b.id); }}
              onDragEnd={() => { setFavDragId(null); setFavDragOverId(null); }}
              onDragOver={e => { e.preventDefault(); setFavDragOverId(b.id); }}
              onDrop={e => { e.preventDefault(); handleFavDrop(b.id); }}
              onClick={() => { openPublicBoard(b); if (isMobile) setShowDrawer(false); }}
              style={{
                padding: '6px 8px', borderRadius: 7, cursor: 'grab', marginBottom: 2,
                background: favDragOverId === b.id && favDragId !== b.id ? 'var(--accent-dim)' : 'transparent',
                borderLeft: favDragOverId === b.id && favDragId !== b.id ? '3px solid #3db86a' : '3px solid transparent',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5,
                opacity: favDragId === b.id ? 0.4 : 1,
                transition: 'background .12s, opacity .12s',
              }}
              onMouseEnter={e => { if (favDragOverId !== b.id) e.currentTarget.style.background = 'var(--surface2)'; }}
              onMouseLeave={e => { if (favDragOverId !== b.id) e.currentTarget.style.background = 'transparent'; }}
            >
              {b.gameIcon ? (
                <img src={b.gameIcon} alt="" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: '50%', flexShrink: 0, border: '1.5px solid white', opacity: 0.85 }} />
              ) : (
                <span style={{ fontSize: 20, flexShrink: 0 }}>{b.emoji || '🎮'}</span>
              )}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 700 }}>{b.name}</span>
              <svg viewBox="0 0 24 24" width="10" height="10" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1.5" style={{ flexShrink: 0, opacity: 0.7 }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
          ))}
        </div>
      )}

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
                      style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
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
                  <button onClick={() => setShowBoardSearch(true)} style={{ width: '100%', background: 'var(--surface2)', border: '1px dashed var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 12, height: 12, fill: 'var(--accent)', flexShrink: 0 }}><path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256z"/></svg>
                    Associer un jeu Steam...
                  </button>
                )}
              </div>
            )}
            <input autoFocus={!showBoardSearch} value={newBoardName} onChange={e => setNewBoardName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createBoard()} placeholder="Board Personnalisée"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px', color: 'var(--text)', fontSize: 12, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={createBoard} style={{ flex: 1, background: 'var(--accent)', border: 'none', borderRadius: 5, padding: '5px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Créer</button>
              <button onClick={resetNewBoard} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '5px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowNewBoard(true)} style={{ width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '9px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nouveau board</button>
        )}
      </div>

      {/* User footer */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 5 }}>
        {currentUser.steamAvatar ? (
          <img src={currentUser.steamAvatar} alt="" style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid var(--border)', flexShrink: 0, cursor: 'pointer' }} onClick={() => setShowSteamSettings(true)} title="Paramètres Steam" />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--surface3)', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setShowSteamSettings(true)} title="Configurer Steam">
            <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14, fill: 'var(--text-muted)' }}><path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256z"/></svg>
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUser.steamPersonaName || currentUser.username}
          </div>
          {currentUser.role === 'admin' && <div style={{ fontSize: 9, color: '#f5a500', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>admin</div>}
        </div>
        <button onClick={() => setShowProfile(true)} title="Mon profil" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 7px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', flexShrink: 0, fontWeight: 600 }}>Profil</button>
        <button onClick={() => setShowSteamSettings(true)} title="Paramètres Steam" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 7px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
          <svg viewBox="0 0 496 512" xmlns="http://www.w3.org/2000/svg" style={{ width: 12, height: 12, fill: 'currentColor', display: 'block' }}>
            <path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.7-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 38.2 0 69.1-31.1 68.9-69.3l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256z"/>
          </svg>
        </button>
        {currentUser.role === 'admin' && (
          <button onClick={() => setShowAdmin(true)} title="Panneau admin" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 7px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>⚙️</button>
        )}
        <button onClick={handleLogout} title="Déconnexion" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, padding: '4px 7px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>↪</button>
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
          {publicBoardMode ? (
            <>
              {(publicBoardMode.headerImg || publicBoardMode.gameIcon) ? (
                <img src={publicBoardMode.headerImg || publicBoardMode.gameIcon} alt="" style={{ height: 30, width: 'auto', maxWidth: 100, objectFit: 'contain', borderRadius: 4, flexShrink: 0, border: '1px solid var(--border)' }} />
              ) : (
                <span style={{ fontSize: 16, flexShrink: 0 }}>{publicBoardMode.emoji || '🎮'}</span>
              )}
              <span style={{ fontWeight: 700, fontSize: 13, color: '#3db86a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                Board Public
                <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>{publicBoardMode.name}</span>
              </span>
              <button onClick={refreshPublicBoard} title="Rafraîchir" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}>↻</button>
              <button onClick={closePublicBoard} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>✕</button>
              <button onClick={() => setShowSearch(true)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '7px 14px', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{isTaskBoard ? '+ Ajouter une tâche' : '+ Ajouter un jeu'}</button>
            </>
          ) : (
            <>
              {(activeBoard?.headerImg || activeBoard?.gameIcon) ? (
                <img src={activeBoard.headerImg || activeBoard.gameIcon} alt="" style={{ height: 30, width: 'auto', maxWidth: 100, objectFit: 'contain', borderRadius: 4, flexShrink: 0, border: '1px solid var(--border)' }} />
              ) : activeBoard ? (
                <span style={{ fontSize: 16, flexShrink: 0 }}>{activeBoard.emoji || '🎮'}</span>
              ) : null}
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeBoard?.name || 'KangBanGaming'}</span>
              {activeBoard && (
                <span style={{ fontSize: 10, fontWeight: 700, color: activeBoard.public ? '#3db86a' : '#f5a500', border: `1px solid ${activeBoard.public ? '#3db86a' : '#f5a500'}`, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
                  {activeBoard.public ? 'Public' : 'Privé'}
                </span>
              )}
              {activeBoardId && <button onClick={() => setShowSearch(true)} style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, padding: '7px 14px', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{isTaskBoard ? '+ Ajouter une tâche' : '+ Ajouter un jeu'}</button>}
            </>
          )}
        </header>
        {showPublicBoards ? (
          <PublicBoards key={publicBoardsKey} token={token} currentUser={currentUser} favBoardIds={new Set(favBoards.map(b => b.id))} onToggleFavorite={toggleFavorite} onOpenBoard={openPublicBoard} onClose={() => setShowPublicBoards(false)} />
        ) : showHome && !publicBoardMode ? (
          homeView
        ) : publicBoardMode ? (
          loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
          ) : (
            <MobileBoard columns={columns} byColumn={byColumn} onCardClick={setSelectedGame} onArchiveGame={archiveGame} onUnarchiveGame={unarchiveGame} onDeleteGame={removeGame} onEditGame={setEditingGame} isTaskBoard={isTaskBoard} />
          )
        ) : !activeBoardId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Crée un board pour commencer</div>
        ) : loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
        ) : (
          <MobileBoard columns={columns} byColumn={byColumn} onCardClick={setSelectedGame} onArchiveGame={archiveGame} onUnarchiveGame={unarchiveGame} onDeleteGame={removeGame} onEditGame={setEditingGame} isTaskBoard={isTaskBoard} />
        )}
        {(activeBoardId || publicBoardMode) && (
          <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '8px 12px', display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={addColumn} style={{ flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px', color: 'var(--text-muted)', fontSize: 12 }}>+ Colonne</button>
            {archiveCount > 0 && (
              <button
                onClick={() => setShowArchived(v => !v)}
                style={{
                  background: showArchived ? 'rgba(120,80,160,0.25)' : 'var(--surface2)',
                  border: showArchived ? '1px solid rgba(160,100,220,0.6)' : '1px solid var(--border)',
                  borderRadius: 6, padding: '8px 12px', color: showArchived ? '#c090f0' : 'var(--text-muted)',
                  fontSize: 11, cursor: 'pointer', fontWeight: showArchived ? 700 : 400, flexShrink: 0,
                }}
              >
                📦 {archiveCount}
              </button>
            )}
          </div>
        )}
        <footer style={{ position: 'fixed', bottom: 0, right: 0, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: 'var(--text-muted)' }}><span>by Oweebee</span><a href="https://discord.gg/9mXpM9wv" target="_blank" rel="noreferrer" style={{ color: '#7289da', textDecoration: 'none', fontSize: 9 }}>Discord</a><a href="https://github.com/oweebee/kangbangaming" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 9 }}>GitHub</a></footer>
        {showSearch && <SearchModal api={API} token={token} boardGames={games} onAdd={g => addGame(g, searchTargetCol)} onRemove={removeGame} onClose={() => { setShowSearch(false); setSearchTargetCol(null); }} customOnly={isTaskBoard} isTaskBoard={isTaskBoard} appUsers={appUsers} />}
        {editingGame && <SearchModal api={API} token={token} boardGames={games} onAdd={addGame} onRemove={removeGame} onClose={() => setEditingGame(null)} customOnly={isTaskBoard} isTaskBoard={isTaskBoard} appUsers={appUsers} initialGame={editingGame} onSave={async g => { await updateGame(g); setEditingGame(null); }} />}
        {displayedGame && displayedGame.type === 'custom'
          ? <TaskModal game={displayedGame} appUsers={appUsers} onPatchGame={patchGame} onClose={() => setSelectedGame(null)} onEdit={() => { setEditingGame(displayedGame); setSelectedGame(null); }} isTaskBoard={isTaskBoard} />
          : displayedGame && <GameModal game={displayedGame} onClose={() => setSelectedGame(null)} api={API} token={token} />
        }
        {showAdmin && <AdminPanel token={token} currentUser={currentUser} onClose={() => setShowAdmin(false)} />}
        {showSteamSettings && <SteamSettings token={token} onSave={handleSteamSave} onClose={() => setShowSteamSettings(false)} />}

        {showProfile && <ProfilePage token={token} currentUser={currentUser} onClose={() => setShowProfile(false)} />}
      </div>
    );
  }

  // ── Desktop layout ────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: 278, background: '#111', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {sidebarContent}
      </aside>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {publicBoardMode ? (
            <>
              {/* Board icon */}
              {publicBoardMode.headerImg ? (
                <img src={publicBoardMode.headerImg} alt=""
                  style={{ height: 53, width: 'auto', maxWidth: 220, objectFit: 'contain', borderRadius: 6, flexShrink: 0, border: '1px solid var(--border)' }}
                />
              ) : (
                <span style={{ fontSize: 18, flexShrink: 0 }}>{publicBoardMode.emoji || '🎮'}</span>
              )}
              <span style={{ fontWeight: 700, fontSize: 14, color: '#3db86a', flexShrink: 0 }}>Board Public</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{publicBoardMode.name}</span>
              <button onClick={addColumn} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>+ Colonne</button>
              <button onClick={refreshPublicBoard} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 11px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ fontSize: 15, lineHeight: 1 }}>↻</span> Rafraîchir</button>
              <div style={{ flex: 1 }} />
              <input type="search" placeholder="Filtrer..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text)', fontSize: 12, outline: 'none', maxWidth: 180 }} />
              <button onClick={closePublicBoard} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>✕ Quitter</button>
            </>
          ) : showPublicBoards ? (
            <>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="10" cy="7" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M15 3.13a4 4 0 0 1 0 7.75"/><path d="M20 21v-2a4 4 0 0 0-3-3.85"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--accent)' }}>Boards Publics</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Boards partagés par la communauté</span>
              <button onClick={() => setPublicBoardsKey(k => k + 1)} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 11px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ fontSize: 15, lineHeight: 1 }}>↻</span> Refresh</button>
              <div style={{ flex: 1 }} />
              <button onClick={() => setShowPublicBoards(false)} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>✕ Fermer</button>
            </>
          ) : showHome ? (
            <>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Mes Boards</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => { setShowPublicBoards(true); }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="10" cy="7" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M15 3.13a4 4 0 0 1 0 7.75"/><path d="M20 21v-2a4 4 0 0 0-3-3.85"/>
                </svg>
                Boards Publics
              </button>
            </>
          ) : (
            <>
              {/* Board icon — clickable if Steam game */}
              {(() => {
                const steamAppId = activeBoardHeaderImg?.match(/apps\/(\d+)\//)?.[1];
                return activeBoardHeaderImg ? (
                  <img
                    src={activeBoardHeaderImg} alt=""
                    onClick={steamAppId ? () => window.open(`https://store.steampowered.com/app/${steamAppId}`, '_blank') : undefined}
                    title={steamAppId ? 'Voir sur Steam' : undefined}
                    style={{ height: 53, width: 'auto', maxWidth: 220, objectFit: 'contain', borderRadius: 6, flexShrink: 0, border: '1px solid var(--border)', cursor: steamAppId ? 'pointer' : 'default' }}
                  />
                ) : activeBoard ? (
                  <span style={{ fontSize: 36, flexShrink: 0 }}>{activeBoard.emoji || '🎮'}</span>
                ) : null;
              })()}
              <button onClick={() => { setActiveBoardId(null); setShowHome(true); }} title="Accueil" style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 18, cursor: 'pointer', padding: '2px 5px', opacity: 0.75, fontWeight: 700 }}>←</button>
              {/* Board name — double-click to edit inline */}
              {editingBoardName ? (
                <input
                  autoFocus
                  value={boardNameInput}
                  onChange={e => setBoardNameInput(e.target.value)}
                  onBlur={saveBoardName}
                  onKeyDown={e => { if (e.key === 'Enter') saveBoardName(); if (e.key === 'Escape') setEditingBoardName(false); }}
                  style={{ fontWeight: 700, fontSize: 24, color: 'var(--text)', background: 'transparent', border: 'none', borderBottom: '2px solid var(--accent)', outline: 'none', minWidth: 0, flexShrink: 1, padding: '0 2px' }}
                />
              ) : (
                <span
                  onDoubleClick={() => { setBoardNameInput(activeBoard?.name || ''); setEditingBoardName(true); }}
                  title="Double-cliquer pour renommer"
                  style={{ fontWeight: 700, fontSize: 24, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flexShrink: 1, cursor: 'text', userSelect: 'none' }}
                >{activeBoard?.name || '—'}</span>
              )}
              {activeBoard && (
                <span
                  onClick={() => toggleBoardPublic(activeBoard.id, !activeBoard.public)}
                  title={activeBoard.public ? 'Public — cliquer pour rendre privé' : 'Privé — cliquer pour rendre public'}
                  style={{ fontSize: 11, fontWeight: 700, color: activeBoard.public ? '#3db86a' : '#f5a500', cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, border: `1px solid ${activeBoard.public ? '#3db86a' : '#f5a500'}`, borderRadius: 5, padding: '2px 7px' }}
                >
                  {activeBoard.public ? (
                    <><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10" cy="7" r="4"/><path d="M4 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M15 3.13a4 4 0 0 1 0 7.75"/><path d="M20 21v-2a4 4 0 0 0-3-3.85"/>
                    </svg> Public</>
                  ) : '🔒 Privé'}
                </span>
              )}
              {activeBoardId && (
                <button onClick={addColumn} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>+ Colonne</button>
              )}
              {/* ── Steam game info — encart centre du header ── */}
              <div style={{ flex: '1 1 0', display: 'flex', justifyContent: 'center', minWidth: gameInfo ? 200 : 0, overflow: 'hidden' }}>
                {gameInfo && (() => {
                  const reviewColor = gameInfo.reviewScore >= 8 ? '#4cd882' : gameInfo.reviewScore >= 5 ? '#f5c518' : '#f87575';
                  const reviewBg    = gameInfo.reviewScore >= 8 ? 'rgba(60,200,100,.1)' : gameInfo.reviewScore >= 5 ? 'rgba(245,197,24,.1)' : 'rgba(248,117,117,.1)';
                  return (
                    <div style={{
                      display: 'flex', alignItems: 'stretch', gap: 0,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10, overflow: 'hidden',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                      fontSize: 12, flexShrink: 0, maxWidth: 520,
                    }}>
                      {/* Joueurs actifs */}
                      {gameInfo.playerCount !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3db86a', boxShadow: '0 0 8px #3db86a88', display: 'inline-block', flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{gameInfo.playerCount.toLocaleString('fr-FR')}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>en jeu</div>
                          </div>
                        </div>
                      )}
                      {/* Avis Steam */}
                      {gameInfo.reviewScoreDesc && (
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', background: reviewBg, borderRight: gameInfo.metacritic || gameInfo.price ? '1px solid rgba(255,255,255,0.08)' : undefined, cursor: 'pointer' }}
                          onClick={() => window.open(`https://store.steampowered.com/app/${gameInfo.appid}/#app_reviews_hash`, '_blank')}
                          title="Voir les avis Steam"
                        >
                          <span style={{ fontSize: 15, lineHeight: 1 }}>{gameInfo.reviewScore >= 8 ? '👍' : gameInfo.reviewScore >= 5 ? '😐' : '👎'}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: reviewColor, lineHeight: 1.2 }}>{gameInfo.reviewScoreDesc}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1 }}>
                              {gameInfo.positivePercent !== null ? `${gameInfo.positivePercent}% positif` : ''}
                              {gameInfo.totalReviews ? ` · ${gameInfo.totalReviews.toLocaleString('fr-FR')} avis` : ''}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Métacritique */}
                      {gameInfo.metacritic !== null && (
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRight: gameInfo.price ? '1px solid rgba(255,255,255,0.08)' : undefined, cursor: gameInfo.metacriticUrl ? 'pointer' : 'default' }}
                          onClick={() => gameInfo.metacriticUrl && window.open(gameInfo.metacriticUrl, '_blank')}
                          title={gameInfo.metacriticUrl ? 'Voir sur Metacritic' : undefined}
                        >
                          <div style={{
                            width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: gameInfo.metacritic >= 75 ? '#6c3' : gameInfo.metacritic >= 50 ? '#fc3' : '#f00',
                            fontWeight: 900, fontSize: 13, color: '#000', flexShrink: 0, lineHeight: 1,
                          }}>{gameInfo.metacritic}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', lineHeight: 1.3 }}>Meta<br/>critic</div>
                        </div>
                      )}
                      {/* Prix */}
                      {gameInfo.price && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px' }}>
                          {gameInfo.discount > 0 && (
                            <span style={{ background: '#4c6b22', color: '#a4d007', fontWeight: 900, fontSize: 11, padding: '2px 5px', borderRadius: 4, flexShrink: 0 }}>-{gameInfo.discount}%</span>
                          )}
                          <div>
                            {gameInfo.discount > 0 && gameInfo.priceInitial && (
                              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textDecoration: 'line-through', lineHeight: 1 }}>{gameInfo.priceInitial}</div>
                            )}
                            <div style={{ fontWeight: 700, color: gameInfo.discount > 0 ? '#a4d007' : '#fff', lineHeight: 1.2 }}>{gameInfo.price}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              {(activeBoardId || publicBoardMode) && archiveCount > 0 && (
                <button
                  onClick={() => setShowArchived(v => !v)}
                  style={{
                    background: showArchived ? 'rgba(120,80,160,0.25)' : 'var(--surface2)',
                    border: showArchived ? '1px solid rgba(160,100,220,0.6)' : '1px solid var(--border)',
                    borderRadius: 6, padding: '5px 10px', color: showArchived ? '#c090f0' : 'var(--text-muted)',
                    fontSize: 11, cursor: 'pointer', flexShrink: 0, fontWeight: showArchived ? 700 : 400,
                  }}
                  title={showArchived ? 'Masquer les archives' : 'Afficher les archives'}
                >
                  📦 Archives{archiveCount > 0 ? ` (${archiveCount})` : ''}
                </button>
              )}
              <GlobalSearch token={token} onGoToBoard={handleSearchGoToBoard} onOpenGame={handleSearchOpenGame} />
              {activeBoardId && (
                <button onClick={() => { if (activeBoardId) fetchGames(activeBoardId); }} title="Rafraîchir" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 9px', color: 'var(--text-muted)', fontSize: 15, cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>↻</button>
              )}
            </>
          )}
        </header>
        {showPublicBoards ? (
          <PublicBoards key={publicBoardsKey} token={token} currentUser={currentUser} favBoardIds={new Set(favBoards.map(b => b.id))} onToggleFavorite={toggleFavorite} onOpenBoard={openPublicBoard} onClose={() => setShowPublicBoards(false)} />
        ) : showHome && !publicBoardMode ? (
          homeView
        ) : publicBoardMode ? (
          loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
          ) : (
            <KanbanBoard columns={columns} byColumn={byColumn} dragging={dragging} setDragging={setDragging} moveGame={moveGame} onCardClick={setSelectedGame} onArchiveGame={archiveGame} onUnarchiveGame={unarchiveGame} onDeleteGame={removeGame} onEditGame={setEditingGame} onRenameColumn={renameColumn} onDeleteColumn={deleteColumn} onSetEmoji={setColumnEmoji} onReorderColumns={reorderColumns} onAddToColumn={colId => { setSearchTargetCol(colId); setShowSearch(true); }} onReorderGames={reorderGamesInColumn} isTaskBoard={isTaskBoard} appUsers={appUsers} />
          )
        ) : !activeBoardId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Crée un board pour commencer</div>
        ) : loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Chargement...</div>
        ) : (
          <KanbanBoard columns={columns} byColumn={byColumn} dragging={dragging} setDragging={setDragging} moveGame={moveGame} onCardClick={setSelectedGame} onArchiveGame={archiveGame} onUnarchiveGame={unarchiveGame} onDeleteGame={removeGame} onEditGame={setEditingGame} onRenameColumn={renameColumn} onDeleteColumn={deleteColumn} onSetEmoji={setColumnEmoji} onReorderColumns={reorderColumns} onAddToColumn={colId => { setSearchTargetCol(colId); setShowSearch(true); }} onReorderGames={reorderGamesInColumn} isTaskBoard={isTaskBoard} appUsers={appUsers} />
        )}
      </div>
      <footer style={{ position: 'fixed', bottom: 0, right: 0, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: 'var(--text-muted)' }}>
        <span>by Oweebee</span>
        <a href="https://discord.gg/9mXpM9wv" target="_blank" rel="noreferrer" style={{ color: '#7289da', textDecoration: 'none' }}>Discord</a>
        <a href="https://github.com/oweebee/kangbangaming" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>GitHub</a>
      </footer>
      {showSearch && <SearchModal api={API} token={token} boardGames={games} onAdd={g => addGame(g, searchTargetCol)} onRemove={removeGame} onClose={() => { setShowSearch(false); setSearchTargetCol(null); }} customOnly={isTaskBoard} isTaskBoard={isTaskBoard} appUsers={appUsers} />}
      {editingGame && <SearchModal api={API} token={token} boardGames={games} onAdd={addGame} onRemove={removeGame} onClose={() => setEditingGame(null)} customOnly={isTaskBoard} isTaskBoard={isTaskBoard} appUsers={appUsers} initialGame={editingGame} onSave={async g => { await updateGame(g); setEditingGame(null); }} />}
      {displayedGame && displayedGame.type === 'custom'
        ? <TaskModal game={displayedGame} appUsers={appUsers} onPatchGame={patchGame} onClose={() => setSelectedGame(null)} onEdit={() => { setEditingGame(displayedGame); setSelectedGame(null); }} isTaskBoard={isTaskBoard} />
        : displayedGame && <GameModal game={displayedGame} onClose={() => setSelectedGame(null)} api={API} token={token} />
      }
      {showAdmin && <AdminPanel token={token} currentUser={currentUser} onClose={() => setShowAdmin(false)} />}
      {showSteamSettings && <SteamSettings token={token} onSave={handleSteamSave} onClose={() => setShowSteamSettings(false)} />}
      {showProfile && <ProfilePage token={token} currentUser={currentUser} onClose={() => setShowProfile(false)} />}
      {/* Game stats widget — shown only when viewing a Steam-based board */}
      {isTaskBoard && !showHome && !showPublicBoards && (
        <GameStatsWidget
          api={API}
          token={token}
          board={publicBoardMode || activeBoard}
        />
      )}
    </div>
  );
}
