import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const GLOBAL_STEAM_API_KEY = process.env.STEAM_API_KEY;
// STEAM_ID is per-user only
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const LIBRARY_TTL = 5 * 60 * 1000;

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOARDS_FILE = path.join(DATA_DIR, 'boards.json');

// ── Data helpers ─────────────────────────────────────────────────────────────

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}
function readUsers() {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { return []; }
}
function writeUsers(users) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function readBoards() {
  ensureDataDir();
  if (!fs.existsSync(BOARDS_FILE)) fs.writeFileSync(BOARDS_FILE, '{}');
  try { return JSON.parse(fs.readFileSync(BOARDS_FILE, 'utf8')); } catch { return {}; }
}
function writeBoards(boards) {
  ensureDataDir();
  fs.writeFileSync(BOARDS_FILE, JSON.stringify(boards, null, 2));
}
function getUserBoards(userId) { return readBoards()[userId] || {}; }
function setUserBoards(userId, userBoards) {
  const all = readBoards(); all[userId] = userBoards; writeBoards(all);
}
function getUserSteamCreds(userId) {
  const user = readUsers().find(u => u.id === userId);
  return {
    apiKey: GLOBAL_STEAM_API_KEY || user?.steamApiKey,
    steamId: user?.steamId || null,
  };
}
function userPublicInfo(u) {
  return { id: u.id, username: u.username, role: u.role, status: u.status || 'active', createdAt: u.createdAt };
}

// ── Startup ───────────────────────────────────────────────────────────────────

async function ensureAdmin() {
  const users = readUsers();
  const existing = users.find(u => u.username === 'admin');
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  if (!existing) {
    users.push({ id: 'admin', username: 'admin', passwordHash: hash, role: 'admin', status: 'active', createdAt: new Date().toISOString() });
    writeUsers(users);
    console.log('[auth] Admin user created');
  } else {
    existing.passwordHash = hash;
    if (!existing.status) existing.status = 'active';
    writeUsers(users);
  }
  // Migrate legacy flat boards
  const all = readBoards();
  const isLegacy = Object.values(all).some(v => v && typeof v === 'object' && !Array.isArray(v) && ('name' in v || 'columns' in v || 'games' in v));
  if (isLegacy) {
    console.log('[auth] Migrating legacy boards to admin user');
    const adminBoards = {};
    for (const [k, v] of Object.entries(all)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && ('name' in v || 'columns' in v || 'games' in v)) adminBoards[k] = v;
    }
    writeBoards({ admin: adminBoards });
  }
}

