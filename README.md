# 🏆 SteamOverlayStream (Steam Achievement For Stream)

![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=for-the-badge&logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-2021-000000?style=for-the-badge&logo=rust&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue%203-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

**SteamOverlayStream** est une application Desktop Windows haute performance conçue pour les créateurs de contenu, les streamers (Twitch, YouTube, Kick) et les gamers sur PC. 

Elle permet d'afficher des notifications de succès Steam 100% personnalisables (HTML/CSS/Audio) directement en jeu et sur votre stream, sans aucune latence.

## ✨ Fonctionnalités Principales

*   🎮 **Overlay Desktop Transparent :** Affichage des succès par-dessus vos jeux (DirectX, Vulkan, OpenGL). Fenêtrage transparent avec *click-through* natif pour ne jamais gêner le gameplay. Rendu GPU accéléré à 60 FPS.
*   🎥 **Serveur OBS Intégré :** Diffusion en temps réel vers OBS Studio, Streamlabs ou vMix via une "Source Navigateur" locale. Serveur HTTP/WebSocket autonome embarqué gérant les flux audio et visuels.
*   🎨 **Studio de Personnalisation (Theme Studio) :** Éditeur complet pour créer, prévisualiser en direct et sauvegarder vos propres thèmes (HTML, CSS, effets visuels, sons).
*   🏆 **Système de Rareté (Tiers) :** Détection automatique de la rareté mondiale du succès. Animations, sons et styles distincts pour les succès **Standard (> 10%)**, **Rares (< 10%)**, et le **Master Platine (100% complété)**.
*   🔒 **Privacy First :** Toutes vos données (Clé API, identifiants) restent stockées localement sur votre machine. Aucun serveur tiers n'est utilisé pour traiter vos informations.

## 🚀 Installation (Utilisateurs)

1. Rendez-vous dans l'onglet **Releases** du dépôt.
2. Téléchargez la dernière version :
   *   `Steam.Achievement.For.Stream_x64-setup.exe` (Installeur classique)
   *   `Steam.Achievement.For.Stream_x64.msi` (Installeur Windows MSI)
3. Lancez l'installation et ouvrez l'application.
4. Suivez le guide intégré pour lier votre compte Steam en un clic !

## 🛠️ Architecture & Stack Technique

L'application a été repensée pour offrir une consommation de RAM minimale (~30-50 Mo) par rapport aux solutions Electron classiques, en s'appuyant sur l'écosystème **Tauri v2**.

*   **Backend (Rust) :** 
    *   Gestion asynchrone ultra-rapide (`tokio`).
    *   Serveur Web & WebSocket embarqué (`axum`).
    *   Services isolés (Tracker, Auth, Obs, Audio, Config).
*   **Frontend (Vue 3 / Vite) :** 
    *   Composition API pour une architecture modulaire et réactive.
    *   Moteur audio personnalisé (Web Audio API) pour le routage physique et la synthèse d'accords par rareté.
    *   Effets visuels avancés (Glassmorphism, CSS 3D, accélération GPU).

## 💻 Développement (Build Local)

### Prérequis
*   [Node.js](https://nodejs.org/) (v18+)
*   [Rust](https://www.rust-lang.org/tools/install) (Édition 2021)
*   Les prérequis de build Windows pour Tauri (C++ Build Tools).

### Installation et exécution

1. Clonez le dépôt :
   ```bash
   git clone https://github.com/votre-nom/SteamOverlayStream.git
   cd SteamOverlayStream
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Lancez l'application en mode développement :
   ```bash
   npm run tauri dev
   ```

4. Compilez l'exécutable pour la production :
   ```bash
   npm run tauri build
   ```

## 📄 Licence

Ce projet est sous licence MIT.
