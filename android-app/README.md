# KangBanGaming — Application Android

Application Android pour accéder à ton instance [KangBanGaming](https://github.com/oweebee/kangbangaming) depuis ton téléphone.

WebView plein écran adaptatif — compatible Android 8.0+ (Pixel 9 inclus).

---

## Télécharger l'APK

👉 **[Dernière version → Releases](../../releases/latest)**

Clique sur `KangBanGaming.apk` pour télécharger.

---

## Installer sur Android

1. Transfère le fichier `.apk` sur ton téléphone (câble USB, Google Drive, email…)
2. Sur le téléphone : **Paramètres → Sécurité → Sources inconnues → Autoriser**
   *(ou "Installer des apps inconnues" selon la version Android)*
3. Ouvre le fichier `.apk` depuis le gestionnaire de fichiers
4. Confirme l'installation

---

## Premier lancement

Un écran de configuration s'affiche. Entre l'adresse de ton serveur :

```
https://gaming.tondomaine.com
```

L'URL est sauvegardée — les lancements suivants ouvrent directement l'app.

**Changer de serveur :** appui long sur n'importe quelle partie de l'écran → dialog de modification.

---

## Fonctionnement

- **Plein écran adaptatif** — Android 11+ utilise l'API edge-to-edge native ; Android 8-10 utilise le mode immersif classique
- **Clavier** — le contenu défile pour que le champ actif reste visible ; pas d'élargissement de l'écran
- **Dialogs JS** — `alert`, `confirm`, `prompt` (ex. : supprimer une note) s'affichent comme des dialogs Android natifs
- **Retour** — le bouton retour Android navigue dans l'historique du WebView ; si plus d'historique, propose de quitter
- **Résilience** — si le processus WebView est tué par Android (Android 14+), l'app se recharge automatiquement sans crasher

---

## Compatibilité

- Android 8.0 (API 26) et supérieur
- Nécessite une connexion réseau vers le serveur KangBanGaming
- Testé sur Google Pixel 9 (Android 15)

---

## Build

Le workflow GitHub Actions build et publie automatiquement l'APK à chaque push sur `main`.

Pour déclencher manuellement : onglet **Actions → Release APK → Run workflow**.

Aucune installation locale requise.
