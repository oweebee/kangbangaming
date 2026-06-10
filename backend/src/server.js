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
const KANBAN_FILE = path.join(__dirname, '..', 'data', 'kanban.json');

app.use(cors());
app.use(express.json());

// ─── Helpers ────────────────────────────────────────────────────────────────

async function steamFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Steam API error: ${res.status}`);
  return res.json();
}

async function readKanban() {
  try {
    const raw = await fs.readFile(KANBAN_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeKanban(data) {
  await fs.mkdir(path.dirname(KANBAN_FILE), { recursive: true });
  await fs.writeFile(KANBAN_FILE, JSON.stringify(data, null, 2));
}

// ─── Routes ─────────────────────────────────────────────────────────────────

// GET /api/health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, steamId: STEAM_ID, hasKey: !!STEAM_API_KEY });
});

// GET /api/games  –  liste tous les jeux du compte Steam
app.get('/api/games', async (_req, res) => {
  try {
    if (!STEAM_API_KEY || !STEAM_ID) {
      return res.status(500).json({ error: 'STEAM_API_KEY ou STEAM_ID manquant dans les variables d\'environnement.' });
    }

    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=1&include_played_free_games=1&format=json`;
    const data = await steamFetch(url);
    const games = (data.response?.games || []).sort((a, b) => b.playtime_forever - a.playtime_forever);

    // Récupère l'état kanban sauvegardé
    const kanban = await readKanban();

    const enriched = games.map(g => ({
      appid: g.appid,
      name: g.name,
      playtime_minutes: g.playtime_forever,
      playtime_hours: Math.round(g.playtime_forever / 60 * 10) / 10,
      img_icon: g.img_icon_url
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
        : null,
      header_img: `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/header.jpg`,
      library_img: `https://cdn.akamai.steamstatic.com/steam/apps/${g.appid}/library_600x900.jpg`,
      column: kanban[g.appid]?.column || (g.playtime_forever === 0 ? 'backlog' : 'playing'),
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/games/:appid/achievements  –  succès d'un jeu
app.get('/api/games/:appid/achievements', async (req, res) => {
  try {
    const { appid } = req.params;

    const [achievementsData, schemaData] = await Promise.all([
      steamFetch(`https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&appid=${appid}&l=french`).catch(() => null),
      steamFetch(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v1/?key=${STEAM_API_KEY}&appid=${appid}&l=french`).catch(() => null),
    ]);

    const playerAchievements = achievementsData?.playerstats?.achievements || [];
    const schemaAchievements = schemaData?.game?.availableGameStats?.achievements || [];

    // Merge schema (icônes, descriptions) avec les données joueur (unlocked)
    const schemaMap = {};
    for (const a of schemaAchievements) {
      schemaMap[a.name] = a;
    }

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

    res.json({
      total,
      unlocked,
      percent: total > 0 ? Math.round((unlocked / total) * 100) : 0,
      achievements: merged,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kanban  –  état des colonnes
app.get('/api/kanban', async (_req, res) => {
  res.json(await readKanban());
});

// POST /api/kanban  –  met à jour la colonne d'un jeu
// body: { appid: number, column: string }
app.post('/api/kanban', async (req, res) => {
  try {
    const { appid, column } = req.body;
    const kanban = await readKanban();
    kanban[appid] = { ...(kanban[appid] || {}), column };
    await writeKanban(kanban);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Steam Kanban backend démarré sur le port ${PORT}`);
  if (!STEAM_API_KEY) console.warn('⚠️  STEAM_API_KEY non défini');
  if (!STEAM_ID) console.warn('⚠️  STEAM_ID non défini');
});
