# KangBanGaming — Application Android

Application Android pour accéder à ton instance [KangBanGaming](https://github.com/oweebee/kangbangaming) depuis ton téléphone.

WebView plein écran avec URL configurable au premier lancement — compatible avec toute instance auto-hébergée.

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

**Changer de serveur :** appui long sur l'écran → dialog de modification.

---

## Compatibilité

- Android 8.0 (API 26) et supérieur
- Nécessite une connexion réseau vers le serveur KangBanGaming

---

## Build

Le workflow GitHub Actions build et publie automatiquement l'APK à chaque push sur `main`.

Pour déclencher manuellement : onglet **Actions → Release APK → Run workflow**.

Aucune installation locale requise.
