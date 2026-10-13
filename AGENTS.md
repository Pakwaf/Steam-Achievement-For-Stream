# Consignes d'Architecture et Règles du Projet (SteamOverlayStream)

Ce fichier définit les directives obligatoires pour toute IA ou développeur intervenant sur ce dépôt.

## 1. Gestion de Version & Packaging
- **Incrémentation Automatique de Build :** À chaque commit ou série de modifications, incrémenter la version (SemVer) en exécutant `npm run bump` (ou `node scripts/bump-version.mjs patch`).
- **Synchronisation Triple :** La version doit être identique dans `package.json`, `src-tauri/tauri.conf.json` et `src-tauri/Cargo.toml`.
- **Langue des Installeurs Windows :**
  - MSI (WiX) : Langue impérativement définie sur `"fr-FR"` dans `tauri.conf.json` (`bundle.windows.wix.language: "fr-FR"`).
  - NSIS (`.exe`) : Langues configurées sur `["French", "English"]`.
- **Publication Systématique sur GitHub (Règle d'or) :** À chaque build produit, obligatoirement téléverser la release sur GitHub via `gh release create v<VERSION> <assets>` avec la description détaillée en changelog des ajouts de la version.

## 2. Architecture & Clean Code
- **Backend Rust :** Aucune logique métier dans `lib.rs` (Tauri commands minces). Tout réside dans `services/` (`ConfigService`, `ThemeService`, `ObsService`, `TrackerService`, `AudioService`, `AuthService`).
- **Frontend Vue 3 :**
  - Zéro magic string : utiliser les constantes de `src/renderer/src/constants/` (`IPC_EVENTS`, `IPC_COMMANDS`, `STORAGE_KEYS`, `ACHIEVEMENT_TIERS_KEYS`).
  - Composants fins (SFC amincis) : déléguer la logique métier aux composables (`useSteamTracker`, `useThemeEditor`, `useAudioEngine`, `useObsManager`, `useThemeLibrary`, `useDesktopOverlay`).
  - Performance : toujours conserver `will-change: transform, opacity;` et l'accélération GPU sur les overlays et effets visuels pour garantir 60 FPS constants.

## 3. Confidentialité & Sécurité
- Ne jamais versionner ni logger de clés Steam API, identifiants ou tokens personnels.
- Le fichier `recap.md` doit rester ignoré par Git (`.gitignore`).
