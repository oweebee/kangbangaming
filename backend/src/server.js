import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const STEAM_API_KEY = process.env.STEAM_API_KEY;
const STEAM_ID = process.env.STEAM_ID;
const DATA_FILE = path.join(__dirname, '..', 'data', 'boards.json');

app.use(cors());
app.use(express.json());

// ─── Persistence ────────────────────────────────────────────────────────────

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { boards: {} };
  }
}

async function writeData(data) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// ─── Steam helpers ───────────────────────────────────────────────────────────

async function steamFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam API ${res.status}`);
  return res.json();
}

async function getGameInfo(appid) {
  // Tente de récupérer les infos depuis la bibliothèque Steam
  try {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=1&appids_filter[0]=${appid}&format=json`;
    const data = await steamFetch(url);
    const game = data.response?.games?.[0];
    if (game) return formatGame(game);
  } catch {}

  // Fallback: infos basiques depuis le store
  return {
    appid: parseInt(appid),
    name: `App ${appid}`,
    playtime_minutes: 0,
    playtime_hours: 0,
    header_img: `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
    library_img: `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`,
  };
}

function formatGame(g) {
  return {
    appid: g.appid,
    name: g.name,
    playtime_minutes: g.playtime_forever || 0,
    playtime_hours: Math.round((g.playtime_forever || 0) / 60 * 10) / 10,
    header_img: `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
    library_img: `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/library_600x900.jpg`,
  };
}

// ─── Health ──────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// ─── Search : bibliothèque Steam ─────────────────────────────────────────────

app.get('/api/search/library', async (req, res) => {
  try {
    const q = (req.query.q || '').toLowerCase().trim();
    if (!q) return res.json([]);

    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=1&include_played_free_games=1&format=json`;
    const data = await steamFetch(url);
    const games = data.response?.games || [];

    const results = games
      .filter(g => g.name?.toLowerCase().includes(q))
      .slice(0, 20)
      .map(formatGame);

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Search : store Steam ────────────────────────────────────────────────────

app.get('/api/search/store', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);

    const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=french&cc=FR`;
    const data = await steamFetch(url);

    const results = (data.items || []).slice(0, 20).map(g => ({
      appid: g.id,
      name: g.name,
      playtime_minutes: 0,
      playtime_hours: 0,
      header_img: `https://cdn.akamai.steamstatic.com/steam/apps/${g.id}/header.jpg`,
      library_img: `https://cdn.akamai.steamstatic.com/steam/apps/${g.id}/library_600x900.jpg`,
      price: g.price?.final_formatted || null,
      owned: false,
    }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Boards ──────────────────────────────────────────────────────────────────

// GET /api/boards
app.get('/api/boards', async (_req, res) => {
  const data = await readData();
  const list = Object.entries(data.boards).map(([id, b]) => ({
    id,
    name: b.name,
    gameCount: Object.keys(b.games || {}).length,
  }));
  res.json(list);
});

// POST /api/boards  { name }
app.post('/api/boards', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name requis' });
  const data = await readData();
  const id = `board_${Date.now()}`;
  data.boards[id] = { name, games: {} };
  await writeData(data);
  res.json({ id, name, gameCount: 0 });
});

// PATCH /api/boards/:boardId  { name }
app.patch('/api/boards/:boardId', async (req, res) => {
  const { boardId } = req.params;
  const { name } = req.body;
  const data = await readData();
  if (!data.boards[boardId]) return res.status(404).json({ error: 'Board introuvable' });
  data.boards[boardId].name = name;
  await writeData(data);
  res.json({ ok: true });
});

// DELETE /api/boards/:boardId
app.delete('/api/boards/:boardId', async (req, res) => {
  const { boardId } = req.params;
  const data = await readData();
  delete data.boards[boardId];
  await writeData(data);
  res.json({ ok: true });
});

// ─── Games dans un board ─────────────────────────────────────────────────────

// GET /api/boards/:boardId/games
app.get('/api/boards/:boardId/games', async (req, res) => {
  const { boardId } = req.params;
  const data = await readData();
  const board = data.boards[boardId];
  if (!board) return res.status(404).json({ error: 'Board introuvable' });

  const entries = Object.entries(board.games || {});
  const games = await Promise.all(
    entries.map(async ([appid, meta]) => {
      const info = await getGameInfo(appid).catch(() => ({ appid: parseInt(appid), name: `App ${appid}` }));
      return { ...info, column: meta.column };
    })
  );
  res.json(games);
});

// POST /api/boards/:boardId/games  { appid, column? }
app.post('/api/boards/:boardId/games', async (req, res) => {
  const { boardId } = req.params;
  const { appid, column = 'backlog' } = req.body;
  const data = await readData();
  if (!data.boards[boardId]) return res.status(404).json({ error: 'Board introuvable' });
  data.boards[boardId].games[appid] = { column };
  await writeData(data);
  res.json({ ok: true });
});

// DELETE /api/boards/:boardId/games/:appid
app.delete('/api/boards/:boardId/games/:appid', async (req, res) => {
  const { boardId, appid } = req.params;
  const data = await readData();
  if (!data.boards[boardId]) return res.status(404).json({ error: 'Board introuvable' });
  delete data.boards[boardId].games[appid];
  await writeData(data);
  res.json({ ok: true });
});

// POST /api/boards/:boardId/games/:appid/column  { column }
app.post('/api/boards/:boardId/games/:appid/column', async (req, res) => {
  const { boardId, appid } = req.params;
  const { column } = req.body;
  const data = await readData();
  if (!data.boards[boardId]?.games[appid]) return res.status(404).json({ error: 'Jeu introuvable' });
  data.boards[boardId].games[appid].column = column;
  await writeData(data);
  res.json({ ok: true });
});

// ─── Achievements ────────────────────────────────────────────────────────────

app.get('/api/games/:appid/achievements', async (req, res) => {
  try {
    const { appid } = req.params;
    const [achievementsData, schemaData] = await Promise.all([
      steamFetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&appid=${appid}&l=french`).catch(() => null),
      steamFetch(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v1/?key=${STEAM_API_KEY}&appid=${appid}&l=french`).catch(() => null),
    ]);

    const playerAchievements = achievementsData?.playerstats?.achievements || [];
    const schemaAchievements = schemaData?.game?.availableGameStats?.achievements || [];
    const schemaMap = Object.fromEntries(schemaAchievements.map(a => [a.name, a]));

    const merged = playerAchievements.map(a => ({
      apiname: a.apiname,
      unlocked: a.achieved === 1,
      unlock_time: a.unlocktime,
      name: schemaMap[a.apiname]?.displayName || a.apiname,
      description: schemaMap[a.apiname]?.description || '',
      icon: schemaMap[a.apiname]?.icon || '',
      icon_gray: schemaMap[a.apiname]?.icongray || '',
    }));

    const total = merged.length;
    const unlocked = merged.filter(a => a.unlocked).length;
    res.json({ total, unlocked, percent: total > 0 ? Math.round(unlocked / total * 100) : 0, achievements: merged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`✅ Backend démarré sur ${PORT}`));