// ── JWT middleware ────────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.replace('Bearer ', '');
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  });
}

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!await bcrypt.compare(password, user.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });
  if ((user.status || 'active') === 'pending') return res.status(403).json({ error: 'pending', message: 'Ton compte est en attente de validation par un admin.' });
  if ((user.status || 'active') === 'suspended') return res.status(403).json({ error: 'suspended', message: 'Ton compte a été suspendu.' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, steamAvatar: user.steamAvatar || null, steamPersonaName: user.steamPersonaName || null } });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password, steamId } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  if (username.length < 3) return res.status(400).json({ error: 'Username too short (min 3)' });
  if (password.length < 6) return res.status(400).json({ error: 'Password too short (min 6)' });
  if (!steamId || !/^\d{17}$/.test(steamId.trim())) return res.status(400).json({ error: 'Steam ID invalide (17 chiffres requis)' });
  const users = readUsers();
  if (users.find(u => u.username === username)) return res.status(409).json({ error: 'Username taken' });
  const hash = await bcrypt.hash(password, 10);
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newUser = { id, username, passwordHash: hash, role: 'user', status: 'pending', steamId: steamId.trim(), createdAt: new Date().toISOString() };
  // Try to fetch Steam avatar immediately
  if (GLOBAL_STEAM_API_KEY) {
    try {
      const data = await steamFetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${GLOBAL_STEAM_API_KEY}&steamids=${steamId.trim()}`);
      const player = data.response?.players?.[0];
      if (player) { newUser.steamAvatar = player.avatarmedium || player.avatar || null; newUser.steamPersonaName = player.personaname || null; }
    } catch { /* not critical */ }
  }
  users.push(newUser);
  writeUsers(users);
  // Don't issue a token — user must wait for approval
  res.status(201).json({ pending: true, message: 'Compte créé ! Un admin doit valider ton inscription avant que tu puisses te connecter.' });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = readUsers().find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, username: user.username, role: user.role, steamAvatar: user.steamAvatar || null, steamPersonaName: user.steamPersonaName || null });
});

// ── User profile + settings ───────────────────────────────────────────────────

app.get('/api/user/profile', requireAuth, (req, res) => {
  try {
    const users = readUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'Not found' });

    const userBoards = getUserBoards(req.user.id);
    const boardList = Object.entries(userBoards);
    const boardCount = boardList.length;
    const publicBoardCount = boardList.filter(([, b]) => b.public).length;
    let totalGames = 0, customCards = 0, totalColumns = 0;
    for (const [, board] of boardList) {
      const games = Object.values(board.games || {});
      totalGames += games.length;
      customCards += games.filter(g => g.type === 'custom').length;
      totalColumns += (board.columns || []).length;
    }

    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt || null,
      steamId: user.steamId || null,
      steamAvatar: user.steamAvatar || null,
      steamPersonaName: user.steamPersonaName || null,
      stats: { boardCount, publicBoardCount, totalGames, customCards, totalColumns },
    });
  } catch (err) {
    console.error('[profile]', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.get('/api/user/settings', requireAuth, (req, res) => {
  const user = readUsers().find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ steamId: user.steamId || '', hasSteamId: !!user.steamId, steamAvatar: user.steamAvatar || null, steamPersonaName: user.steamPersonaName || null });
});

app.patch('/api/user/settings', requireAuth, async (req, res) => {
  try {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    if (req.body.steamId !== undefined) {
      const newSteamId = req.body.steamId.trim();
      users[idx].steamId = newSteamId;
      if (newSteamId && GLOBAL_STEAM_API_KEY) {
        try {
          const data = await steamFetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${GLOBAL_STEAM_API_KEY}&steamids=${newSteamId}`);
          const player = data.response?.players?.[0];
          if (player) { users[idx].steamAvatar = player.avatarmedium || player.avatar || null; users[idx].steamPersonaName = player.personaname || null; }
        } catch { /* not critical */ }
      } else { users[idx].steamAvatar = null; users[idx].steamPersonaName = null; }
    }
    writeUsers(users);
    libraryCaches.delete(req.user.id);
    res.json({ ok: true, steamAvatar: users[idx].steamAvatar || null, steamPersonaName: users[idx].steamPersonaName || null });
  } catch (err) {
    console.error('[PATCH /user/settings]', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});


app.patch('/api/user/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Champs manquants' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Nouveau mot de passe trop court (min. 6 caract.)' });
  const users = readUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const ok = await bcrypt.compare(currentPassword, users[idx].passwordHash);
  if (!ok) return res.status(403).json({ error: 'Mot de passe actuel incorrect' });
  users[idx].passwordHash = await bcrypt.hash(newPassword, 10);
  writeUsers(users);
  res.json({ ok: true });
});

// ── Admin routes ──────────────────────────────────────────────────────────────

app.get('/api/admin/users', requireAdmin, (req, res) => {
  res.json(readUsers().map(userPublicInfo));
});

