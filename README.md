# KangBanGaming

Gestionnaire de tâches Kanban pour gamers, optimisé pour Steam.  
Organise ta backlog, suis tes heures de jeu, partage tes boards avec ta communauté.

---

## Fonctionnalités

- **Kanban board** — colonnes personnalisables, drag & drop, vue compacte (desktop et mobile)
- **Intégration Steam** — bannières, stats joueurs en temps réel, succès, actualités, Metacritic, prix
- **Connexion Steam** — authentification via Steam OpenID, compte créé automatiquement
- **Bannière "En jeu"** — affiche les membres de ta communauté actuellement en train de jouer
- **Panneau infos jeu** — glisse depuis la sidebar, verrouillable, déplaçable gauche/droite
- **Boards publics collaboratifs** — partage un lien sans compte ; tout utilisateur connecté peut ajouter colonnes et cartes (pas seulement le propriétaire)
- **Tâches personnalisées** — cartes non-Steam avec types, assignation, notes, échéances
- **Panneau Échéances** — vue synthétique des dates limites et alertes urgentes ; colonnes adaptatives (1 → 2 → 3 selon la largeur du panneau redimensionnable)
- **Wishlist Steam dans les Échéances** — les jeux de ta wishlist avec une date de sortie connue apparaissent automatiquement dans le panneau Échéances (badge ★ WISHLIST, clic → page Steam Store, masquables). Profil Steam public requis.
- **Wishlist dans le profil** — liste compacte triée par date de sortie (plus proche en haut), avec miniature, nom et badge coloré (vert = sorti, orange = bientôt, gris = date lointaine ou inconnue)
- **Multi-langue** — interface en français, anglais, espagnol, allemand, russe et chinois (détection auto)
- **Corbeille** — les cartes, notes **et boards** supprimés sont conservés 30 jours avant suppression définitive ; restauration en un clic depuis l'onglet "Corbeille" du profil. Les admins ont une vue globale de toutes les suppressions et peuvent purger. La suppression admin envoie aussi les boards en corbeille.
- **Boards publics suivis** — les boards publics marqués comme "suivis" apparaissent dans une section dédiée sur l'accueil, séparée des autres boards publics, avec leur propre ordre drag & drop.
- **Refresh accueil** — bouton ↻ dans la barre de navigation (desktop et mobile) pour rafraîchir tous les boards sans recharger la page.
- **Admin** — gestion des utilisateurs, création de comptes, config Discord, approbation
- **Mobile** — interface adaptée, onglets swipables, vue compacte, slider home, drag tactile sur les boards de l'accueil
- **APK Android** — application WebView sideloadable, URL configurable au premier lancement

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
| Mobile | Android WebView (APK sideload, voir `android-app/`) |

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

### Auth Steam en développement

Steam OpenID valide le domaine du callback — **`localhost` est refusé**. Pour tester la connexion Steam en local, il faut exposer le backend via un tunnel public :

```bash
# Cloudflare Tunnel (recommandé)
cloudflared tunnel --url http://localhost:3001

# ou ngrok
ngrok http 3001
```

Puis définir les variables d'env avec l'URL générée :

```env
BACKEND_URL=https://xxx.trycloudflare.com
FRONTEND_URL=http://localhost:5173
```

> L'URL du tunnel change à chaque redémarrage (sauf tunnel nommé Cloudflare ou plan payant ngrok). Pour le dev quotidien sans auth Steam, il suffit de se connecter via le compte `admin`.

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

## Configuration Discord

L'icône et le lien Discord du serveur de la communauté se configurent dans le **Panel Admin → Paramètres** :

- **URL du serveur Discord** — lien d'invitation (ex: `https://discord.gg/xxxxx`). Si laissé vide, l'icône Discord n'apparaît pas dans l'interface.
- **URL de l'icône** — URL de l'icône du serveur Discord (format `.webp` ou `.png`).

Ces paramètres sont stockés en base de données et prennent effet immédiatement sans redéploiement.

---

## Application Android (APK)

Le dossier `android-app/` contient un projet Android Studio complet : une WebView plein écran qui charge ton instance KangBanGaming.

### Fonctionnement

- **Premier lancement** : un écran de configuration demande l'URL du serveur (ex: `https://gaming.mondomaine.com`)
- **Lancement suivant** : la WebView s'ouvre directement sur l'URL sauvegardée
- **Changer de serveur** : appui long sur l'écran → dialog de modification d'URL

### Build avec Android Studio

1. Ouvre le dossier `android-app/` dans **Android Studio**
2. Attends la synchronisation Gradle
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**
4. L'APK se trouve dans `app/build/outputs/apk/debug/app-debug.apk`

### Sideload sur Android

```
Paramètres → Sécurité → Sources inconnues → Autoriser
```
Puis transfère le fichier `.apk` sur l'appareil et ouvre-le pour installer.

> L'APK n'est pas destiné au Play Store. Package : `com.oweebee.kangbangaming`, minSdk 26 (Android 8.0+).

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
├── android-app/                   # Projet Android Studio (APK WebView)
│   ├── app/src/main/
│   │   ├── java/com/oweebee/kangbangaming/MainActivity.java
│   │   └── res/                   # Icônes, thème, strings
│   └── build.gradle / settings.gradle
│
├── backend/
│   ├── src/
│   │   └── server.js              # API Express (auth, boards, Steam, OpenID)
│   ├── data/                      # Données JSON (gitignorées, à monter en volume)
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Composant principal + état global
│   │   ├── i18n.js                # Traductions FR/EN
│   │   ├── utils.js               # Helpers partagés
│   │   └── components/
│   │       ├── GameCard.jsx
│   │       ├── GameModal.jsx
│   │       ├── TaskModal.jsx
│   │       ├── MobileBoard.jsx
│   │       ├── MobileHomeSlider.jsx   # Slider onglets home mobile
│   │       ├── SwipeTabs.jsx          # Onglets swipables (modal)
│   │       ├── KanbanBoard.jsx
│   │       ├── DeadlinePanel.jsx
│   │       ├── AdminPanel.jsx
│   │       └── ...
│   ├── public/
│   │   ├── preview.png            # Image Open Graph (à générer, non committée)
│   │   ├── preview-generator.html
│   │   └── task-types/            # Icônes de types de tâches
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── .env.example                   # Variables backend de référence
├── .gitignore
├── docker-compose.yml             # Déploiement Docker / Coolify
└── README.md
```

---

## Sécurité

- `STEAM_API_KEY` n'est **jamais** exposée au frontend — tous les appels Steam passent par le backend
- Les mots de passe sont hashés avec `bcrypt`
- Les comptes Steam-only n'ont pas de `passwordHash` — les endpoints protègent contre toute tentative de connexion par mot de passe
- Les routes protégées requièrent un token JWT valide en header `Authorization: Bearer <token>`
- Le fichier `.env` est dans `.gitignore`
