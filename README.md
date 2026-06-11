# KangBanGaming

Gestionnaire de tâches Kanban pour gamers, optimisé pour Steam.  
Organise ta backlog, suis tes heures de jeu, partage tes boards avec ta communauté.

---

## Fonctionnalités

- **Kanban board** — colonnes personnalisables, drag & drop, mode compact
- **Intégration Steam** — bannières, stats joueurs en temps réel, actualités, Metacritic, prix
- **Panneau infos jeu** — glisse depuis la sidebar, verrouillable, déplaçable gauche/droite
- **Boards publics** — partage un lien en lecture seule sans compte
- **Gestion de compte** — inscription, profil, liaison compte Steam
- **Admin** — panneau d'administration, gestion des utilisateurs
- **Mobile** — interface adaptée, colonnes en tabs

---

## Stack technique

| Côté | Technologie |
|------|-------------|
| Frontend | React 18, Vite 5 |
| Backend | Node.js 20, Express 4 |
| Données | Fichiers JSON persistés sur volume (`/app/data`) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Serveur web | Nginx (frontend) |
| Déploiement | Docker, Coolify |

---

## Prérequis

- [Node.js 20+](https://nodejs.org) pour le développement local
- [Docker](https://docker.com) pour la production
- Une clé API Steam : [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)

---

## Installation locale

```bash
# Backend
cd backend
npm install
cp ../.env.example ../.env   # remplis les valeurs
npm run dev                  # démarre sur le port 3001

# Frontend (autre terminal)
cd frontend
npm install
cp .env.example .env         # remplis VITE_APP_URL
npm run dev                  # démarre sur http://localhost:5173
```

---

## Variables d'environnement

### Backend

Fichier de référence : `.env.example` (racine du projet)

| Variable         | Obligatoire | Description |
|------------------|:-----------:|-------------|
| `STEAM_API_KEY`  | ✅ | Clé API Steam — [obtenir ici](https://steamcommunity.com/dev/apikey) |
| `JWT_SECRET`     | ✅ | Clé secrète de signature des tokens JWT. Générer avec : `openssl rand -hex 48` |
| `ADMIN_PASSWORD` | ✅ | Mot de passe du compte `admin` créé au premier démarrage |
| `PORT`           | ❌ | Port d'écoute du backend (défaut : `3001`) |

> ⚠️ Ces variables ne doivent **jamais** être committées. Le fichier `.env` est dans `.gitignore`.

### Frontend

Fichier de référence : `frontend/.env.example`

| Variable        | Obligatoire | Description |
|-----------------|:-----------:|-------------|
| `VITE_APP_URL`  | ✅ | URL publique complète de l'app (ex: `https://kangbangaming.mondomaine.com`). Utilisée pour les balises Open Graph — aperçus Discord, Twitter/X, iMessage. |

> Vite injecte automatiquement cette variable lors du `npm run build`. Elle n'est **pas** sensible mais ne doit pas non plus être hardcodée dans le code source.

---

## Déploiement sur Coolify

Coolify déploie chaque service (frontend / backend) séparément depuis le repo GitHub.

### Étapes

1. Dans Coolify, crée deux services depuis le même repo GitHub
2. Définis le **root directory** : `./backend` pour l'un, `./frontend` pour l'autre
3. Renseigne les variables d'environnement dans l'onglet **Environment Variables** de chaque service (voir tableaux ci-dessus)
4. Lance le déploiement

Les variables persistent entre les redéploiements — tu n'as à les saisir qu'une seule fois.

### Persistance des données

Le backend stocke ses données dans `/app/data` (fichiers `users.json` et `boards.json`).  
Configure un **volume persistant** dans Coolify pour ce chemin, sinon les données sont perdues à chaque redéploiement.

```
/app/data  →  volume persistant Coolify
```

---

## Open Graph (aperçus de lien)

Quand tu partages l'URL de l'app sur Discord, Twitter/X, iMessage, etc., une image de preview s'affiche automatiquement.

### Générer l'image de preview

1. Ouvre `frontend/public/preview-generator.html` dans Chrome
2. **F12** → icône téléphone/tablette → saisis `1200` × `630` comme dimensions
3. Menu DevTools **⋮** → **Capture screenshot**
4. Sauvegarde le fichier sous le nom `preview.png` dans `frontend/public/`
5. Déploie — l'image sera accessible à `https://TONURL/preview.png`

> Pour tester le rendu : colle ton URL sur [opengraph.xyz](https://www.opengraph.xyz)

---

## Structure du projet

```
├── backend/
│   ├── src/
│   │   └── server.js          # API Express (auth, boards, Steam, news)
│   ├── data/                  # Données JSON (gitignorées, à monter en volume)
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Composant principal
│   │   ├── components/        # Tous les composants React
│   │   └── index.css          # Styles globaux (CSS variables)
│   ├── public/
│   │   ├── preview.png        # Image Open Graph (à générer, non committée)
│   │   ├── preview-generator.html  # Générateur de l'image OG
│   │   └── task-types/        # Icônes de types de tâches
│   ├── .env.example
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── .env.example               # Variables backend attendues
├── .gitignore
├── docker-compose.yml         # Pour déploiement local avec Docker
└── README.md
```

---

## Sécurité

- La clé `STEAM_API_KEY` n'est **jamais** exposée au frontend — tous les appels Steam passent par le backend
- Les mots de passe sont hashés avec `bcrypt`
- Les routes protégées requièrent un token JWT valide en header `Authorization: Bearer <token>`
- Le fichier `.env` est dans `.gitignore` — ne jamais le committer