app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  if (req.params.id === 'admin' && req.body.role) return res.status(400).json({ error: 'Cannot change admin role' });
  if (req.body.role) users[idx].role = req.body.role;
  if (req.body.status) {
    if (req.params.id === 'admin') return res.status(400).json({ error: 'Cannot change admin status' });
    users[idx].status = req.body.status;
  }
  if (req.body.password) {
    if (req.body.password.length < 6) return res.status(400).json({ error: 'Password too short' });
    users[idx].passwordHash = await bcrypt.hash(req.body.password, 10);
  }
  writeUsers(users);
  res.json(userPublicInfo(users[idx]));
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  if (req.params.id === 'admin') return res.status(400).json({ error: 'Cannot delete admin' });
  const users = readUsers();
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(idx, 1);
  writeUsers(users);
  const all = readBoards(); delete all[req.params.id]; writeBoards(all);
  res.json({ ok: true });
});

// ── Steam library cache (per user) ───────────────────────────────────────────

const libraryCaches = new Map();

async function steamFetch(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Steam API ${r.status}`);
  return r.json();
}

async function getLibraryMap(userId) {
  const creds = getUserSteamCreds(userId);
  if (!creds.apiKey || !creds.steamId) return new Map();
  const entry = libraryCaches.get(userId) || { cache: null, cacheAt: 0 };
  if (entry.cache && Date.now() - entry.cacheAt < LIBRARY_TTL) return entry.cache;
  try {
    const data = await steamFetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${creds.apiKey}&steamid=${creds.steamId}&include_appinfo=1&include_played_free_games=1&format=json`);
    const cache = new Map((data.response?.games || []).map(g => [g.appid, {
      icon_url: g.img_icon_url ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg` : null,
      playtime_forever: g.playtime_forever || 0,
    }]));
    libraryCaches.set(userId, { cache, cacheAt: Date.now() });
    return cache;
  } catch {
    libraryCaches.set(userId, { cache: new Map(), cacheAt: Date.now() });
    return new Map();
  }
}

// ── Steam routes ──────────────────────────────────────────────────────────────

app.get('/api/steam/search', requireAuth, async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });
  try {
    const data = await steamFetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=english&cc=US`);
    const lib = await getLibraryMap(req.user.id);
    res.json((data.items || []).map(g => {
      const libEntry = lib.get(g.id);
      return { appid: g.id, name: g.name, header_img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.id}/header.jpg`, icon_img: libEntry?.icon_url || null, in_library: lib.has(g.id), playtime_hours: libEntry ? Math.round(libEntry.playtime_forever / 60) : 0 };
    }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/steam/achievements/:appid', requireAuth, async (req, res) => {
  const creds = getUserSteamCreds(req.user.id);
  if (!creds.apiKey || !creds.steamId) return res.status(400).json({ error: 'No Steam credentials configured' });
  try {
    const [statsData, schemaData] = await Promise.all([
      steamFetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${creds.apiKey}&steamid=${creds.steamId}&appid=${req.params.appid}&l=english`),
      steamFetch(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${creds.apiKey}&appid=${req.params.appid}&l=english`),
    ]);
    const playerAchs = statsData.playerstats?.achievements || [];
    const schemaMap = new Map((schemaData.game?.availableGameStats?.achievements || []).map(a => [a.name, a]));
    res.json({ achievements: playerAchs.map(a => { const s = schemaMap.get(a.apiname) || {}; return { apiname: a.apiname, achieved: a.achieved === 1, unlocktime: a.unlocktime, name: s.displayName || a.apiname, description: s.description || '', icon: a.achieved ? s.icon : s.icongray }; }), gameName: statsData.playerstats?.gameName || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/steam/gamestats/:appid', requireAuth, async (req, res) => {
  const { appid } = req.params;
  const creds = getUserSteamCreds(req.user.id);
  if (!creds.apiKey || !creds.steamId) return res.status(400).json({ error: 'No Steam credentials' });
  try {
    const [lib, statsData, schemaData] = await Promise.all([
      getLibraryMap(req.user.id),
      steamFetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${creds.apiKey}&steamid=${creds.steamId}&appid=${appid}&l=french`).catch(() => null),
      steamFetch(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${creds.apiKey}&appid=${appid}`).catch(() => null),
    ]);
    const libEntry = lib.get(parseInt(appid));
    const playtime_minutes = libEntry ? libEntry.playtime_forever : 0;
    const playerAchs = statsData?.playerstats?.achievements || [];
    const totalAchs = schemaData?.game?.availableGameStats?.achievements?.length || 0;
    const unlockedAchs = playerAchs.filter(a => a.achieved === 1).length;
    const gameName = statsData?.playerstats?.gameName || '';
    res.json({
      name: gameName,
      playtime_minutes,
      playtime_hours: Math.floor(playtime_minutes / 60),
      playtime_display: playtime_minutes >= 60
        ? `${Math.floor(playtime_minutes / 60)}h ${playtime_minutes % 60}min`
        : `${playtime_minutes} min`,
      achievements_unlocked: unlockedAchs,
      achievements_total: totalAchs,
      achievements_url: creds.steamId ? `https://steamcommunity.com/profiles/${creds.steamId}/stats/${appid}/achievements/` : null,
      header_img: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Public boards ─────────────────────────────────────────────────────────────

app.get('/api/public/boards', requireAuth, (req, res) => {
  const all = readBoards();
  const userMap = new Map(readUsers().map(u => [u.id, u.username]));
  const result = [];
  for (const [userId, userBoards] of Object.entries(all)) {
    for (const [boardId, board] of Object.entries(userBoards || {})) {
      if (board.public) {
        const user = readUsers().find(u => u.id === req.user.id); const favIds = new Set(user?.favorites || []); const firstGame = Object.values(board.games || {})[0]; const headerImg = board.headerImg || firstGame?.header_img || null; result.push({ id: boardId, name: board.name, emoji: board.emoji || '', gameIcon: board.gameIcon || null, headerImg, columns: board.columns || [], games: Object.values(board.games || {}), gameCount: Object.keys(board.games || {}).length, ownerUsername: userMap.get(userId) || 'unknown', ownerId: userId, isOwner: userId === req.user.id, isFavorite: favIds.has(boardId) });
      }
    }
  }
  res.json(result);
});

// ── Favorites ─────────────────────────────────────────────────────────────────

app.get('/api/user/favorites', requireAuth, (req, res) => {
  const users = readUsers();
  const me = users.find(u => u.id === req.user.id);
  const favIds = new Set(me?.favorites || []);
  if (favIds.size === 0) return res.json([]);
  const all = readBoards();
  const userMap = new Map(users.map(u => [u.id, u.username]));
  const result = [];
  for (const [userId, userBoards] of Object.entries(all)) {
    for (const [boardId, board] of Object.entries(userBoards || {})) {
      if (favIds.has(boardId) && board.public) {
        const firstGame2 = Object.values(board.games || {})[0]; const headerImg2 = board.headerImg || firstGame2?.header_img || null; result.push({ id: boardId, name: board.name, emoji: board.emoji || '', gameIcon: board.gameIcon || null, headerImg: headerImg2, ownerUsername: userMap.get(userId) || 'unknown', ownerId: userId, isFavorite: true });
      }
    }
  }
  res.json(result);
});

app.post('/api/user/favorites/:boardId', requireAuth, (req, res) => {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (!users[idx].favorites) users[idx].favorites = [];
  if (!users[idx].favorites.includes(req.params.boardId)) users[idx].favorites.push(req.params.boardId);
  writeUsers(users);
  res.json({ ok: true });
});

app.delete('/api/user/favorites/:boardId', requireAuth, (req, res) => {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  users[idx].favorites = (users[idx].favorites || []).filter(id => id !== req.params.boardId);
  writeUsers(users);
  res.json({ ok: true });
});


// ── Collaborative public board routes ─────────────────────────────────────────

function findPublicBoard(boardId) {
  const all = readBoards();
  for (const [userId, userBoards] of Object.entries(all)) {
    if (userBoards[boardId]?.public) {
      return { userId, board: userBoards[boardId], all, userBoards };
    }
  }
  return null;
}

app.get('/api/public/boards/:boardId/columns', requireAuth, (req, res) => {
  const f = findPublicBoard(req.params.boardId);
  if (!f) return res.status(404).json({ error: 'Not found' });
  res.json(f.board.columns || []);
});

app.post('/api/public/boards/:boardId/columns', requireAuth, (req, res) => {
  const f = findPublicBoard(req.params.boardId);
  if (!f) return res.status(404).json({ error: 'Not found' });
  const col = { id: `col_${Date.now()}`, label: req.body.label || 'Nouvelle colonne', emoji: req.body.emoji || '' };
  f.board.columns = [...(f.board.columns || []), col];
  f.userBoards[req.params.boardId] = f.board;
  f.all[f.userId] = f.userBoards;
  writeBoards(f.all);
  res.status(201).json(col);
});

app.patch('/api/public/boards/:boardId/columns/:colId', requireAuth, (req, res) => {
  const f = findPublicBoard(req.params.boardId);
  if (!f) return res.status(404).json({ error: 'Not found' });
  const col = (f.board.columns || []).find(c => c.id === req.params.colId);
  if (!col) return res.status(404).json({ error: 'Column not found' });
  if (req.body.label !== undefined) col.label = req.body.label;
  if (req.body.emoji !== undefined) col.emoji = req.body.emoji;
  f.userBoards[req.params.boardId] = f.board;
  f.all[f.userId] = f.userBoards;
  writeBoards(f.all);
  res.json(col);
});

app.patch('/api/public/boards/:boardId/columns/reorder', requireAuth, (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be array' });
  const f = findPublicBoard(req.params.boardId);
  if (!f) return res.status(404).json({ error: 'Board not found' });
  const colMap = Object.fromEntries((f.board.columns || []).map(c => [c.id, c]));
  f.board.columns = order.filter(id => colMap[id]).map(id => colMap[id]);
  f.all[f.userId] = f.userBoards;
  writeBoards(f.all);
  res.json(f.board.columns);
});

app.delete('/api/public/boards/:boardId/columns/:colId', requireAuth, (req, res) => {
  const f = findPublicBoard(req.params.boardId);
  if (!f) return res.status(404).json({ error: 'Not found' });
  f.board.columns = (f.board.columns || []).filter(c => c.id !== req.params.colId);
  if (f.board.games) Object.values(f.board.games).forEach(g => { if (g.column === req.params.colId) g.column = f.board.columns[0]?.id || ''; });
  f.userBoards[req.params.boardId] = f.board;
  f.all[f.userId] = f.userBoards;
  writeBoards(f.all);
  res.json({ ok: true });
});

app.get('/api/public/boards/:boardId/games', requireAuth, (req, res) => {
  const f = findPublicBoard(req.params.boardId);
  if (!f) return res.status(404).json({ error: 'Not found' });
  res.json(Object.values(f.board.games || {}));
});

app.post('/api/public/boards/:boardId/games', requireAuth, (req, res) => {
  const f = findPublicBoard(req.params.boardId);
  if (!f) return res.status(404).json({ error: 'Not found' });
  const { appid, name, header_img, icon_img, column, type, emoji, taskType } = req.body;
  if (!appid || !column) return res.status(400).json({ error: 'Missing fields' });
  if (!f.board.games) f.board.games = {};
  f.board.games[appid] = { appid, name, header_img: header_img || null, icon_img: icon_img || null, column, type: type || 'steam', emoji: emoji || null, taskType: taskType || null, addedAt: new Date().toISOString() };
  f.userBoards[req.params.boardId] = f.board;
  f.all[f.userId] = f.userBoards;
  writeBoards(f.all);
  res.status(201).json(f.board.games[appid]);
});

app.patch('/api/public/boards/:boardId/games/:appid', requireAuth, (req, res) => {
  const f = findPublicBoard(req.params.boardId);
  if (!f) return res.status(404).json({ error: 'Not found' });
  const game = (f.board.games || {})[req.params.appid];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (req.body.column !== undefined) game.column = req.body.column;
  if (req.body.notes !== undefined) game.notes = req.body.notes;
  if (req.body.name !== undefined) game.name = req.body.name;
  if (req.body.emoji !== undefined) game.emoji = req.body.emoji;
  if (req.body.taskType !== undefined) game.taskType = req.body.taskType;
  f.userBoards[req.params.boardId] = f.board;
  f.all[f.userId] = f.userBoards;
  writeBoards(f.all);
  res.json(game);
});

app.delete('/api/public/boards/:boardId/games/:appid', requireAuth, (req, res) => {
  const f = findPublicBoard(req.params.boardId);
  if (!f) return res.status(404).json({ error: 'Not found' });
  if (!(f.board.games || {})[req.params.appid]) return res.status(404).json({ error: 'Not found' });
  delete f.board.games[req.params.appid];
  f.userBoards[req.params.boardId] = f.board;
  f.all[f.userId] = f.userBoards;
  writeBoards(f.all);
  res.json({ ok: true });
});

// ── Board routes ──────────────────────────────────────────────────────────────

app.get('/api/boards', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  res.json(Object.entries(userBoards).map(([id, b]) => {
    const firstGame = Object.values(b.games || {})[0];
    const headerImg = b.headerImg || firstGame?.header_img || null;
    return { id, name: b.name, emoji: b.emoji || '🎮', gameIcon: b.gameIcon || null, headerImg, columns: b.columns || [], public: b.public || false };
  }));
});

app.post('/api/boards', requireAuth, (req, res) => {
  try {
    const { name, emoji, gameIcon, headerImg, gameBoard } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    const id = `board_${Date.now()}`;
    const t = Date.now();
    const defaultColumns = (gameBoard || gameIcon) ? [
      { id: `col_${t}_1`, label: 'Tâches à accomplir', emoji: '⏳' },
      { id: `col_${t}_2`, label: 'Tâches en cours',    emoji: '⛏️' },
      { id: `col_${t}_3`, label: 'Tâches en pause',    emoji: '⏸️' },
      { id: `col_${t}_4`, label: 'Tâches abandonnées', emoji: '❌' },
      { id: `col_${t}_5`, label: 'Tâches accomplies',  emoji: '✅', color: '#3db86a' },
    ] : [
      { id: `col_${t}_1`, label: 'À jouer', emoji: '📋' },
      { id: `col_${t}_2`, label: 'En cours', emoji: '🎮' },
      { id: `col_${t}_3`, label: 'Terminé',  emoji: '✅' },
    ];
    const board = { name, emoji: emoji || '🎮', gameIcon: gameIcon || null, headerImg: headerImg || null, public: false, columns: defaultColumns, games: {} };
    const userBoards = getUserBoards(req.user.id);
    userBoards[id] = board;
    setUserBoards(req.user.id, userBoards);
    res.status(201).json({ id, name: board.name, emoji: board.emoji, gameIcon: board.gameIcon, headerImg: board.headerImg, columns: board.columns, public: false });
  } catch (err) {
    console.error('[POST /boards]', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

app.patch('/api/boards/:boardId', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  if (req.body.name !== undefined) board.name = req.body.name;
  if (req.body.emoji !== undefined) board.emoji = req.body.emoji;
  if (req.body.gameIcon !== undefined) board.gameIcon = req.body.gameIcon;
  if (req.body.public !== undefined) board.public = !!req.body.public;
  setUserBoards(req.user.id, userBoards);
  res.json({ id: req.params.boardId, name: board.name, emoji: board.emoji, gameIcon: board.gameIcon, public: board.public });
});

app.delete('/api/boards/:boardId', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  if (!userBoards[req.params.boardId]) return res.status(404).json({ error: 'Board not found' });
  delete userBoards[req.params.boardId];
  setUserBoards(req.user.id, userBoards);
  res.json({ ok: true });
});

// ── Column routes ─────────────────────────────────────────────────────────────

app.get('/api/boards/:boardId/columns', requireAuth, (req, res) => {
  const board = getUserBoards(req.user.id)[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  res.json(board.columns || []);
});

app.post('/api/boards/:boardId/columns', requireAuth, (req, res) => {
  const { label, emoji } = req.body;
  if (!label) return res.status(400).json({ error: 'Missing label' });
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  const col = { id: `col_${Date.now()}`, label, emoji: emoji || '' };
  board.columns = [...(board.columns || []), col];
  setUserBoards(req.user.id, userBoards);
  res.status(201).json(col);
});

app.patch('/api/boards/:boardId/columns/reorder', requireAuth, (req, res) => {
  const { order } = req.body; // array of colIds
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be array' });
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  const colMap = Object.fromEntries((board.columns || []).map(c => [c.id, c]));
  board.columns = order.filter(id => colMap[id]).map(id => colMap[id]);
  setUserBoards(req.user.id, userBoards);
  res.json(board.columns);
});

app.patch('/api/boards/:boardId/columns/:colId', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  const col = (board.columns || []).find(c => c.id === req.params.colId);
  if (!col) return res.status(404).json({ error: 'Column not found' });
  if (req.body.label !== undefined) col.label = req.body.label;
  if (req.body.emoji !== undefined) col.emoji = req.body.emoji;
  setUserBoards(req.user.id, userBoards);
  res.json(col);
});

app.delete('/api/boards/:boardId/columns/:colId', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  board.columns = (board.columns || []).filter(c => c.id !== req.params.colId);
  setUserBoards(req.user.id, userBoards);
  res.json({ ok: true });
});

// ── Game routes ───────────────────────────────────────────────────────────────

app.get('/api/boards/:boardId/games', requireAuth, (req, res) => {
  const board = getUserBoards(req.user.id)[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  res.json(Object.values(board.games || {}));
});

app.post('/api/boards/:boardId/games', requireAuth, (req, res) => {
  const { appid, name, header_img, column, icon_img, type, emoji, taskType } = req.body;
  if (!appid || !column) return res.status(400).json({ error: 'Missing fields' });
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  if (!board.games) board.games = {};
  board.games[appid] = { appid, name, header_img: header_img || null, icon_img: icon_img || null, column, type: type || 'steam', emoji: emoji || null, taskType: taskType || null, addedAt: new Date().toISOString() };
  setUserBoards(req.user.id, userBoards);
  res.status(201).json(board.games[appid]);
});

app.patch('/api/boards/:boardId/games/:appid', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  const game = (board.games || {})[req.params.appid];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (req.body.column !== undefined) game.column = req.body.column;
  if (req.body.notes !== undefined) game.notes = req.body.notes;
  if (req.body.name !== undefined) game.name = req.body.name;
  if (req.body.emoji !== undefined) game.emoji = req.body.emoji;
  if (req.body.taskType !== undefined) game.taskType = req.body.taskType;
  setUserBoards(req.user.id, userBoards);
  res.json(game);
});

app.delete('/api/boards/:boardId/games/:appid', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  if (!(board.games || {})[req.params.appid]) return res.status(404).json({ error: 'Game not found' });
  delete board.games[req.params.appid];
  setUserBoards(req.user.id, userBoards);
  res.json({ ok: true });
});

// ── Start ─────────────────────────────────────────────────────────────────────

ensureAdmin().then(() => {
  app.listen(PORT, () => console.log(`[server] Backend running on port ${PORT}`));
}).catch(err => {
  console.error('[server] Startup error:', err);
  process.exit(1);
});
