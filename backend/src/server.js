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
const USERS_FILE    = path.join(DATA_DIR, 'users.json');
const BOARDS_FILE   = path.join(DATA_DIR, 'boards.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// ── Data helpers ─────────────────────────────────────────────────────────────

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache — avoids JSON disk reads on every request.
// Invalidated (updated) on each write. Node.js is single-threaded so no race.
let _usersCache    = null;
let _boardsCache   = null;
let _settingsCache = null;

const DEFAULT_SETTINGS = { requireApproval: false, discordUrl: '', discordIconUrl: '' };

function readSettings() {
  ensureDataDir();
  if (_settingsCache !== null) return _settingsCache;
  if (!fs.existsSync(SETTINGS_FILE)) { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2)); _settingsCache = { ...DEFAULT_SETTINGS }; return _settingsCache; }
  try { _settingsCache = { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) }; } catch { _settingsCache = { ...DEFAULT_SETTINGS }; }
  return _settingsCache;
}
function writeSettings(s) {
  ensureDataDir();
  _settingsCache = s;
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
}

function readUsers() {
  ensureDataDir();
  if (_usersCache !== null) return _usersCache;
  if (!fs.existsSync(USERS_FILE)) { fs.writeFileSync(USERS_FILE, '[]'); _usersCache = []; return _usersCache; }
  try { _usersCache = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch { _usersCache = []; }
  return _usersCache;
}
function writeUsers(users) {
  ensureDataDir();
  _usersCache = users;
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function readBoards() {
  ensureDataDir();
  if (_boardsCache !== null) return _boardsCache;
  if (!fs.existsSync(BOARDS_FILE)) { fs.writeFileSync(BOARDS_FILE, '{}'); _boardsCache = {}; return _boardsCache; }
  try { _boardsCache = JSON.parse(fs.readFileSync(BOARDS_FILE, 'utf8')); } catch { _boardsCache = {}; }
  return _boardsCache;
}
function writeBoards(boards) {
  ensureDataDir();
  _boardsCache = boards;
  fs.writeFileSync(BOARDS_FILE, JSON.stringify(boards, null, 2));
}
function getUserBoards(userId) { return readBoards()[userId] || {}; }
function setUserBoards(userId, userBoards) {
  const all = readBoards(); all[userId] = userBoards; writeBoards(all);
}
// Résout l'image "cartouche" d'un board pour l'affichage (accueil + en-tête de board ouvert).
// Règles :
//  - Si le board a sa propre headerImg (board créé depuis un jeu Steam choisi explicitement), on l'utilise.
//  - Sinon, si le board a un gameIcon (idem, lié à un jeu), pas d'image de secours ici — le gameIcon
//    sert déjà de fallback visuel côté front (HomeBoardCard).
//  - Sinon, si le board contient EXACTEMENT une carte de type Steam avec une image, on l'utilise :
//    ça correspond à un board "lié à un jeu Steam" dans l'esprit de l'utilisateur (un seul jeu dedans),
//    sans réintroduire le bug d'origine (board perso/backlog avec plusieurs jeux → image trompeuse).
//  - Sinon (0 ou 2+ cartes Steam, board perso/backlog) → pas d'image, l'emoji du board prend le relais.
function resolveBoardHeaderImg(board) {
  if (board.headerImg) return board.headerImg;
  if (board.gameIcon) return null;
  const steamCards = Object.values(board.games || {}).filter(g => !g.deletedAt && g.type !== 'custom' && g.header_img);
  return steamCards.length === 1 ? steamCards[0].header_img : null;
}
function getUserSteamCreds(userId) {
  const user = readUsers().find(u => u.id === userId);
  return {
    // Priorité à la clé personnelle de l'utilisateur : seule la clé du
    // propriétaire du compte lève les restrictions de confidentialité Steam
    // (profil privé/amis uniquement). La clé globale reste le repli par défaut.
    apiKey: user?.steamApiKey || GLOBAL_STEAM_API_KEY,
    steamId: user?.steamId || null,
  };
}
function userPublicInfo(u) {
  return { id: u.id, username: u.username, role: u.role, status: u.status || 'active', createdAt: u.createdAt, steamAuth: u.steamAuth || false, steamAvatar: u.steamAvatar || null, steamPersonaName: u.steamPersonaName || null };
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

// ── Steam OpenID login ────────────────────────────────────────────────────────

// SERVICE_URL_FRONTEND is auto-injected by Coolify — no manual config needed for basic deploys.
// Override with FRONTEND_URL / BACKEND_URL env vars for custom setups.
const FRONTEND_URL = process.env.FRONTEND_URL || process.env.SERVICE_URL_FRONTEND || 'http://localhost:5173';
const BACKEND_URL  = process.env.BACKEND_URL  || process.env.SERVICE_URL_FRONTEND || `http://localhost:${process.env.PORT || 3001}`;

// 1. Redirige vers Steam pour authentification
app.get('/api/auth/steam', (req, res) => {
  const params = new URLSearchParams({
    'openid.ns':         'http://specs.openid.net/auth/2.0',
    'openid.mode':       'checkid_setup',
    'openid.return_to':  `${BACKEND_URL}/api/auth/steam/callback`,
    'openid.realm':      FRONTEND_URL,
    'openid.identity':   'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });
  res.redirect(`https://steamcommunity.com/openid/login?${params}`);
});

// 2. Steam renvoie ici après authentification
app.get('/api/auth/steam/callback', async (req, res) => {
  try {
    // Vérification auprès de Steam
    const verifyParams = new URLSearchParams({ ...req.query, 'openid.mode': 'check_authentication' });
    const verifyRes = await fetch('https://steamcommunity.com/openid/login', {
      method: 'POST',
      body: verifyParams.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const text = await verifyRes.text();
    if (!text.includes('is_valid:true')) return res.redirect(`${FRONTEND_URL}?steam_error=invalid`);

    // Extraire steamId depuis openid.claimed_id (format: .../openid/id/76561198XXXXXXXXX)
    const steamId = req.query['openid.claimed_id']?.match(/(\d{17})$/)?.[1];
    if (!steamId) return res.redirect(`${FRONTEND_URL}?steam_error=no_steamid`);

    // Récupérer infos Steam
    let steamAvatar = null, steamPersonaName = null;
    if (GLOBAL_STEAM_API_KEY) {
      try {
        const data = await steamFetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${GLOBAL_STEAM_API_KEY}&steamids=${steamId}`);
        const player = data.response?.players?.[0];
        if (player) { steamAvatar = player.avatarmedium || player.avatar || null; steamPersonaName = player.personaname || null; }
      } catch { /* pas critique */ }
    }

    const users = readUsers();
    let user = users.find(u => u.steamId === steamId);

    if (user) {
      // User existant — mettre à jour avatar/persona si changé
      const idx = users.indexOf(user);
      users[idx] = { ...user, steamAvatar, steamPersonaName };
      writeUsers(users);
      user = users[idx];
    } else {
      // Nouveau user — créer un compte automatiquement
      // Username basé sur le persona Steam, unique
      let base = (steamPersonaName || `steam_${steamId.slice(-6)}`).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20);
      if (base.length < 3) base = `user_${steamId.slice(-6)}`;
      let username = base;
      let n = 1;
      while (users.find(u => u.username === username)) { username = `${base}${n++}`; }

      const settings = readSettings();
      user = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        username,
        passwordHash: null,
        role: 'user',
        status: settings.requireApproval ? 'pending' : 'active',
        steamId,
        steamAvatar,
        steamPersonaName,
        steamAuth: true,
        createdAt: new Date().toISOString(),
      };
      writeUsers([...users, user]);
    }

    if ((user.status || 'active') === 'suspended') return res.redirect(`${FRONTEND_URL}?steam_error=suspended`);
    if ((user.status || 'active') === 'pending')   return res.redirect(`${FRONTEND_URL}?steam_error=pending`);

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${FRONTEND_URL}?steam_token=${token}`);
  } catch (e) {
    console.error('[steam/callback]', e);
    res.redirect(`${FRONTEND_URL}?steam_error=server`);
  }
});

// ── Auth routes ───────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.passwordHash) return res.status(401).json({ error: 'steam_only', message: 'Ce compte utilise la connexion Steam. Utilise le bouton "Se connecter avec Steam".' });
  if (!await bcrypt.compare(password, user.passwordHash)) return res.status(401).json({ error: 'Invalid credentials' });
  if ((user.status || 'active') === 'pending') return res.status(403).json({ error: 'pending', message: 'Ton compte est en attente de validation par un admin.' });
  if ((user.status || 'active') === 'suspended') return res.status(403).json({ error: 'suspended', message: 'Ton compte a été suspendu.' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, steamAvatar: user.steamAvatar || null, steamPersonaName: user.steamPersonaName || null } });
});

// Registration is admin-only: requires a valid admin JWT
app.post('/api/auth/register', async (req, res) => {
  // Verify caller is an admin
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(403).json({ error: 'Inscriptions désactivées. Seul un administrateur peut créer des comptes.' });
  let caller;
  try { caller = jwt.verify(authHeader.slice(7), JWT_SECRET); } catch { return res.status(403).json({ error: 'Token invalide.' }); }
  if (caller.role !== 'admin') return res.status(403).json({ error: 'Réservé aux administrateurs.' });

  const { username, password, steamId } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  if (username.length < 3) return res.status(400).json({ error: 'Username too short (min 3)' });
  if (password.length < 6) return res.status(400).json({ error: 'Password too short (min 6)' });
  // steamId is now optional
  if (steamId && !/^\d{17}$/.test(steamId.trim())) return res.status(400).json({ error: 'Steam ID invalide (17 chiffres requis)' });
  const users = readUsers();
  if (users.find(u => u.username === username)) return res.status(409).json({ error: 'Username taken' });
  const hash = await bcrypt.hash(password, 10);
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const trimmedSteamId = steamId ? steamId.trim() : null;
  const newUser = { id, username, passwordHash: hash, role: 'user', status: 'active', createdAt: new Date().toISOString() };
  if (trimmedSteamId) newUser.steamId = trimmedSteamId;
  // Try to fetch Steam avatar immediately
  if (GLOBAL_STEAM_API_KEY && trimmedSteamId) {
    try {
      const data = await steamFetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${GLOBAL_STEAM_API_KEY}&steamids=${trimmedSteamId}`);
      const player = data.response?.players?.[0];
      if (player) { newUser.steamAvatar = player.avatarmedium || player.avatar || null; newUser.steamPersonaName = player.personaname || null; }
    } catch { /* not critical */ }
  }
  users.push(newUser);
  writeUsers(users);
  // Admin-created accounts are active immediately — no approval needed
  res.status(201).json({ success: true, message: `Compte "${username}" créé avec succès.`, user: userPublicInfo(newUser) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = readUsers().find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ id: user.id, username: user.username, role: user.role, steamAvatar: user.steamAvatar || null, steamPersonaName: user.steamPersonaName || null, steamAuth: user.steamAuth || false });
});

// ── Users list (for assignees feature) ───────────────────────────────────────

app.get('/api/users/list', requireAuth, (req, res) => {
  const users = readUsers();
  const list = users
    .filter(u => (u.status || 'active') === 'active' && u.role !== 'admin')
    .map(u => ({
      id: u.id,
      username: u.username,
      steamAvatar: u.steamAvatar || null,
      steamPersonaName: u.steamPersonaName || null,
      steamId: u.steamId || null,
    }));
  res.json(list);
});

// ── Deadlines ─────────────────────────────────────────────────────────────────
// Returns all tasks/games with dates from personal boards + followed public boards

app.get('/api/deadlines', requireAuth, (req, res) => {
  const results = [];
  const allBoards = readBoards();
  const me = readUsers().find(u => u.id === req.user.id);
  const favIds = new Set(me?.favorites || []);
  const userMap = new Map();
  for (const u of readUsers()) userMap.set(u.id, u.username);

  function collectFromBoard(boardId, board, ownerId) {
    const isOwn = ownerId === req.user.id;
    const boardName = board.name || '';
    const boardIcon = board.gameIcon || null;
    const boardHeaderImg = resolveBoardHeaderImg(board);
    for (const [gameId, game] of Object.entries(board.games || {})) {
      const hasDates = !!(game.dueDate || game.startDate || game.endDate);
      const urgentOnly = !hasDates && !!game.urgent && !game.done && !game.archived;
      if (!hasDates && !urgentOnly) continue;
      if (game.archived) continue;
      if (game.done) continue; // une tâche terminée ne doit jamais apparaître dans les échéances
      results.push({
        boardId, boardName, boardIcon, boardHeaderImg,
        isOwn, ownerUsername: isOwn ? null : (userMap.get(ownerId) || 'unknown'),
        isPublic: !isOwn,
        gameId,
        name: game.name || '',
        dueDate: game.dueDate || null,
        startDate: game.startDate || null,
        endDate: game.endDate || null,
        done: !!game.done,
        progress: game.progress ?? null,
        urgent: !!game.urgent,
        urgentOnly,
        taskType: game.taskType || null,
        header_img: game.header_img || null,
        icon_img: game.icon_img || null,
        emoji: game.emoji || null,
        type: game.type || 'steam',
      });
    }
  }

  // Own boards
  const userBoards = getUserBoards(req.user.id);
  for (const [boardId, board] of Object.entries(userBoards)) {
    collectFromBoard(boardId, board, req.user.id);
  }

  // Followed public boards
  for (const [userId, boards] of Object.entries(allBoards)) {
    if (userId === req.user.id) continue;
    for (const [boardId, board] of Object.entries(boards)) {
      if (!board.public || !favIds.has(boardId)) continue;
      collectFromBoard(boardId, board, userId);
    }
  }

  res.json(results);
});

// ── Global search ─────────────────────────────────────────────────────────────

app.get('/api/search', requireAuth, (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q || q.length < 2) return res.json([]);

  const results = [];
  const seenBoardIds = new Set(); // avoid duplicates if user owns a public board

  // Helper: search inside a board and push results
  function searchBoard(boardId, board, extra = {}) {
    if (seenBoardIds.has(boardId)) return;
    seenBoardIds.add(boardId);

    const boardName = board.name || '';
    const boardIcon = board.gameIcon || null;
    const boardHeaderImg = resolveBoardHeaderImg(board);

    if (boardName.toLowerCase().includes(q)) {
      results.push({ type: 'board', boardId, boardName, boardIcon, boardHeaderImg, matchedIn: 'board', ...extra });
    }

    for (const [gameId, game] of Object.entries(board.games || {})) {
      const gameName = game.name || '';
      const gameImg = game.header_img || game.icon_img || null;

      if (gameName.toLowerCase().includes(q)) {
        results.push({ type: 'game', boardId, boardName, boardIcon, gameId, gameName, gameImg, matchedIn: 'name', ...extra });
        continue;
      }

      const notes = game.notes || [];
      for (const note of notes) {
        const noteText = typeof note === 'string' ? note : (note.text || '');
        if (noteText.toLowerCase().includes(q)) {
          const idx = noteText.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 30);
          const preview = (start > 0 ? '…' : '') + noteText.slice(start, idx + q.length + 60);
          results.push({ type: 'game', boardId, boardName, boardIcon, gameId, gameName, gameImg, matchedIn: 'note', notePreview: preview, ...extra });
          break;
        }
      }
    }
  }

  // 1. User's own boards (always included)
  const userBoards = getUserBoards(req.user.id);
  for (const [boardId, board] of Object.entries(userBoards)) {
    searchBoard(boardId, board);
  }

  // 2. All public boards from all users + followed public boards
  const allBoards = readBoards();
  const me = readUsers().find(u => u.id === req.user.id);
  const favIds = new Set(me?.favorites || []);
  const userMap = new Map();
  for (const u of readUsers()) userMap.set(u.id, u.username);

  for (const [userId, boards] of Object.entries(allBoards)) {
    if (userId === req.user.id) continue; // already searched above
    for (const [boardId, board] of Object.entries(boards)) {
      if (!board.public) continue;
      const ownerUsername = userMap.get(userId) || 'unknown';
      const isFollowed = favIds.has(boardId);
      searchBoard(boardId, board, { isPublic: true, ownerUsername, isFollowed });
    }
  }

  res.json(results.slice(0, 40));
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
      steamAuth: user.steamAuth || false,
      hasSteamApiKey: !!user.steamApiKey, // jamais la clé brute — juste l'état "configurée"
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
  res.json({
    steamId: user.steamId || '', hasSteamId: !!user.steamId,
    steamAvatar: user.steamAvatar || null, steamPersonaName: user.steamPersonaName || null,
    hasSteamApiKey: !!user.steamApiKey, // jamais la clé brute, même pour son propriétaire — juste un indicateur
  });
});

const STEAM_API_KEY_RE = /^[0-9A-F]{32}$/i;

app.patch('/api/user/settings', requireAuth, async (req, res) => {
  try {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    if (req.body.steamId !== undefined) {
      const newSteamId = req.body.steamId.trim();
      users[idx].steamId = newSteamId;
      const lookupKey = users[idx].steamApiKey || GLOBAL_STEAM_API_KEY;
      if (newSteamId && lookupKey) {
        try {
          const data = await steamFetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${lookupKey}&steamids=${newSteamId}`);
          const player = data.response?.players?.[0];
          if (player) { users[idx].steamAvatar = player.avatarmedium || player.avatar || null; users[idx].steamPersonaName = player.personaname || null; }
        } catch { /* not critical */ }
      } else { users[idx].steamAvatar = null; users[idx].steamPersonaName = null; }
    }
    // ── Clé API Steam personnelle (optionnelle) ───────────────────────────────
    // Alternative au profil public : si l'utilisateur fournit SA PROPRE clé,
    // getUserSteamCreds() lui donne priorité sur la clé globale, ce qui lève les
    // restrictions de confidentialité Steam pour son propre compte uniquement.
    if (req.body.steamApiKey !== undefined) {
      const newKey = (req.body.steamApiKey || '').trim();
      if (newKey) {
        if (!STEAM_API_KEY_RE.test(newKey)) {
          return res.status(400).json({ error: 'Clé API Steam invalide (32 caractères hexadécimaux attendus).' });
        }
        // Test rapide auprès de Steam pour valider la clé avant de la sauvegarder
        try {
          const testId = users[idx].steamId || '76561197960435530'; // fallback : profil Valve, toujours public
          await steamFetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${newKey}&steamids=${testId}`);
        } catch {
          return res.status(400).json({ error: 'Clé API Steam refusée par Steam — vérifie qu\'elle est correcte et active.' });
        }
        users[idx].steamApiKey = newKey;
      } else {
        delete users[idx].steamApiKey;
      }
      // La source des données Steam change (clé perso ↔ clé globale) → caches de ce compte invalidés
      libraryCaches.delete(req.user.id);
      wishlistCache.delete(req.user.id);
      libraryNewsCaches.delete(req.user.id);
      wishlistDeadlineCache.delete(req.user.id);
    }
    writeUsers(users);
    libraryCaches.delete(req.user.id);
    res.json({
      ok: true,
      steamAvatar: users[idx].steamAvatar || null, steamPersonaName: users[idx].steamPersonaName || null,
      hasSteamApiKey: !!users[idx].steamApiKey,
    });
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
  if (!users[idx].passwordHash) return res.status(400).json({ error: 'Compte Steam-only — pas de mot de passe à changer.' });
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

// ── Admin: board management ───────────────────────────────────────────────────

app.get('/api/admin/boards', requireAdmin, (req, res) => {
  const users = readUsers();
  const allBoards = readBoards();
  const userMap = new Map(users.map(u => [u.id, u.username]));
  const result = [];
  for (const [userId, userBoards] of Object.entries(allBoards)) {
    for (const [boardId, board] of Object.entries(userBoards)) {
      const gameCount = Object.keys(board.games || {}).length;
      result.push({
        id: boardId,
        name: board.name,
        emoji: board.emoji || '🎮',
        ownerUsername: userMap.get(userId) || userId,
        ownerId: userId,
        public: board.public || false,
        gameCount,
        headerImg: resolveBoardHeaderImg(board),
        createdAt: board.createdAt || null,
      });
    }
  }
  result.sort((a, b) => (a.ownerUsername).localeCompare(b.ownerUsername));
  res.json(result);
});

app.delete('/api/admin/boards/:userId/:boardId', requireAdmin, (req, res) => {
  const { userId, boardId } = req.params;
  const all = readBoards();
  if (!all[userId] || !all[userId][boardId]) return res.status(404).json({ error: 'Board not found' });
  // Soft-delete : envoyer en corbeille plutôt que supprimer définitivement
  all[userId][boardId].deletedAt = new Date().toISOString();
  writeBoards(all);
  res.json({ ok: true });
});

// ── Corbeille notes ───────────────────────────────────────────────────────────
// Notes soft-deletées (champ deletedAt) : conservées 30 j, puis purge auto au scan.

const TRASH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours

function scanUserTrash(userId, userBoards, saveIfChanged = true) {
  const now = Date.now();
  const trash = [];
  let changed = false;
  for (const [boardId, board] of Object.entries(userBoards)) {
    const gameEntries = Object.entries(board.games || {});
    for (const [gameId, game] of gameEntries) {
      // ── Cartes soft-deletées ──
      if (game.deletedAt) {
        const age = now - new Date(game.deletedAt).getTime();
        if (age > TRASH_TTL_MS) { delete board.games[gameId]; changed = true; continue; }
        const daysLeft = Math.max(1, Math.ceil((TRASH_TTL_MS - age) / 86400000));
        trash.push({
          type: 'game', userId, boardId, boardName: board.name || boardId,
          gameId, gameName: game.name || gameId,
          gameIcon: game.header_img || game.icon_img || null,
          deletedAt: game.deletedAt, daysLeft,
        });
        continue; // carte supprimée → ne pas scanner ses notes
      }
      // ── Notes soft-deletées dans la carte ──
      if (!game.notes) continue;
      const kept = [];
      for (const note of game.notes) {
        if (!note.deletedAt) { kept.push(note); continue; }
        const age = now - new Date(note.deletedAt).getTime();
        if (age > TRASH_TTL_MS) { changed = true; continue; }
        kept.push(note);
        const daysLeft = Math.max(1, Math.ceil((TRASH_TTL_MS - age) / 86400000));
        trash.push({ type: 'note', userId, boardId, boardName: board.name || boardId, gameId, gameName: game.name || gameId, gameIcon: game.icon_img || null, ...note, daysLeft });
      }
      if (kept.length !== game.notes.length) { game.notes = kept; changed = true; }
    }
  }
  if (changed && saveIfChanged) setUserBoards(userId, userBoards);
  return trash.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
}

// POST /api/boards/:boardId/games/:appid/notes/:noteId/trash — soft-delete atomique d'une note
app.post('/api/boards/:boardId/games/:appid/notes/:noteId/trash', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  const game = (board.games || {})[req.params.appid];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const note = (game.notes || []).find(n => n.id === req.params.noteId);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  note.deletedAt = new Date().toISOString();
  setUserBoards(req.user.id, userBoards);
  console.log(`[soft-delete note] user=${req.user.id} board=${req.params.boardId} game=${req.params.appid} note=${req.params.noteId} deletedAt=${note.deletedAt}`);
  res.json({ ok: true, deletedAt: note.deletedAt });
});

// GET /api/trash/notes — corbeille de l'utilisateur connecté
app.get('/api/trash/notes', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  const result = scanUserTrash(req.user.id, userBoards);
  console.log(`[GET trash] user=${req.user.id} boards=${Object.keys(userBoards).length} trashed=${result.length}`);
  res.json(result);
});

// POST /api/trash/notes/restore — restaurer une note (retire deletedAt)
app.post('/api/trash/notes/restore', requireAuth, (req, res) => {
  const { boardId, gameId, noteId } = req.body;
  if (!boardId || !gameId || !noteId) return res.status(400).json({ error: 'Missing fields' });
  const userBoards = getUserBoards(req.user.id);
  const game = (userBoards[boardId]?.games || {})[gameId];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  let found = false;
  game.notes = (game.notes || []).map(n => {
    if (n.id === noteId && n.deletedAt) { found = true; const { deletedAt, ...rest } = n; return rest; }
    return n;
  });
  if (!found) return res.status(404).json({ error: 'Note not found in trash' });
  setUserBoards(req.user.id, userBoards);
  res.json({ ok: true });
});

// DELETE /api/trash/notes/item — suppression définitive d'une note de la corbeille
app.delete('/api/trash/notes/item', requireAuth, (req, res) => {
  const { boardId, gameId, noteId } = req.body;
  if (!boardId || !gameId || !noteId) return res.status(400).json({ error: 'Missing fields' });
  const userBoards = getUserBoards(req.user.id);
  const game = (userBoards[boardId]?.games || {})[gameId];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  const before = (game.notes || []).length;
  game.notes = (game.notes || []).filter(n => !(n.id === noteId && n.deletedAt));
  if (game.notes.length === before) return res.status(404).json({ error: 'Note not found in trash' });
  setUserBoards(req.user.id, userBoards);
  res.json({ ok: true });
});

// POST /api/trash/games/restore — restaurer une carte depuis la corbeille
app.post('/api/trash/games/restore', requireAuth, (req, res) => {
  const { boardId, gameId } = req.body;
  if (!boardId || !gameId) return res.status(400).json({ error: 'Missing fields' });
  const userBoards = getUserBoards(req.user.id);
  const game = (userBoards[boardId]?.games || {})[gameId];
  if (!game || !game.deletedAt) return res.status(404).json({ error: 'Game not found in trash' });
  delete game.deletedAt;
  delete game.archived; // restaurée → plus archivée
  setUserBoards(req.user.id, userBoards);
  res.json({ ok: true });
});

// DELETE /api/trash/games/item — suppression définitive d'une carte
app.delete('/api/trash/games/item', requireAuth, (req, res) => {
  const { boardId, gameId } = req.body;
  if (!boardId || !gameId) return res.status(400).json({ error: 'Missing fields' });
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[boardId];
  if (!board || !(board.games || {})[gameId]?.deletedAt) return res.status(404).json({ error: 'Game not found in trash' });
  delete board.games[gameId];
  setUserBoards(req.user.id, userBoards);
  res.json({ ok: true });
});

// DELETE /api/trash/notes — vider toute la corbeille (boards + cartes + notes)
app.delete('/api/trash/notes', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  for (const [boardId, board] of Object.entries(userBoards)) {
    // Boards soft-deletés → suppression définitive
    if (board.deletedAt) { delete userBoards[boardId]; continue; }
    for (const [gameId, game] of Object.entries(board.games || {})) {
      if (game.deletedAt) { delete board.games[gameId]; continue; }
      if (game.notes) game.notes = game.notes.filter(n => !n.deletedAt);
    }
  }
  setUserBoards(req.user.id, userBoards);
  res.json({ ok: true });
});

// GET /api/admin/trash — corbeille globale (toutes les notes supprimées de tous les users)
app.get('/api/admin/trash', requireAdmin, (req, res) => {
  const allBoards = readBoards();
  const users = readUsers();
  const all = [];
  for (const [userId, userBoards] of Object.entries(allBoards)) {
    const user = users.find(u => u.id === userId);
    const items = scanUserTrash(userId, userBoards, false).map(i => ({ ...i, username: user?.username || userId }));
    all.push(...items);
  }
  res.json(all.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)));
});

// POST /api/admin/trash/restore — restaurer une note (admin, n'importe quel user)
app.post('/api/admin/trash/restore', requireAdmin, (req, res) => {
  const { userId, boardId, gameId, noteId } = req.body;
  if (!userId || !boardId || !gameId || !noteId) return res.status(400).json({ error: 'Missing fields' });
  const userBoards = getUserBoards(userId);
  const game = (userBoards[boardId]?.games || {})[gameId];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  let found = false;
  game.notes = (game.notes || []).map(n => {
    if (n.id === noteId && n.deletedAt) { found = true; const { deletedAt, ...rest } = n; return rest; }
    return n;
  });
  if (!found) return res.status(404).json({ error: 'Note not found' });
  setUserBoards(userId, userBoards);
  res.json({ ok: true });
});

// DELETE /api/admin/trash/item — suppression définitive (admin)
app.delete('/api/admin/trash/item', requireAdmin, (req, res) => {
  const { userId, boardId, gameId, noteId } = req.body;
  if (!userId || !boardId || !gameId || !noteId) return res.status(400).json({ error: 'Missing fields' });
  const userBoards = getUserBoards(userId);
  const game = (userBoards[boardId]?.games || {})[gameId];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  game.notes = (game.notes || []).filter(n => !(n.id === noteId && n.deletedAt));
  setUserBoards(userId, userBoards);
  res.json({ ok: true });
});

// POST /api/admin/trash/games/restore — restaurer une carte (admin, n'importe quel user)
app.post('/api/admin/trash/games/restore', requireAdmin, (req, res) => {
  const { userId, boardId, gameId } = req.body;
  if (!userId || !boardId || !gameId) return res.status(400).json({ error: 'Missing fields' });
  const userBoards = getUserBoards(userId);
  const game = (userBoards[boardId]?.games || {})[gameId];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  delete game.deletedAt;
  delete game.archived;
  setUserBoards(userId, userBoards);
  res.json({ ok: true });
});

// DELETE /api/admin/trash/games/item — suppression définitive d'une carte (admin)
app.delete('/api/admin/trash/games/item', requireAdmin, (req, res) => {
  const { userId, boardId, gameId } = req.body;
  if (!userId || !boardId || !gameId) return res.status(400).json({ error: 'Missing fields' });
  const userBoards = getUserBoards(userId);
  const board = userBoards[boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  delete board.games[gameId];
  setUserBoards(userId, userBoards);
  res.json({ ok: true });
});

// DELETE /api/admin/trash — purger TOUTE la corbeille (tous les users)
app.delete('/api/admin/trash', requireAdmin, (req, res) => {
  const allBoards = readBoards();
  for (const userBoards of Object.values(allBoards)) {
    for (const board of Object.values(userBoards)) {
      // Supprimer les cartes en corbeille
      for (const gameId of Object.keys(board.games || {})) {
        if (board.games[gameId].deletedAt) delete board.games[gameId];
      }
      // Supprimer les notes en corbeille
      for (const game of Object.values(board.games || {})) {
        if (game.notes) game.notes = game.notes.filter(n => !n.deletedAt);
      }
    }
  }
  writeBoards(allBoards);
  res.json({ ok: true });
});

// ── Admin export / restore ────────────────────────────────────────────────────

app.get('/api/admin/export', requireAdmin, (req, res) => {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    users: readUsers(),
    boards: readBoards(),
    settings: readSettings(),
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="kangbangaming-backup-${new Date().toISOString().slice(0,10)}.json"`);
  res.send(JSON.stringify(backup, null, 2));
});

app.post('/api/admin/restore', requireAdmin, (req, res) => {
  const { users, boards, settings, version } = req.body;
  if (version !== 1) return res.status(400).json({ error: 'Format de sauvegarde non reconnu (version incompatible).' });
  if (!Array.isArray(users)) return res.status(400).json({ error: 'Champ "users" manquant ou invalide.' });
  if (typeof boards !== 'object' || Array.isArray(boards)) return res.status(400).json({ error: 'Champ "boards" manquant ou invalide.' });
  // Vérification minimale des users
  for (const u of users) {
    if (!u.id || !u.username || !u.role) return res.status(400).json({ error: `Utilisateur invalide dans la sauvegarde : ${JSON.stringify(u).slice(0, 80)}` });
  }
  // Écriture
  writeUsers(users);
  writeBoards(boards);
  if (settings && typeof settings === 'object') writeSettings({ ...DEFAULT_SETTINGS, ...settings });
  res.json({ ok: true, message: `Restauration réussie : ${users.length} utilisateurs, ${Object.keys(boards).length} owners de boards.` });
});

// ── Admin settings ────────────────────────────────────────────────────────────

app.get('/api/admin/settings', requireAdmin, (req, res) => {
  res.json(readSettings());
});

app.patch('/api/admin/settings', requireAdmin, async (req, res) => {
  const current = readSettings();
  const updated = { ...current };
  if ('requireApproval' in req.body) updated.requireApproval = Boolean(req.body.requireApproval);

  if ('discordUrl' in req.body) {
    const url = String(req.body.discordUrl || '').trim();
    updated.discordUrl = url;

    // Résolution automatique de l'icône depuis l'API publique Discord
    // Fonctionne uniquement avec un lien d'invitation (discord.gg/xxx ou discord.com/invite/xxx)
    // Les liens de channel (/channels/...) ne permettent pas de récupérer l'icône sans bot token.
    if (url) {
      try {
        const inviteMatch = url.match(/discord(?:\.gg|(?:app)?\.com\/invite)\/([a-zA-Z0-9-]+)/);
        if (inviteMatch) {
          const code = inviteMatch[1];
          const r = await fetch(`https://discord.com/api/v10/invites/${code}`);
          if (r.ok) {
            const data = await r.json();
            if (data.guild?.icon && data.guild?.id) {
              updated.discordIconUrl = `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.webp?size=128`;
            }
          }
        }
        // Si lien de channel ou autre format : icône non modifiée (conserve la valeur existante ou celle du champ discordIconUrl)
      } catch {
        // échec silencieux
      }
    } else {
      updated.discordIconUrl = '';
    }

    // Champ icône manuel : écrase l'auto-résolution si fourni explicitement
    if ('discordIconUrl' in req.body) {
      updated.discordIconUrl = String(req.body.discordIconUrl || '').trim();
    }
  }

  writeSettings(updated);
  res.json(updated);
});

// Config publique (pas d'auth — utilisée au démarrage du frontend)
app.get('/api/config', (req, res) => {
  const s = readSettings();
  res.json({ discordUrl: s.discordUrl || '', discordIconUrl: s.discordIconUrl || '' });
});

// Pré-enregistrement d'un compte Steam par l'admin
app.post('/api/admin/preregister', requireAdmin, async (req, res) => {
  const { steamId } = req.body;
  if (!steamId || !/^\d{17}$/.test(steamId.trim())) return res.status(400).json({ error: 'Steam ID invalide (17 chiffres requis).' });
  const sid = steamId.trim();
  const users = readUsers();
  if (users.find(u => u.steamId === sid)) return res.status(409).json({ error: 'Un compte avec ce Steam ID existe déjà.' });

  let steamAvatar = null, steamPersonaName = null;
  if (GLOBAL_STEAM_API_KEY) {
    try {
      const data = await steamFetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${GLOBAL_STEAM_API_KEY}&steamids=${sid}`);
      const player = data.response?.players?.[0];
      if (player) { steamAvatar = player.avatarmedium || player.avatar || null; steamPersonaName = player.personaname || null; }
    } catch { /* pas critique */ }
  }

  let base = (steamPersonaName || `steam_${sid.slice(-6)}`).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20);
  if (base.length < 3) base = `user_${sid.slice(-6)}`;
  let username = base; let n = 1;
  while (users.find(u => u.username === username)) { username = `${base}${n++}`; }

  const newUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    username, passwordHash: null, role: 'user', status: 'active',
    steamId: sid, steamAvatar, steamPersonaName, steamAuth: true,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeUsers(users);
  res.status(201).json({ success: true, message: `Compte pré-enregistré pour "${steamPersonaName || sid}".`, user: userPublicInfo(newUser) });
});

// ── Steam wishlist ────────────────────────────────────────────────────────────

const wishlistCache = new Map(); // userId → { appids: Set, fetchedAt }
const WISHLIST_TTL = 15 * 60 * 1000; // 15 min

// Extrait de l'ancien handler /api/steam/wishlist pour être réutilisable
// (ex: fusion avec les news bibliothèque). Comportement inchangé : API
// officielle Steam d'abord (fonctionne même avec profil privé, car clé API
// + steamid du propriétaire), fallback page store publique si vide.
async function getWishlistAppids(userId) {
  const creds = getUserSteamCreds(userId);
  if (!creds.steamId || !creds.apiKey) return new Set();
  const now = Date.now();
  const cached = wishlistCache.get(userId);
  if (cached && now - cached.fetchedAt < WISHLIST_TTL) return cached.appids;
  try {
    const url = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?key=${creds.apiKey}&steamid=${creds.steamId}`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await resp.json();
    const items = data?.response?.items || [];
    let appids = items.map(i => Number(i.appid));
    if (appids.length === 0) {
      // Fallback : page store publique
      try {
        const r2 = await fetch(`https://store.steampowered.com/wishlist/profiles/${creds.steamId}/wishlistdata/?p=0`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const d2 = await r2.json();
        appids = Object.keys(d2 || {}).map(Number).filter(Boolean);
      } catch {}
    }
    const set = new Set(appids);
    wishlistCache.set(userId, { appids: set, fetchedAt: now });
    return set;
  } catch {
    return cached?.appids || new Set();
  }
}

app.get('/api/steam/wishlist', requireAuth, async (req, res) => {
  const appids = await getWishlistAppids(req.user.id);
  res.json([...appids]);
});


// ── Steam wishlist deadline items ───────────────────────────────────────────
// Stratégie 1 : wishlistdata (profil public) → données complètes en un appel
// Stratégie 2 : API officielle (marche profil privé) + appdetails par batch
const wishlistDeadlineCache = new Map(); // userId → { items, fetchedAt }
const WISHLIST_DEADLINE_TTL = 5 * 60 * 1000; // 5 min
const appReleaseDateCache   = new Map(); // appid → { date, fetchedAt }
const APP_DATE_TTL = 24 * 60 * 60 * 1000; // 24h

const STEAM_MONTHS = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };

function parseSteamDate(ts, str) {
  // ts = unix seconds (peut être 0), str = chaîne lisible Steam
  // IMPORTANT : on n'utilise JAMAIS `new Date(str).toISOString()` pour une chaîne
  // texte type "25 Jun, 2026" — ce format n'est pas ISO donc le moteur JS le
  // parse en heure LOCALE du serveur, puis toISOString() le reconvertit en UTC :
  // sur un serveur dont le fuseau est en avance sur UTC (ex: Europe), minuit
  // local devient la veille en UTC → la date de sortie tombait un jour trop
  // tôt et le jeu apparaissait "en retard" dans les échéances avant même sa
  // sortie réelle, sans jamais passer par "Aujourd'hui" ni "Sous 7 jours".
  // On calcule donc tout en UTC / par extraction manuelle des nombres, sans
  // jamais laisser le fuseau horaire local influencer le jour calendaire.
  if (ts && ts > 0) {
    const d = new Date(ts * 1000);
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
    const da = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }
  if (!str) return null;
  const s = str.trim();
  if (/coming soon|tbd|tba|q[1-4]|\d{4}$/i.test(s) && !/\d{1,2}\s+\w/.test(s)) return null;
  // "25 Jun, 2026" / "25 Jun 2026"
  let m = s.match(/^(\d{1,2})\s+([A-Za-zéûÉÛ]+)\.?,?\s+(\d{4})/);
  let day, monStr, year;
  if (m) { day = m[1]; monStr = m[2]; year = m[3]; }
  if (!m) {
    // "Jun 25, 2026" / "Jun 25 2026"
    m = s.match(/^([A-Za-zéûÉÛ]+)\.?\s+(\d{1,2}),?\s+(\d{4})/);
    if (m) { monStr = m[1]; day = m[2]; year = m[3]; }
  }
  if (m) {
    const mon = STEAM_MONTHS[monStr.slice(0, 3).toLowerCase()];
    if (mon) return `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  return null;
}

// Fetch release date + nom + header_image pour UN appid
async function fetchOneAppDate(appid) {
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&filters=release_date,basic&l=english`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
    if (!resp.ok) return null;
    const data = await resp.json();
    const info = data?.[String(appid)];
    if (!info?.success) return null;
    return {
      date:       parseSteamDate(0, info?.data?.release_date?.date),
      name:       info?.data?.name || null,
      header_img: info?.data?.header_image || null,
    };
  } catch { return null; }
}

app.get('/api/steam/wishlist/deadline', requireAuth, async (req, res) => {
  const creds = getUserSteamCreds(req.user.id);
  if (!creds.steamId) return res.json([]);
  const now = Date.now();
  const cached = wishlistDeadlineCache.get(req.user.id);
  if (cached && now - cached.fetchedAt < WISHLIST_DEADLINE_TTL) return res.json(cached.items);

  let items = [];

  // ── Stratégie 1 : wishlistdata (profil + wishlist publics) ──────────────
  try {
    const url = `https://store.steampowered.com/wishlist/profiles/${creds.steamId}/wishlistdata/?p=0`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept':          'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer':         'https://store.steampowered.com/',
      },
    });
    if (resp.ok) {
      const data = await resp.json().catch(() => null);
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        console.log(`[wishlist/deadline] wishlistdata OK – ${Object.keys(data).length} jeux pour user ${req.user.id}`);
        items = Object.entries(data).map(([appid, info]) => ({
          appid:        Number(appid),
          name:         info.name || `App ${appid}`,
          header_img:   `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
          release_date: parseSteamDate(info.release_date, info.release_string),
        })).filter(i => i.release_date !== null);
      } else {
        console.log(`[wishlist/deadline] wishlistdata vide/privé pour user ${req.user.id} – fallback API officielle`);
      }
    } else {
      console.log(`[wishlist/deadline] wishlistdata HTTP ${resp.status} – fallback API officielle`);
    }
  } catch (e) {
    console.log(`[wishlist/deadline] wishlistdata error: ${e.message} – fallback API officielle`);
  }

  // ── Stratégie 2 : API officielle + appdetails (fonctionne profil privé) ──
  if (items.length === 0 && creds.apiKey) {
    try {
      const wUrl = `https://api.steampowered.com/IWishlistService/GetWishlist/v1/?key=${creds.apiKey}&steamid=${creds.steamId}`;
      const wResp = await fetch(wUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (wResp.ok) {
        const wData = await wResp.json();
        const appids = (wData?.response?.items || []).map(i => Number(i.appid)).filter(Boolean);
        console.log(`[wishlist/deadline] API officielle – ${appids.length} appids pour user ${req.user.id}`);

        if (appids.length > 0) {
          // Résoudre les dates depuis le cache ou appdetails (3 appids en parallèle)
          const uncached = appids.filter(id => {
            const c = appReleaseDateCache.get(id);
            return !c || (now - c.fetchedAt) > APP_DATE_TTL;
          });
          console.log(`[wishlist/deadline] ${appids.length} appids, ${uncached.length} sans cache – fetch appdetails`);

          for (let i = 0; i < uncached.length; i += 3) {
            const batch = uncached.slice(i, i + 3);
            await Promise.all(batch.map(async appid => {
              const info = await fetchOneAppDate(appid);
              appReleaseDateCache.set(appid, {
                date:       info?.date || null,
                name:       info?.name || null,
                header_img: info?.header_img || null,
                fetchedAt:  now,
              });
            }));
            if (i + 3 < uncached.length) await new Promise(r => setTimeout(r, 300));
          }

          items = appids.map(appid => {
            const c = appReleaseDateCache.get(appid);
            return {
              appid,
              name:         c?.name || `App ${appid}`,
              header_img:   c?.header_img || `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
              release_date: c?.date || null,
            };
          }).filter(i => i.release_date !== null);
          console.log(`[wishlist/deadline] fallback → ${items.length} items avec date de sortie`);
        }
      }
    } catch (e) {
      console.log(`[wishlist/deadline] fallback API error: ${e.message}`);
    }
  }

  wishlistDeadlineCache.set(req.user.id, { items, fetchedAt: now });
  res.json(items);
});

// ── Steam featured (homepage populaires/recommandés) ─────────────────────────

let featuredCache = { data: null, fetchedAt: 0 };
const FEATURED_TTL = 60 * 60 * 1000; // 1h

app.get('/api/steam/featured', requireAuth, async (req, res) => {
  const now = Date.now();
  if (featuredCache.data && now - featuredCache.fetchedAt < FEATURED_TTL) {
    return res.json(featuredCache.data);
  }
  try {
    const hdrs = { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'fr-FR,fr;q=0.9' };
    const resp = await fetch('https://store.steampowered.com/api/featured/?cc=FR&l=french', { headers: hdrs });
    const data = await resp.json();
    const items = (data.featured_win || []).slice(0, 6);

    const results = await Promise.allSettled(items.map(async item => {
      try {
        const [detailsRes, reviewsRes] = await Promise.allSettled([
          fetch(`https://store.steampowered.com/api/appdetails?appids=${item.id}&filters=basic,genres,developers,categories&cc=FR&l=english`, { headers: hdrs }),
          fetch(`https://store.steampowered.com/appreviews/${item.id}?json=1&language=all&purchase_type=all&num_per_page=0`, { headers: hdrs }),
        ]);
        const info = detailsRes.status === 'fulfilled' ? (await detailsRes.value.json())?.[item.id]?.data : null;
        const reviewData = reviewsRes.status === 'fulfilled' ? (await reviewsRes.value.json())?.query_summary : null;
        return {
          appid: item.id,
          name: info?.name || item.name,
          headerImage: info?.header_image || item.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`,
          shortDescription: info?.short_description || '',
          genres: (info?.genres || []).map(g => g.description).slice(0, 3),
          categories: (info?.categories || []).map(c => c.description),
          developers: info?.developers || [],
          reviewScore: reviewData?.review_score ?? null,
          reviewScoreDesc: reviewData?.review_score_desc || '',
          reviewTotal: reviewData?.total_reviews ?? 0,
        };
      } catch { return null; }
    }));

    const games = results.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean);
    featuredCache = { data: games, fetchedAt: now };
    res.json(games);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Steam upcoming releases ───────────────────────────────────────────────────

let upcomingCache = { data: null, fetchedAt: 0 };
const UPCOMING_TTL = 2 * 60 * 60 * 1000; // 2h

function parseReleaseDate(str) {
  if (!str) return null;
  const lower = str.toLowerCase();
  // Exclure uniquement les dates vraiment indéfinies
  if (lower === 'coming soon' || lower === 'to be announced' || lower.includes('tba') || lower.includes('tbd')) return null;
  if (/^q[1-4]\s+\d{4}$/i.test(lower.trim())) return null; // "Q3 2026" etc.
  // Formats: "28 Jun, 2026" / "Jun 28, 2026" / "28 June 2026"
  const cleaned = str.replace(',', '').replace(/(\d+)\s+(\w+)\s+(\d{4})/, '$2 $1 $3');
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

// Parse les résultats depuis le HTML de Steam search
// Découpe par section <a ...> et extrait appid + titre + date de sortie
function parseSteamSearchHtml(html) {
  const results = [];
  // Découpe par balise ouvrante <a pour isoler chaque ligne de résultat
  const sections = html.split(/(?=<a\s)/);
  for (const section of sections) {
    const appidMatch = section.match(/\/app\/(\d+)\//);
    if (!appidMatch) continue;
    const id = parseInt(appidMatch[1]);
    const titleMatch = section.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/span>/);
    const dateMatch = section.match(/search_released[^>]*>([\s\S]*?)<\/div>/);
    const imgMatch = section.match(/<img[^>]+src="([^"]+capsule[^"]+)"/);
    const name = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const dateStr = dateMatch ? dateMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    if (id && name) results.push({ id, name, dateStr, capsuleImage: imgMatch?.[1] || null, finalPrice: null });
  }
  return results;
}

// Parse les appids depuis le HTML des pages Steam Charts
function parseChartsHtml(html) {
  // Extraire tous les /app/XXXXX/ uniques (nav links, capsules, etc.)
  const allIds = [...html.matchAll(/\/app\/(\d+)\//g)].map(m => parseInt(m[1]));
  // Dédupliquer tout en gardant l'ordre d'apparition
  const seen = new Set();
  const ids = [];
  for (const id of allIds) {
    if (!seen.has(id)) { seen.add(id); ids.push(id); }
  }
  // Les premiers IDs dans la page sont souvent des liens de nav → prendre les suivants
  // Les IDs de jeux réels apparaissent généralement plusieurs fois (image + lien + data)
  // On refiltre pour garder ceux qui apparaissent au moins 2 fois
  const counts = {};
  for (const id of allIds) counts[id] = (counts[id] || 0) + 1;
  return ids.filter(id => counts[id] >= 2).map(id => ({ id, name: '', dateStr: '', capsuleImage: null, finalPrice: null }));
}

// Récupère et déduplique les items depuis plusieurs endpoints Steam
async function fetchSteamUpcomingItems() {
  const seen = new Set();
  const items = [];
  const hdrs = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Accept-Language': 'en-US,en;q=0.5',
  };

  // Source 1 : featured coming_soon (jeux mis en avant, avec images/dates incluses)
  try {
    const r = await fetch('https://store.steampowered.com/api/featuredcategories?cc=FR&l=english', { headers: hdrs });
    const d = await r.json();
    const before = items.length;
    for (const it of (d.coming_soon?.items || [])) {
      if (!seen.has(it.id)) { seen.add(it.id); items.push({ id: it.id, name: it.name, dateStr: it.release_string || '', capsuleImage: it.large_capsule_image || it.small_capsule_image || null, finalPrice: it.final_price }); }
    }
    console.log(`[upcoming src1] featured: +${items.length - before} items`);
  } catch (e) { console.error('[upcoming src1]', e.message); }

  // Source 2 : Steam Charts "Most Anticipated" (top jeux les plus wishlistés à venir)
  try {
    const r = await fetch('https://store.steampowered.com/charts/mostanticipated/', { headers: hdrs });
    const html = await r.text();
    const parsed = parseChartsHtml(html);
    const before = items.length;
    for (const it of parsed) {
      if (!seen.has(it.id)) { seen.add(it.id); items.push(it); }
    }
    console.log(`[upcoming src2] mostAnticipated: parsed=${parsed.length} +${items.length - before} new`);
  } catch (e) { console.error('[upcoming src2]', e.message); }

  // Source 3 : Steam Charts "Top Upcoming" (top ventes à venir)
  try {
    const r = await fetch('https://store.steampowered.com/charts/topupcoming/', { headers: hdrs });
    const html = await r.text();
    const parsed = parseChartsHtml(html);
    const before = items.length;
    for (const it of parsed) {
      if (!seen.has(it.id)) { seen.add(it.id); items.push(it); }
    }
    console.log(`[upcoming src3] topUpcoming: parsed=${parsed.length} +${items.length - before} new`);
  } catch (e) { console.error('[upcoming src3]', e.message); }

  return items;
}

// Debug : voir le HTML brut retourné par Steam search (admin only)

app.get('/api/steam/upcoming', requireAuth, async (req, res) => {
  const now = Date.now();
  const force = req.query.force === '1';
  if (!force && upcomingCache.data && now - upcomingCache.fetchedAt < UPCOMING_TTL) {
    return res.json(upcomingCache.data);
  }
  if (force) upcomingCache = { data: null, fetchedAt: 0 };
  try {
    const items = await fetchSteamUpcomingItems();

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000);

    // Limiter à 60 appids pour ne pas surcharger l'API Steam
    const results = await Promise.allSettled(
      items.slice(0, 60).map(async item => {
        try {
          const hdrs = { 'User-Agent': 'Mozilla/5.0' };
          const [detailsRes, reviewsRes] = await Promise.allSettled([
            fetch(`https://store.steampowered.com/api/appdetails?appids=${item.id}&filters=release_date,basic,genres,developers,categories&cc=FR&l=english`, { headers: hdrs }),
            fetch(`https://store.steampowered.com/appreviews/${item.id}?json=1&language=all&purchase_type=all&num_per_page=0`, { headers: hdrs }),
          ]);
          const info = detailsRes.status === 'fulfilled' ? (await detailsRes.value.json())?.[item.id]?.data : null;
          const reviewData = reviewsRes.status === 'fulfilled' ? (await reviewsRes.value.json())?.query_summary : null;
          const rawDate = info?.release_date?.date || '';
          const releaseDate = parseReleaseDate(rawDate);
          return {
            appid: item.id,
            name: info?.name || item.name,
            type: info?.type || 'game',
            releaseDate: releaseDate ? releaseDate.toISOString() : null,
            releaseDateStr: rawDate,
            comingSoon: info?.release_date?.coming_soon ?? true,
            headerImage: info?.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${item.id}/header.jpg`,
            capsuleImage: item.capsuleImage || null,
            shortDescription: info?.short_description || '',
            developers: info?.developers || [],
            genres: (info?.genres || []).map(g => g.description).slice(0, 3),
            categories: (info?.categories || []).map(c => c.description),
            reviewScore: reviewData?.review_score ?? null,
            reviewScoreDesc: reviewData?.review_score_desc || '',
            reviewTotal: reviewData?.total_reviews ?? 0,
          };
        } catch { return null; }
      })
    );

    const games = results
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter(g => g && g.releaseDate)
      .filter(g => {
        const d = new Date(g.releaseDate);
        return d >= today && d <= maxDate;
      })
      .sort((a, b) => new Date(a.releaseDate) - new Date(b.releaseDate));

    upcomingCache = { data: games, fetchedAt: now };
    res.json(games);
  } catch (e) {
    console.error('[upcoming]', e.message);
    if (upcomingCache.data) return res.json(upcomingCache.data);
    res.status(500).json({ error: 'Failed to fetch upcoming games' });
  }
});

// ── Steam game info (players + reviews) ──────────────────────────────────────

const gameInfoCache = new Map(); // appid -> { data, fetchedAt }
const GAME_INFO_TTL = 5 * 60 * 1000; // 5 min

app.get('/api/steam/gameinfo/:appid', requireAuth, async (req, res) => {
  const { appid } = req.params;
  if (!appid || !/^\d+$/.test(appid)) return res.status(400).json({ error: 'Invalid appid' });

  const cached = gameInfoCache.get(appid);
  if (cached && Date.now() - cached.fetchedAt < GAME_INFO_TTL) return res.json(cached.data);

  try {
    const [playersRes, reviewsRes, detailsRes] = await Promise.allSettled([
      GLOBAL_STEAM_API_KEY
        ? fetch(`https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appid}&key=${GLOBAL_STEAM_API_KEY}`).then(r => r.json())
        : Promise.reject('no key'),
      fetch(`https://store.steampowered.com/appreviews/${appid}?json=1&language=all&num_per_page=0`).then(r => r.json()),
      fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&filters=price_overview,metacritic,categories,genres,developers,release_date&cc=FR&l=french`).then(r => r.json()),
    ]);

    const playerCount = playersRes.status === 'fulfilled'
      ? (playersRes.value?.response?.player_count ?? null)
      : null;

    const reviewSummary = reviewsRes.status === 'fulfilled'
      ? reviewsRes.value?.query_summary ?? null
      : null;

    const appDetails = detailsRes.status === 'fulfilled'
      ? detailsRes.value?.[appid]?.data ?? null
      : null;

    const positivePercent = (reviewSummary?.total_reviews > 0)
      ? Math.round((reviewSummary.total_positive / reviewSummary.total_reviews) * 100)
      : null;

    // Genres — max 3, Early Access (ID "70") exclu car traité séparément
    const allGenres = appDetails?.genres || [];
    const earlyAccessFromGenres = allGenres.some(g => String(g.id) === '70');
    const genres = allGenres.filter(g => String(g.id) !== '70').slice(0, 3).map(g => g.description);

    // Developer
    const developer = appDetails?.developers?.[0] ?? null;

    // Release date
    const releaseRaw = appDetails?.release_date ?? null;
    const releaseDateStr = releaseRaw?.date || null;
    const comingSoon = !!releaseRaw?.coming_soon;

    // Multiplayer label from categories
    const catIds = new Set((appDetails?.categories || []).map(c => Number(c.id)));
    let multiplayerLabel = null;
    if (catIds.has(2) && !catIds.has(1) && !catIds.has(9) && !catIds.has(38)) {
      multiplayerLabel = 'Solo';
    } else if (catIds.has(9) || catIds.has(38)) {
      multiplayerLabel = 'Co-op';
    } else if (catIds.has(1)) {
      multiplayerLabel = 'Multijoueur';
    }
    // Refine with local co-op categories
    if (catIds.has(24) || catIds.has(37)) multiplayerLabel = (multiplayerLabel ? multiplayerLabel + ' / ' : '') + 'Local co-op';

    // Early Access : genre ID "70" (pas une catégorie)
    const earlyAccess = earlyAccessFromGenres;

    const data = {
      appid,
      playerCount,
      reviewScore: reviewSummary?.review_score ?? null,
      reviewScoreDesc: reviewSummary?.review_score_desc ?? null,
      totalReviews: reviewSummary?.total_reviews ?? null,
      totalPositive: reviewSummary?.total_positive ?? null,
      positivePercent,
      price: appDetails?.price_overview?.final_formatted ?? null,
      priceInitial: appDetails?.price_overview?.initial_formatted ?? null,
      discount: appDetails?.price_overview?.discount_percent ?? 0,
      metacritic: appDetails?.metacritic?.score ?? null,
      metacriticUrl: appDetails?.metacritic?.url ?? null,
      genres,
      developer,
      releaseDate: releaseDateStr,
      comingSoon,
      multiplayerLabel,
      earlyAccess,
    };

    gameInfoCache.set(appid, { data, fetchedAt: Date.now() });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
      name: g.name || '',
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

app.get('/api/steam/profile', requireAuth, async (req, res) => {
  const creds = getUserSteamCreds(req.user.id);
  if (!creds.apiKey || !creds.steamId) return res.status(400).json({ error: 'No Steam credentials' });
  try {
    // Use getLibraryMap (TTL-cached) instead of a raw steamFetch to avoid redundant API calls
    const [summaryData, levelData, lib] = await Promise.all([
      steamFetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${creds.apiKey}&steamids=${creds.steamId}`),
      steamFetch(`https://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=${creds.apiKey}&steamid=${creds.steamId}`).catch(() => null),
      getLibraryMap(req.user.id),
    ]);
    const player = summaryData.response?.players?.[0];
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const level = levelData?.response?.player_level ?? null;
    const gameCount = lib.size || null; // Map size = number of owned games
    const statusMap = { 0: 'Hors ligne', 1: 'En ligne', 2: 'Occupé', 3: 'Absent', 4: 'Parti', 5: 'Cherche à jouer', 6: 'Cherche à échanger' };
    res.json({
      steamId: creds.steamId,
      personaName: player.personaname || null,
      avatar: player.avatarfull || player.avatarmedium || player.avatar || null,
      profileUrl: player.profileurl || null,
      personaState: player.personastate ?? 0,
      statusLabel: statusMap[player.personastate ?? 0] || 'Hors ligne',
      countryCode: player.loccountrycode || null,
      level,
      gameCount,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Steam News ────────────────────────────────────────────────────────────────
const NEWS_TTL = 30 * 60 * 1000; // 30 min
const newsCaches = new Map(); // appid → { data, cacheAt }

const STEAM_CLAN_IMG = 'https://clan.akamai.steamstatic.com/images/';

// Strip BBCode and basic HTML tags from Steam news content
function stripMarkup(str = '') {
  return str
    .replace(/\[img[^\]]*\][^\[]*\[\/img\]/gi, '')     // remove images (all formats)
    .replace(/\[previewyoutube[^\]]*\]\[\/previewyoutube\]/gi, '') // remove yt embeds
    .replace(/\[url=[^\]]*\](.*?)\[\/url\]/gi, '$1')  // url → text
    .replace(/\[[^\]]+\]/g, '')                        // remaining BBCode tags
    .replace(/<[^>]+>/g, '')                           // HTML tags
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\r?\n{3,}/g, '\n\n')                    // collapse excessive blank lines
    .trim();
}

// Tronque un texte déjà nettoyé (stripMarkup) à la dernière limite de mot avant
// `max` caractères, pour éviter de couper un mot en plein milieu dans les
// aperçus de news (cartes bibliothèque).
function truncateText(str, max) {
  if (!str) return '';
  const flat = str.replace(/\s*\n\s*/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

function extractImage(raw = '') {
  // [img src="{STEAM_CLAN_IMAGE}/path.jpg"][/img]  ← format réel Steam
  const bbSrcMatch = raw.match(/\[img\s+src="((?:\{STEAM_CLAN_IMAGE\}|https?:\/\/)[^"]+)"\]/i);
  if (bbSrcMatch) return bbSrcMatch[1].replace(/\{STEAM_CLAN_IMAGE\}/g, STEAM_CLAN_IMG);
  // [img]{STEAM_CLAN_IMAGE}/path[/img]  ← ancien format
  const bbMatch = raw.match(/\[img\]\s*((?:\{STEAM_CLAN_IMAGE\}|https?:\/\/)[^\s\[\]]*)\s*\[\/img\]/i);
  if (bbMatch) return bbMatch[1].replace(/\{STEAM_CLAN_IMAGE\}/g, STEAM_CLAN_IMG);
  // HTML <img src="...">
  const htmlMatch = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlMatch) return htmlMatch[1];
  // URL directe avec extension image
  const urlMatch = raw.match(/https?:\/\/[^\s\[\]"'<>]+\.(?:jpe?g|png|gif|webp)(?:[?#][^\s\[\]"'<>]*)?/i);
  if (urlMatch) return urlMatch[0];
  return null;
}

function extractYoutubeId(raw = '') {
  // [previewyoutube=ID;full][/previewyoutube] — ID can be any length
  const bbMatch = raw.match(/\[previewyoutube=([A-Za-z0-9_-]+)[;\]]/i);
  if (bbMatch) return bbMatch[1];
  // Standard YouTube URLs
  const urlMatch = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/i);
  if (urlMatch) return urlMatch[1];
  return null;
}

// Debug: raw news content (admin only)
app.get('/api/steam/news/:appid/raw', requireAdmin, async (req, res) => {
  try {
    const data = await steamFetch(
      `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${req.params.appid}&count=3&maxlength=0&format=json`
    );
    const items = (data.appnews?.newsitems || []).slice(0, 3).map(n => ({
      title: n.title,
      raw_snippet: n.contents?.slice(0, 2000),
      image: extractImage(n.contents),
      youtube: extractYoutubeId(n.contents),
    }));
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/steam/news/:appid', requireAuth, async (req, res) => {
  const { appid } = req.params;
  const entry = newsCaches.get(appid);
  if (entry && Date.now() - entry.cacheAt < NEWS_TTL) return res.json(entry.data);
  try {
    const data = await steamFetch(
      `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appid}&count=15&maxlength=0&format=json`
    );
    const items = (data.appnews?.newsitems || []).map(n => ({
      gid: n.gid,
      title: n.title,
      url: n.url,
      author: n.author || null,
      contents: stripMarkup(n.contents),
      image: extractImage(n.contents),
      youtube: extractYoutubeId(n.contents),
      feedlabel: n.feedlabel || null,
      date: n.date,
      tags: n.tags || [],
    }));
    const result = { appid: Number(appid), items };
    newsCaches.set(appid, { data: result, cacheAt: Date.now() });
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Steam News — bibliothèque (agrégé, par utilisateur) ──────────────────────
// Récupère les actualités des jeux possédés par l'utilisateur, triées du plus
// récent au plus ancien. Mise en cache par user (30 min) pour éviter de
// re-déclencher des dizaines/centaines d'appels Steam à chaque scroll — la
// pagination (offset/limit) se fait sur la liste déjà calculée, sans
// régénérer ce qui n'est pas affiché.
const LIBRARY_NEWS_TTL = 30 * 60 * 1000; // 30 min
const libraryNewsCaches = new Map(); // userId → { data, cacheAt }
const LIBRARY_NEWS_MAX_GAMES    = 200; // cap perf : jeux les + joués en priorité
const LIBRARY_NEWS_MAX_WISHLIST = 80;  // cap perf : jeux wishlist (ordre = priorité Steam)
const LIBRARY_NEWS_CHUNK        = 8;   // requêtes Steam en parallèle par lot
const LIBRARY_NEWS_MAX_ITEMS    = 300; // cap mémoire de la liste agrégée

// Cache des infos (genres + nom) par appid — partagé entre TOUS les
// utilisateurs (ça ne dépend pas de qui regarde), contrairement aux autres
// caches de cette section qui sont par userId. Évite de re-demander l'API
// Store à chaque fois qu'un même jeu apparaît pour un autre utilisateur.
// Le nom n'est utile que pour les jeux wishlist (pas de libEntry.name).
const appGenreCache = new Map(); // appid → { genres, name, fetchedAt }
const APP_GENRE_TTL = 24 * 60 * 60 * 1000; // 24h (un genre/nom ne change quasi jamais)

async function getAppInfoForAppids(appids) {
  const now = Date.now();
  const out = new Map();
  const uncached = [];
  for (const id of appids) {
    const c = appGenreCache.get(id);
    if (c && now - c.fetchedAt < APP_GENRE_TTL) out.set(id, c);
    else uncached.push(id);
  }
  for (let i = 0; i < uncached.length; i += LIBRARY_NEWS_CHUNK) {
    const chunk = uncached.slice(i, i + LIBRARY_NEWS_CHUNK);
    const settled = await Promise.allSettled(chunk.map(async id => {
      const r = await fetch(`https://store.steampowered.com/api/appdetails?appids=${id}&filters=basic,genres&cc=FR&l=english`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const data = await r.json();
      const info = data?.[id]?.data;
      const genres = (info?.genres || []).map(g => g.description).slice(0, 3);
      return { id, genres, name: info?.name || null };
    }));
    for (const s of settled) {
      if (s.status === 'fulfilled') {
        const entry = { genres: s.value.genres, name: s.value.name, fetchedAt: now };
        appGenreCache.set(s.value.id, entry);
        out.set(s.value.id, entry);
      }
    }
  }
  return out;
}

async function fetchLibraryNewsBatch(appids) {
  const out = [];
  for (let i = 0; i < appids.length; i += LIBRARY_NEWS_CHUNK) {
    const chunk = appids.slice(i, i + LIBRARY_NEWS_CHUNK);
    const settled = await Promise.allSettled(chunk.map(id =>
      steamFetch(`https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${id}&count=5&maxlength=0&format=json`)
        .then(data => ({ id, data }))
    ));
    for (const s of settled) if (s.status === 'fulfilled') out.push(s.value);
  }
  return out;
}

async function getLibraryNews(userId, force = false) {
  const entry = libraryNewsCaches.get(userId);
  if (!force && entry && Date.now() - entry.cacheAt < LIBRARY_NEWS_TTL) return entry.data;

  const lib = await getLibraryMap(userId);
  // Jeux wishlist pas encore en bibliothèque : leurs news sont intégrées au
  // même flux, au même niveau de priorité (demande utilisateur), via le même
  // fetcher/news-API et le même enrichissement genre. Seule distinction
  // visuelle : le tag Bibliothèque/Wishlist (champ inLibrary ci-dessous).
  const wishlistIds = await getWishlistAppids(userId).catch(() => new Set());
  const wishlistOnlyIds = [...wishlistIds].filter(id => !lib.has(id));

  if (lib.size === 0 && wishlistOnlyIds.length === 0) {
    const data = [];
    libraryNewsCaches.set(userId, { data, cacheAt: Date.now() });
    return data;
  }

  // Priorité aux jeux les plus joués si la bibliothèque est grosse, puis la
  // wishlist (ordre déjà priorisé par l'API Steam, on cap juste le volume).
  const libAppids = [...lib.entries()]
    .sort((a, b) => (b[1].playtime_forever || 0) - (a[1].playtime_forever || 0))
    .slice(0, LIBRARY_NEWS_MAX_GAMES)
    .map(([id]) => id);
  const wishlistAppids = wishlistOnlyIds.slice(0, LIBRARY_NEWS_MAX_WISHLIST);
  const appids = [...libAppids, ...wishlistAppids];

  const batches = await fetchLibraryNewsBatch(appids);
  const items = [];
  for (const { id, data } of batches) {
    const libEntry = lib.get(id);
    for (const n of (data.appnews?.newsitems || [])) {
      items.push({
        appid: id,
        gameName: libEntry?.name || '', // complété ci-dessous pour les jeux wishlist (pas de libEntry)
        inLibrary: !!libEntry, // false = jeu wishlist pas encore possédé → tag "Wishlist" côté frontend
        headerImage: `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`,
        gid: n.gid,
        title: n.title,
        summary: truncateText(stripMarkup(n.contents || ''), 200),
        url: n.url,
        feedlabel: n.feedlabel || null,
        date: n.date,
      });
    }
  }

  // Couleur de carte par genre (comme "Sorties à venir") + nom pour les jeux
  // wishlist sans libEntry — un seul appel par appid distinct, résultat mis
  // en cache 24h donc quasi gratuit ensuite.
  const distinctIds = [...new Set(items.map(it => it.appid))];
  try {
    const infoMap = await getAppInfoForAppids(distinctIds);
    for (const it of items) {
      const info = infoMap.get(it.appid);
      it.genres = info?.genres || [];
      if (!it.gameName) it.gameName = info?.name || '';
    }
  } catch {
    for (const it of items) it.genres = it.genres || [];
  }

  items.sort((a, b) => b.date - a.date);
  const data = items.slice(0, LIBRARY_NEWS_MAX_ITEMS);
  libraryNewsCaches.set(userId, { data, cacheAt: Date.now() });
  return data;
}

app.get('/api/steam/library/news', requireAuth, async (req, res) => {
  const creds = getUserSteamCreds(req.user.id);
  if (!creds.apiKey || !creds.steamId) return res.status(400).json({ error: 'No Steam credentials configured' });
  const offset = Math.max(0, parseInt(req.query.offset) || 0);
  const limit  = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  try {
    const all = await getLibraryNews(req.user.id, req.query.force === '1');
    const items = all.slice(offset, offset + limit);
    res.json({ items, total: all.length, hasMore: offset + limit < all.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Public boards ─────────────────────────────────────────────────────────────

app.get('/api/public/boards', requireAuth, (req, res) => {
  const all = readBoards();
  const users = readUsers();
  const userMap = new Map(users.map(u => [u.id, u.username]));
  // Compute current user's favourite IDs once, outside the loop
  const me = users.find(u => u.id === req.user.id);
  const favIds = new Set(me?.favorites || []);
  const result = [];
  for (const [userId, userBoards] of Object.entries(all)) {
    for (const [boardId, board] of Object.entries(userBoards || {})) {
      if (!board.public) continue;
      const headerImg = resolveBoardHeaderImg(board);
      result.push({
        id: boardId, name: board.name, emoji: board.emoji || '',
        gameIcon: board.gameIcon || null, headerImg,
        columns: board.columns || [], games: Object.values(board.games || {}),
        gameCount: Object.keys(board.games || {}).length,
        ownerUsername: userMap.get(userId) || 'unknown', ownerId: userId,
        isOwner: userId === req.user.id, isFavorite: favIds.has(boardId),
      });
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
        result.push({ id: boardId, name: board.name, emoji: board.emoji || '', gameIcon: board.gameIcon || null, headerImg: resolveBoardHeaderImg(board), ownerUsername: userMap.get(userId) || 'unknown', ownerId: userId, isFavorite: true });
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

// ── Personal board favorites ───────────────────────────────────────────────────

app.get('/api/user/personal-favorites', requireAuth, (req, res) => {
  const users = readUsers();
  const me = users.find(u => u.id === req.user.id);
  res.json(me?.personalFavorites || []);
});

app.post('/api/user/personal-favorites/:boardId', requireAuth, (req, res) => {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  if (!users[idx].personalFavorites) users[idx].personalFavorites = [];
  if (!users[idx].personalFavorites.includes(req.params.boardId)) users[idx].personalFavorites.push(req.params.boardId);
  writeUsers(users);
  res.json({ ok: true });
});

app.delete('/api/user/personal-favorites/:boardId', requireAuth, (req, res) => {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  users[idx].personalFavorites = (users[idx].personalFavorites || []).filter(id => id !== req.params.boardId);
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
  res.json(Object.values(f.board.games || {}).filter(g => !g.deletedAt));
});

app.post('/api/public/boards/:boardId/games', requireAuth, (req, res) => {
  const f = findPublicBoard(req.params.boardId);
  if (!f) return res.status(404).json({ error: 'Not found' });
  const { appid, name, header_img, icon_img, column, type, emoji, color, taskType, dueDate, startDate, endDate, dueTime, startTime, endTime, urgent, assignees, notes, progress } = req.body;
  if (!appid || !column) return res.status(400).json({ error: 'Missing fields' });
  if (!f.board.games) f.board.games = {};
  f.board.games[appid] = { appid, name, header_img: header_img || null, icon_img: icon_img || null, column, type: type || 'steam', emoji: emoji || null, color: color || null, taskType: taskType || null, dueDate: dueDate || null, startDate: startDate || null, endDate: endDate || null, dueTime: dueTime || null, startTime: startTime || null, endTime: endTime || null, urgent: urgent || false, assignees: assignees || [], notes: notes || [], progress: progress ?? null, archived: false, sortOrder: Date.now(), addedAt: new Date().toISOString() };
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
  if (req.body.dueDate !== undefined) game.dueDate = req.body.dueDate;
  if (req.body.startDate !== undefined) game.startDate = req.body.startDate;
  if (req.body.endDate !== undefined) game.endDate = req.body.endDate;
  if (req.body.dueTime !== undefined) game.dueTime = req.body.dueTime;
  if (req.body.startTime !== undefined) game.startTime = req.body.startTime;
  if (req.body.endTime !== undefined) game.endTime = req.body.endTime;
  if (req.body.archived !== undefined) game.archived = req.body.archived;
  if (req.body.urgent !== undefined) game.urgent = req.body.urgent;
  if (req.body.assignees !== undefined) game.assignees = req.body.assignees;
  if (req.body.progress !== undefined) game.progress = req.body.progress;
  if (req.body.done !== undefined) game.done = req.body.done;
  if (req.body.color !== undefined) game.color = req.body.color;
  f.userBoards[req.params.boardId] = f.board;
  f.all[f.userId] = f.userBoards;
  writeBoards(f.all);
  res.json(game);
});

app.patch('/api/public/boards/:boardId/columns/:colId/games/reorder', requireAuth, (req, res) => {
  const f = findPublicBoard(req.params.boardId);
  if (!f) return res.status(404).json({ error: 'Not found' });
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be array' });
  order.forEach((appid, idx) => {
    if (f.board.games[appid]) {
      f.board.games[appid].sortOrder = idx;
      f.board.games[appid].column = req.params.colId;
    }
  });
  f.userBoards[req.params.boardId] = f.board;
  f.all[f.userId] = f.userBoards;
  writeBoards(f.all);
  res.json({ ok: true });
});

app.delete('/api/public/boards/:boardId/games/:appid', requireAuth, (req, res) => {
  const f = findPublicBoard(req.params.boardId);
  if (!f) return res.status(404).json({ error: 'Not found' });
  const game = (f.board.games || {})[req.params.appid];
  if (!game) return res.status(404).json({ error: 'Not found' });
  // Soft-delete (corbeille 30 j côté propriétaire du board) — même filet de
  // sécurité que les boards perso, qu'elle soit archivée ou non.
  game.deletedAt = new Date().toISOString();
  f.userBoards[req.params.boardId] = f.board;
  f.all[f.userId] = f.userBoards;
  writeBoards(f.all);
  res.json({ ok: true, softDeleted: true, deletedAt: game.deletedAt });
});

// ── Board routes ──────────────────────────────────────────────────────────────

app.get('/api/boards', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  res.json(Object.entries(userBoards)
    .filter(([, b]) => !b.deletedAt)  // exclure les boards en corbeille
    .map(([id, b]) => {
      // headerImg explicite, sinon image de la carte Steam unique du board (cf. resolveBoardHeaderImg).
      return { id, name: b.name, emoji: b.emoji || '🎮', gameIcon: b.gameIcon || null, headerImg: resolveBoardHeaderImg(b), columns: b.columns || [], public: b.public || false };
    }));
});

const DEFAULT_COL_LABELS = {
  game: {
    fr: ['À jouer',   'En cours',    'Terminé'],
    en: ['To play',   'Playing',     'Done'],
    es: ['Por jugar', 'Jugando',     'Terminado'],
    de: ['Zu spielen','Spiele',      'Fertig'],
    ru: ['Играть',    'Играю',       'Пройдено'],
    zh: ['待玩',       '游戏中',       '已完成'],
  },
  task: {
    fr: ['Tâches à accomplir', 'Tâches en cours', 'Tâches en pause', 'Tâches abandonnées', 'Tâches accomplies'],
    en: ['To do',              'In progress',     'On hold',         'Abandoned',           'Done'],
    es: ['Por hacer',          'En curso',        'En pausa',        'Abandonado',          'Listo'],
    de: ['Zu erledigen',       'In Bearbeitung',  'Pausiert',        'Abgebrochen',         'Erledigt'],
    ru: ['К выполнению',       'В процессе',      'На паузе',        'Отменено',            'Готово'],
    zh: ['待办',                '进行中',           '暂停',            '已放弃',              '已完成'],
  },
};

app.post('/api/boards', requireAuth, (req, res) => {
  try {
    const { name, emoji, gameIcon, headerImg, gameBoard, lang } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    const id = `board_${Date.now()}`;
    const ts = Date.now();
    const safeLang = ['fr','en','es','de','ru','zh'].includes(lang) ? lang : 'fr';
    const isTask = !!(gameBoard || gameIcon);
    const labels = isTask ? DEFAULT_COL_LABELS.task[safeLang] : DEFAULT_COL_LABELS.game[safeLang];
    const defaultColumns = isTask ? [
      { id: `col_${ts}_1`, label: labels[0], emoji: '⏳' },
      { id: `col_${ts}_2`, label: labels[1], emoji: '⛏️' },
      { id: `col_${ts}_3`, label: labels[2], emoji: '⏸️' },
      { id: `col_${ts}_4`, label: labels[3], emoji: '❌' },
      { id: `col_${ts}_5`, label: labels[4], emoji: '✅', color: '#3db86a' },
    ] : [
      { id: `col_${ts}_1`, label: labels[0], emoji: '📋' },
      { id: `col_${ts}_2`, label: labels[1], emoji: '🎮' },
      { id: `col_${ts}_3`, label: labels[2], emoji: '✅' },
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
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  // Soft-delete : conservé 30 jours en corbeille
  board.deletedAt = new Date().toISOString();
  setUserBoards(req.user.id, userBoards);
  res.json({ ok: true });
});

// ── Corbeille boards ──────────────────────────────────────────────────────────

// GET /api/trash/boards — liste les boards soft-deletés de l'utilisateur
app.get('/api/trash/boards', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  const now = Date.now();
  let changed = false;
  const result = [];
  for (const [id, board] of Object.entries(userBoards)) {
    if (!board.deletedAt) continue;
    const age = now - new Date(board.deletedAt).getTime();
    if (age > TRASH_TTL_MS) { delete userBoards[id]; changed = true; continue; }
    const daysLeft = Math.max(1, Math.ceil((TRASH_TTL_MS - age) / 86400000));
    result.push({ id, name: board.name, emoji: board.emoji || '🎮', gameIcon: board.gameIcon || null, headerImg: resolveBoardHeaderImg(board), deletedAt: board.deletedAt, daysLeft, gameCount: Object.values(board.games || {}).filter(g => !g.deletedAt).length });
  }
  if (changed) setUserBoards(req.user.id, userBoards);
  res.json(result.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)));
});

// POST /api/trash/boards/restore — restaurer un board depuis la corbeille
app.post('/api/trash/boards/restore', requireAuth, (req, res) => {
  const { boardId } = req.body;
  if (!boardId) return res.status(400).json({ error: 'Missing boardId' });
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[boardId];
  if (!board || !board.deletedAt) return res.status(404).json({ error: 'Board not found in trash' });
  delete board.deletedAt;
  setUserBoards(req.user.id, userBoards);
  res.json({ ok: true });
});

// DELETE /api/trash/boards/item — suppression définitive d'un board
app.delete('/api/trash/boards/item', requireAuth, (req, res) => {
  const { boardId } = req.body;
  if (!boardId) return res.status(400).json({ error: 'Missing boardId' });
  const userBoards = getUserBoards(req.user.id);
  if (!userBoards[boardId]?.deletedAt) return res.status(404).json({ error: 'Board not found in trash' });
  delete userBoards[boardId];
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
  // Exclure les cartes soft-deletées (dans la corbeille)
  res.json(Object.values(board.games || {}).filter(g => !g.deletedAt));
});

app.post('/api/boards/:boardId/games', requireAuth, (req, res) => {
  const { appid, name, header_img, column, icon_img, type, emoji, color, taskType, dueDate, startDate, endDate, dueTime, startTime, endTime, urgent, assignees, notes, progress } = req.body;
  if (!appid || !column) return res.status(400).json({ error: 'Missing fields' });
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  if (!board.games) board.games = {};
  board.games[appid] = { appid, name, header_img: header_img || null, icon_img: icon_img || null, column, type: type || 'steam', emoji: emoji || null, color: color || null, taskType: taskType || null, dueDate: dueDate || null, startDate: startDate || null, endDate: endDate || null, dueTime: dueTime || null, startTime: startTime || null, endTime: endTime || null, urgent: urgent || false, assignees: assignees || [], notes: notes || [], progress: progress ?? null, archived: false, sortOrder: Date.now(), addedAt: new Date().toISOString() };
  setUserBoards(req.user.id, userBoards);
  res.status(201).json(board.games[appid]);
});

app.patch('/api/boards/:boardId/games/:appid', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) { console.warn('[PATCH game] board not found', req.params.boardId, 'user', req.user.id); return res.status(404).json({ error: 'Board not found' }); }
  const game = (board.games || {})[req.params.appid];
  if (!game) { console.warn('[PATCH game] game not found', req.params.appid, 'board', req.params.boardId); return res.status(404).json({ error: 'Game not found' }); }
  if (req.body.column !== undefined) game.column = req.body.column;
  if (req.body.notes !== undefined) {
    const trashed = req.body.notes.filter(n => n.deletedAt);
    console.log(`[PATCH game] user=${req.user.id} board=${req.params.boardId} game=${req.params.appid} notes=${req.body.notes.length} trashed=${trashed.length}`);
    game.notes = req.body.notes;
  }
  if (req.body.name !== undefined) game.name = req.body.name;
  if (req.body.emoji !== undefined) game.emoji = req.body.emoji;
  if (req.body.taskType !== undefined) game.taskType = req.body.taskType;
  if (req.body.dueDate !== undefined) game.dueDate = req.body.dueDate;
  if (req.body.startDate !== undefined) game.startDate = req.body.startDate;
  if (req.body.endDate !== undefined) game.endDate = req.body.endDate;
  if (req.body.dueTime !== undefined) game.dueTime = req.body.dueTime;
  if (req.body.startTime !== undefined) game.startTime = req.body.startTime;
  if (req.body.endTime !== undefined) game.endTime = req.body.endTime;
  if (req.body.archived !== undefined) game.archived = req.body.archived;
  if (req.body.urgent !== undefined) game.urgent = req.body.urgent;
  if (req.body.assignees !== undefined) game.assignees = req.body.assignees;
  if (req.body.progress !== undefined) game.progress = req.body.progress;
  if (req.body.done !== undefined) game.done = req.body.done;
  if (req.body.color !== undefined) game.color = req.body.color;
  setUserBoards(req.user.id, userBoards);
  res.json(game);
});

app.patch('/api/boards/:boardId/columns/:colId/games/reorder', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be array' });
  order.forEach((appid, idx) => {
    if (board.games[appid]) {
      board.games[appid].sortOrder = idx;
      board.games[appid].column = req.params.colId;
    }
  });
  setUserBoards(req.user.id, userBoards);
  res.json({ ok: true });
});

app.delete('/api/boards/:boardId/games/:appid', requireAuth, (req, res) => {
  const userBoards = getUserBoards(req.user.id);
  const board = userBoards[req.params.boardId];
  if (!board) return res.status(404).json({ error: 'Board not found' });
  const game = (board.games || {})[req.params.appid];
  if (!game) return res.status(404).json({ error: 'Game not found' });
  // Toute suppression de carte → soft-delete (corbeille 30 j), archivée ou non.
  // (Avant : seules les cartes archivées passaient par la corbeille, les autres
  // étaient détruites définitivement sans filet de sécurité — corrigé.)
  game.deletedAt = new Date().toISOString();
  setUserBoards(req.user.id, userBoards);
  console.log(`[soft-delete game] user=${req.user.id} board=${req.params.boardId} game=${req.params.appid}`);
  res.json({ ok: true, softDeleted: true, deletedAt: game.deletedAt });
});

// ── OG Preview proxy ─────────────────────────────────────────────────────────
// Cache: url → { data, ts }
const ogCache = new Map();
const OG_TTL = 10 * 60 * 1000; // 10 min

function extractOgMeta(html) {
  const get = (prop) => {
    const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
           || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
    return m ? m[1] : null;
  };
  const title = get('og:title') || get('twitter:title')
    || (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || null;
  const description = get('og:description') || get('twitter:description')
    || get('description') || null;
  const image = get('og:image') || get('twitter:image') || null;
  const siteName = get('og:site_name') || null;
  return {
    title: title?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim() || null,
    description: description?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'").slice(0, 200) || null,
    image: image || null,
    siteName: siteName || null,
  };
}

app.get('/api/og-preview', requireAuth, async (req, res) => {
  const { url } = req.query;
  if (!url || !/^https?:\/\//.test(url)) return res.status(400).json({ error: 'Invalid URL' });

  // Check cache
  const cached = ogCache.get(url);
  if (cached && Date.now() - cached.ts < OG_TTL) return res.json(cached.data);

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OGPreviewBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    clearTimeout(timer);
    const contentType = r.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return res.json({ title: null, description: null, image: null, siteName: null });
    // Read max 150 KB (enough for <head>)
    const reader = r.body.getReader();
    let html = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      html += new TextDecoder().decode(value);
      if (html.length > 150_000) { reader.cancel(); break; }
    }
    const data = extractOgMeta(html);
    ogCache.set(url, { data, ts: Date.now() });
    res.json(data);
  } catch (e) {
    if (e.name === 'AbortError') return res.status(408).json({ error: 'Timeout' });
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// ── Steam "En jeu" — qui joue à ce jeu en ce moment ─────────────────────────

const ingameCache = new Map(); // appid -> { players, fetchedAt }
const INGAME_TTL = 60 * 1000; // 1 min

app.get('/api/steam/ingame/:appid', requireAuth, async (req, res) => {
  const { appid } = req.params;
  if (!GLOBAL_STEAM_API_KEY) return res.json([]);

  const now = Date.now();
  const cached = ingameCache.get(appid);
  if (cached && now - cached.fetchedAt < INGAME_TTL) return res.json(cached.players);

  try {
    // Récupérer tous les users avec un steamId
    const users = readUsers().filter(u => u.steamId);
    if (!users.length) return res.json([]);

    const steamIds = users.map(u => u.steamId).join(',');
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${GLOBAL_STEAM_API_KEY}&steamids=${steamIds}`;
    const data = await steamFetch(url);
    const summaries = data.response?.players || [];

    // Filtrer ceux qui jouent au bon jeu
    const playing = summaries
      .filter(p => String(p.gameid) === String(appid))
      .map(p => {
        const user = users.find(u => u.steamId === p.steamid);
        return {
          steamId: p.steamid,
          username: user?.username || p.personaname,
          steamPersonaName: p.personaname,
          steamAvatar: p.avatarmedium || p.avatar || user?.steamAvatar || null,
        };
      });

    ingameCache.set(appid, { players: playing, fetchedAt: now });
    res.json(playing);
  } catch (e) {
    console.error('[ingame]', e.message);
    res.json([]);
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

ensureAdmin().then(() => {
  app.listen(PORT, () => console.log(`[server] Backend running on port ${PORT}`));
}).catch(err => {
  console.error('[server] Startup error:', err);
  process.exit(1);
});
