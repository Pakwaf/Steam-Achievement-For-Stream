# Consignes d'Architecture et Règles du Projet (SteamOverlayStream)

Ce fichier définit les directives obligatoires pour toute IA ou développeur intervenant sur ce dépôt.

## 1. Gestion de Version & Packaging
- **Semantic Versioning (SemVer) Intelligent :**
  - Ne pas incrémenter aveuglément le patch. Analyser l'ampleur de la mise à jour avant de bump la version :
    - `MAJOR` (ex: 2.0.0) : Refonte totale de l'UI ou changement d'architecture majeur cassant la compatibilité (`npm run bump:major`).
    - `MINOR` (ex: 1.1.0) : Ajout de nouvelles fonctionnalités (Auto-updater, Twitch chat, Support multi-écrans...) (`npm run bump:minor`).
    - `PATCH` (ex: 1.0.2) : Simples corrections de bugs ou patchs de sécurité (`npm run bump`).
- **Synchronisation Triple :** La version doit être identique dans `package.json`, `src-tauri/tauri.conf.json` et `src-tauri/Cargo.toml`.
- **Langue des Installeurs Windows :**
  - MSI (WiX) : Langue impérativement définie sur `"fr-FR"` dans `tauri.conf.json` (`bundle.windows.wix.language: "fr-FR"`).
  - NSIS (`.exe`) : Langues configurées sur `["French", "English"]`.
- **Pas d'Upload Automatique (Règle d'or) :** Ne plus compiler les `.exe` ni publier de release sur GitHub de sa propre initiative à chaque commit/modification. Ne le faire QUE sur demande explicite de l'utilisateur (ex: "Génère la release").
- **Génération de Changelog Réel :** Lors de la création d'une release GitHub demandée, lister précisément les changements réels (features, fixes) effectués depuis le dernier tag Git au lieu d'un texte générique.

## 2. Architecture & Clean Code
- **Backend Rust :** Aucune logique métier dans `lib.rs` (Tauri commands minces). Tout réside dans `services/` (`ConfigService`, `ThemeService`, `ObsService`, `TrackerService`, `AudioService`, `AuthService`).
  - Rendu sécurisé des thèmes : Utiliser l'isolation native par iframe sandbox (`<iframe sandbox="allow-same-origin" ref="...">`) avec injection directe DOM (`iframeDoc.open(); write(); close()`) sans `allow-scripts`. Cela garantit le chargement fluide des images CDN (Steam) et polices, préserve 100% de la fidélité CSS/SVG sans rognage, tout en interdisant formellement l'exécution de tout script (imperméabilité XSS).
  - Zéro magic string : utiliser les constantes de `src/renderer/src/constants/` (`IPC_EVENTS`, `IPC_COMMANDS`, `STORAGE_KEYS`, `ACHIEVEMENT_TIERS_KEYS`).
  - Composants fins (SFC amincis) : déléguer la logique métier aux composables (`useSteamTracker`, `useThemeEditor`, `useAudioEngine`, `useObsManager`, `useThemeLibrary`, `useDesktopOverlay`).
  - Performance : toujours conserver `will-change: transform, opacity;` et l'accélération GPU sur les overlays et effets visuels pour garantir 60 FPS constants.

## 3. Confidentialité & Sécurité
- Ne jamais versionner ni logger de clés Steam API, identifiants ou tokens personnels.
- Le dossier `recap/` et les fichiers `recap*.md` doivent rester strictement ignorés par Git (`.gitignore`).
