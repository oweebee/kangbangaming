# KangBanGaming

Gestionnaire de tâches Kanban pour gamers, optimisé pour Steam.  
Organise ta backlog, suis tes heures de jeu, partage tes boards avec ta communauté.

---

## Fonctionnalités

- **Kanban board** — colonnes personnalisables, drag & drop, mode compact
- **Intégration Steam** — bannières, stats joueurs en temps réel, actualités, Metacritic, prix
- **Connexion Steam** — authentification via Steam OpenID, compte créé automatiquement
- **Bannière "En jeu"** — affiche les membres de ta communauté actuellement en train de jouer le jeu du board actif
- **Panneau infos jeu** — glisse depuis la sidebar, verrouillable, déplaçable gauche/droite
- **Boards publics** — partage un lien en lecture seule sans compte
- **Admin** — panneau d'administration, gestion des utilisateurs, création de comptes
- **Mobile** — interface adaptée, colonnes en tabs

---

## Stack technique

| Côté | Technologie |
|------|-------------|
| Frontend | React 18, Vite 5 |
| Backend | Node.js 20, Express 4 |
| Données | Fichiers JSON persistés sur volume (`/app/data`) |
| Auth | Steam OpenID 2.0 + JWT (jsonwebtoken) + bcrypt |
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
npm run dev   # démarre sur le port 3001

# Frontend (autre terminal)
cd frontend
npm install
npm run dev   # démarre sur http://localhost:5173
```

En local, les variables d'env peuvent être définies dans un fichier `.env` à la racine (voir `.env.example`).

---

## Variables d'environnement

### Backend

| Variable         | Obligatoire | Défaut | Description |
|------------------|:-----------:|--------|-------------|
| `STEAM_API_KEY`  | ✅ | — | Clé API Steam — [obtenir ici](https://steamcommunity.com/dev/apikey). Nécessaire pour les stats et l'avatar Steam. |
| `JWT_SECRET`     | ✅ | `change-me-in-production` | Clé secrète de signature des tokens JWT. Générer avec : `openssl rand -hex 48` |
| `ADMIN_PASSWORD` | ✅ | `admin123` | Mot de passe du compte `admin` créé au premier démarrage. À changer impérativement en prod. |
| `FRONTEND_URL`   | ⚠️ | auto | URL publique du frontend. **Indispensable pour l'auth Steam.** Sur Coolify, inférée automatiquement depuis `SERVICE_URL_FRONTEND`. À définir manuellement ailleurs. |
| `BACKEND_URL`    | ⚠️ | auto | URL publique du backend (même domaine si Nginx proxy). Sur Coolify, inférée automatiquement. |
| `PORT`           | ❌ | `3001` | Port d'écoute du backend. |

> ⚠️ `FRONTEND_URL` et `BACKEND_URL` sont **critiques pour la connexion Steam** — sans elles, le callback OpenID pointe sur `localhost` et l'auth échoue en production.

> 🔒 `JWT_SECRET` et `STEAM_API_KEY` ne doivent **jamais** être committés. Le fichier `.env` est dans `.gitignore`.

### Frontend

| Variable        | Obligatoire | Description |
|-----------------|:-----------:|-------------|
| `VITE_APP_URL`  | ❌ | URL publique complète de l'app. Utilisée pour les balises Open Graph (aperçus Discord, Twitter/X, iMessage). |

---

## Déploiement sur Coolify

### Étapes

1. Crée un service Docker Compose dans Coolify depuis le repo GitHub
2. Coolify injecte automatiquement `SERVICE_URL_FRONTEND` — **aucune config d'URL nécessaire**
3. Renseigne les variables obligatoires dans l'onglet **Environment Variables** :

| Variable | Valeur |
|---|---|
| `STEAM_API_KEY` | Ta clé API Steam |
| `JWT_SECRET` | Chaîne aléatoire longue (`openssl rand -hex 48`) |
| `ADMIN_PASSWORD` | Mot de passe de l'admin |

C'est tout. `FRONTEND_URL` et `BACKEND_URL` sont résolues automatiquement via `SERVICE_URL_FRONTEND`.

### Persistance des données

Le backend stocke ses données dans `/app/data` (`users.json`, `boards.json`).  
Configure un **volume persistant** dans Coolify → Persistent Storage :

```
Source (hôte) : /opt/kanbangaming/data
Destination (container) : /app/data
```

Sans ce volume, les données sont perdues à chaque redéploiement.

---

## Authentification

### Connexion Steam (recommandée)

Les utilisateurs se connectent via le bouton **"Se connecter avec Steam"** — aucun compte préalable requis, le profil est créé automatiquement à la première connexion.

### Accès admin

Un lien discret **"⚙ Administration"** en bas de la page de login révèle le formulaire classique username/password, réservé au compte admin.

Le compte `admin` est créé automatiquement au premier démarrage avec le mot de passe défini dans `ADMIN_PASSWORD`.

### Création de comptes depuis le panel admin

L'admin peut créer des comptes manuellement depuis **Panel Admin → + Créer**. Les comptes créés sont immédiatement actifs et peuvent inclure un Steam ID optionnel.

---

## Open Graph (aperçus de lien)

Quand tu partages l'URL sur Discord, Twitter/X, iMessage, etc., une image de preview s'affiche.

1. Ouvre `frontend/public/preview-generator.html` dans Chrome
2. **F12** → icône téléphone/tablette → dimensions `1200 × 630`
3. Menu DevTools **⋮** → **Capture screenshot**
4. Sauvegarde sous `frontend/public/preview.png`
5. Déploie — accessible à `https://TONURL/preview.png`

> Pour tester : [opengraph.xyz](https://www.opengraph.xyz)

---

## Structure du projet

```
├── backend/
│   ├── src/
│   │   └── server.js          # API Express (auth, boards, Steam, OpenID)
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
│   │   ├── preview-generator.html
│   │   └── task-types/        # Icônes de types de tâches
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── .env.example               # Variables backend de référence
├── .gitignore
├── docker-compose.yml         # Déploiement Docker / Coolify
└── README.md
```

---

## Sécurité

- `STEAM_API_KEY` n'est **jamais** exposée au frontend — tous les appels Steam passent par le backend
- Les mots de passe sont hashés avec `bcrypt`
- Les comptes Steam-only n'ont pas de `passwordHash` — les endpoints protègent contre toute tentative de connexion par mot de passe
- Les routes protégées requièrent un token JWT valide en header `Authorization: Bearer <token>`
- Le fichier `.env` est dans `.gitignore`
