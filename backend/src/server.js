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

// ─── Cache bibliothèque Steam ────────────────────────────────────────────────

let libraryCache = null;
let libraryCacheAt = 0;
const LIBRARY_TTL = 10 * 60 * 1000;

async function getLibrarySet() {
  if (libraryCache && Date.now() - libraryCacheAt < LIBRARY_TTL) return libraryCache;
  try {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=1&include_played_free_games=1&format=json`;
    const data = await steamFetch(url);
    libraryCache = new Set((data.response?.games || []).map(g => g.appid));
    libraryCacheAt = Date.now();
  } catch {
    libraryCache = new Set();
  }
  return libraryCache;
}

// ─── Persistence ─────────────────────────────────────────────────────────────

async function readData() {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, 'utf-8'));
  } catch {
    return { boards: {} };
  }
}

async function writeData(data) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

function defaultColumns() {
  return [{ id: `col_${Date.now()}`, label: 'Renomme moi', color: '#c0570a' }];
}

// ─── Steam helpers ────────────────────────────────────────────────────────────

async function steamFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam API ${res.status}`);
  return res.json();
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

async function getGameInfo(appid) {
  try {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=1&appids_filter[0]=${appid}&format=json`;
    const data = await steamFetch(url);
    const game = data.response?.games?.[0];
    if (game) return formatGame(game);
  } catch {}
  return {
    appid: parseInt(appid), name: `App ${appid}`,
    playtime_minutes: 0, playtime_hours: 0,
    header_img: `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
    library_img: `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`,
  };
}

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ─── Search store Steam (avec ownership) ─────────────────────────────────────

app.get('/api/search/store', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const [storeData, library] = await Promise.all([
      steamFetch(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(q)}&l=french&cc=FR`),
      getLibrarySet(),
    ]);
    const results = (storeData.items || []).slice(0, 20).map(g => ({
      appid: g.id, name: g.name,
      playtime_minutes: 0, playtime_hours: 0,
      header_img: `https://cdn.akamai.steamstatic.com/steam/apps/${g.id}/header.jpg`,
      library_img: `https://cdn.akamai.steamstatic.com/steam/apps/${g.id}/library_600x900.jpg`,
      price: g.price?.final_formatted || null,
      owned: library.has(g.id),
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Boards ───────────────────────────────────────────────────────────────────

app.get('/api/boards', async (_req, res) => {
  const data = await readData();
  res.json(Object.entries(data.boards).map(([id, b]) => ({
    id, name: b.name,
    columns: b.columns || defaultColumns(),
    gameCount: Object.keys(b.games || {}).length,
  })));
});

app.post('/api/boards', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name requis' });
  const data = await readData();
  const id = `board_${Date.now()}`;
  data.boards[id] = { name, columns: defaultColumns(), games: {} };
  await writeData(data);
  res.json({ id, name, columns: data.boards[id].columns, gameCount: 0 });
});

app.patch('/api/boards/:boardId', async (req, res) => {
  const { boardId } = req.params;
  const { name } = req.body;
  const data = await readData();
  if (!data.boards[boardId]) return res.status(404).json({ error: 'Board introuvable' });
  data.boards[boardId].name = name;
  await writeData(data);
  res.json({ ok: true });
});

app.delete('/api/boards/:boardId', async (req, res) => {
  const { boardId } = req.params;
  const data = await readData();
  delete data.boards[boardId];
  await writeData(data);
  res.json({ ok: true });
});

// ─── Colonnes ─────────────────────────────────────────────────────────────────

app.post('/api/boards/:boardId/columns', async (req, res) => {
  const { boardId } = req.params;
  const { label } = req.body;
  const data = await readData();
  if (!data.boards[boardId]) return res.status(404).json({ error: 'Board introuvable' });
  const col = { id: `col_${Date.now()}`, label: label || 'Nouvelle colonne', color: '#c0570a' };
  data.boards[boardId].columns = [...(data.boards[boardId].columns || []), col];
  await writeData(data);
  res.json(col);
});

app.patch('/api/boards/:boardId/columns/:colId', async (req, res) => {
  const { boardId, colId } = req.params;
  const { label, color } = req.body;
  const data = await readData();
  if (!data.boards[boardId]) return res.status(404).json({ error: 'Board introuvable' });
  const col = (data.boards[boardId].columns || []).find(c => c.id === colId);
  if (!col) return res.status(404).json({ error: 'Colonne introuvable' });
  if (label !== undefined) col.label = label;
  if (color !== undefined) col.color = color;
  await writeData(data);
  res.json({ ok: true });
});

app.delete('/api/boards/:boardId/columns/:colId', async (req, res) => {
  const { boardId, colId } = req.params;
  const data = await readData();
  if (!data.boards[boardId]) return res.status(404).json({ error: 'Board introuvable' });
  data.boards[boardId].columns = (data.boards[boardId].columns || []).filter(c => c.id !== colId);
  // Déplace les jeux orphelins vers la première colonne restante
  const firstCol = data.boards[boardId].columns[0];
  if (firstCol) {
    for (const g of Object.values(data.boards[boardId].games || {})) {
      if (g.column === colId) g.column = firstCol.id;
    }
  }
  await writeData(data);
  res.json({ ok: true });
});

// ─── Jeux dans un board ───────────────────────────────────────────────────────

app.get('/api/boards/:boardId/games', async (req, res) => {
  const { boardId } = req.params;
  const data = await readData();
  const board = data.boards[boardId];
  if (!board) return res.status(404).json({ error: 'Board introuvable' });
  const games = await Promise.all(
    Object.entries(board.games || {}).map(async ([appid, meta]) => {
      const info = await getGameInfo(appid).catch(() => ({ appid: parseInt(appid), name: `App ${appid}` }));
      return { ...info, column: meta.column };
    })
  );
  res.json(games);
});

app.post('/api/boards/:boardId/games', async (req, res) => {
  const { boardId } = req.params;
  const { appid, column } = req.body;
  const data = await readData();
  if (!data.boards[boardId]) return res.status(404).json({ error: 'Board introuvable' });
  const firstCol = (data.boards[boardId].columns || [])[0];
  data.boards[boardId].games[appid] = { column: column || firstCol?.id || 'default' };
  await writeData(data);
  res.json({ ok: true });
});

app.delete('/api/boards/:boardId/games/:appid', async (req, res) => {
  const { boardId, appid } = req.params;
  const data = await readData();
  if (!data.boards[boardId]) return res.status(404).json({ error: 'Board introuvable' });
  delete data.boards[boardId].games[appid];
  await writeData(data);
  res.json({ ok: true });
});

app.post('/api/boards/:boardId/games/:appid/column', async (req, res) => {
  const { boardId, appid } = req.params;
  const { column } = req.body;
  const data = await readData();
  if (!data.boards[boardId]?.games[appid]) return res.status(404).json({ error: 'Jeu introuvable' });
  data.boards[boardId].games[appid].column = column;
  await writeData(data);
  res.json({ ok: true });
});

// ─── Achievements ─────────────────────────────────────────────────────────────

app.get('/api/games/:appid/achievements', async (req, res) => {
  try {
    const { appid } = req.params;
    const [achievementsData, schemaData] = await Promise.all([
      steamFetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&appid=${appid}&l=french`).catch(() => null),
      steamFetch(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v1/?key=${STEAM_API_KEY}&appid=${appid}&l=french`).catch(() => null),
    ]);
    const playerAchievements = achievementsData?.playerstats?.achievements || [];
    const schemaMap = Object.fromEntries((schemaData?.game?.availableGameStats?.achievements || []).map(a => [a.name, a]));
    const merged = playerAchievements.map(a => ({
      apiname: a.apiname, unlocked: a.achieved === 1, unlock_time: a.unlocktime,
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
