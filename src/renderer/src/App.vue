<template>
  <div class="app-container">
    <!-- Pop-up Overlay Toast de Succès (Notification animée) -->
    <transition name="achievement-pop">
      <div v-if="activeNotification" class="achievement-toast" role="alert">
        <div class="toast-glow-border"></div>
        <div class="toast-content">
          <!-- Icône du succès -->
          <div class="toast-icon-wrapper">
            <img
              :src="activeNotification.icon || fallbackIcon"
              :alt="activeNotification.displayName"
              class="achievement-icon"
              @error="onIconError"
            />
            <div class="icon-shine"></div>
          </div>

          <!-- Textes du succès -->
          <div class="toast-details">
            <div class="toast-header-row">
              <span class="game-tag">{{ activeNotification.gameName || 'Steam' }}</span>
              <span class="unlocked-title">SUCCÈS DÉBLOQUÉ !</span>
              <button class="btn-dismiss-toast" title="Fermer" @click="dismissToast">✕</button>
            </div>
            <h4 class="achievement-title">{{ activeNotification.displayName }}</h4>
            <p class="achievement-desc">{{ activeNotification.description }}</p>
          </div>
        </div>
        <!-- Barre de progression automatique du toast (7 secondes) -->
        <div class="toast-progress-bar"></div>
      </div>
    </transition>

    <!-- Barre supérieure de navigation / En-tête -->
    <header class="app-header">
      <div class="brand">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="currentColor" class="steam-logo">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15c-.55-.26-1-.8-1-1.5 0-.83.67-1.5 1.5-1.5.15 0 .29.02.43.07L13.5 9.5C13.2 9.07 13 8.56 13 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3c-.56 0-1.07-.2-1.5-.5l-2.57 2.57c.05.14.07.28.07.43 0 .7-.45 1.24-1 1.5v6.8c4.56-.93 8-4.96 8-9.8 0-5.52-4.48-10-10-10z"/>
          </svg>
        </div>
        <div class="brand-text">
          <h1>Steam Custom Achievements</h1>
          <span class="badge-phase">Phase 2 • Tracker en temps réel</span>
        </div>
      </div>
      <div class="header-status-group">
        <!-- Tracker status -->
        <div class="tracker-status-chip" :class="{ active: trackerStatus?.isTracking }">
          <span class="chip-dot"></span>
          <span>{{ trackerStatus?.isTracking ? 'Tracker Actif (Logs)' : 'Tracker Inactif' }}</span>
        </div>
        <!-- Auth status -->
        <div class="system-status">
          <span class="status-dot" :class="{ online: currentUser, offline: !currentUser }"></span>
          <span class="status-label">{{ currentUser ? currentUser.personaName : 'Déconnecté' }}</span>
        </div>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="main-content">
      <!-- Alerte si ouvert dans un navigateur standard au lieu d'Electron -->
      <div v-if="!isElectron" class="browser-warning-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div class="warning-text">
          <strong>Application ouverte dans un navigateur web standard.</strong>
          <p>L'authentification Steam et l'écoute des logs nécessitent la fenêtre de l'application de bureau Electron.</p>
        </div>
      </div>

      <!-- État 1 : Utilisateur non connecté -->
      <section v-if="!currentUser" class="auth-section">
        <div class="auth-card">
          <div class="auth-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="shield-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>

          <h2>Connexion Steam requise</h2>
          <p class="auth-description">
            Connectez-vous avec votre compte Steam pour associer votre profil et commencer à suivre vos succès en temps réel.
          </p>

          <div v-if="errorMessage" class="error-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <div class="button-wrapper">
            <button
              id="btn-steam-login"
              class="steam-login-button"
              :disabled="isLoading"
              @click="handleLogin"
            >
              <div v-if="isLoading" class="spinner"></div>
              <svg v-else viewBox="0 0 24 24" fill="currentColor" class="btn-steam-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15c-.55-.26-1-.8-1-1.5 0-.83.67-1.5 1.5-1.5.15 0 .29.02.43.07L13.5 9.5C13.2 9.07 13 8.56 13 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3c-.56 0-1.07-.2-1.5-.5l-2.57 2.57c.05.14.07.28.07.43 0 .7-.45 1.24-1 1.5v6.8c4.56-.93 8-4.96 8-9.8 0-5.52-4.48-10-10-10z"/>
              </svg>
              <span>{{ isLoading ? 'Connexion en cours...' : 'Se connecter avec Steam' }}</span>
            </button>
          </div>

          <div class="security-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lock-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <p>
              Authentification sécurisée officielle via <strong>Steam OpenID 2.0</strong>.<br/>
              Votre mot de passe n'est jamais requis.
            </p>
          </div>
        </div>
      </section>

      <!-- État 2 : Utilisateur connecté -->
      <section v-else class="dashboard-section">
        <!-- 1. Carte Profil Utilisateur -->
        <div class="profile-card">
          <div class="profile-header">
            <div class="avatar-container">
              <img
                :src="currentUser.avatar"
                :alt="currentUser.personaName"
                class="user-avatar"
                @error="onAvatarError"
              />
              <span class="avatar-status-ring"></span>
            </div>

            <div class="user-meta">
              <div class="name-row">
                <h2 class="user-name">{{ currentUser.personaName }}</h2>
                <span class="user-state-pill">{{ currentUser.onlineState || 'En ligne' }}</span>
              </div>
              <div class="steam-id-box">
                <span class="label">SteamID64 :</span>
                <code class="id-value">{{ currentUser.steamId }}</code>
                <button class="btn-copy" title="Copier le SteamID" @click="copySteamId">
                  {{ copied ? 'Copié !' : 'Copier' }}
                </button>
              </div>
            </div>

            <div class="profile-actions-inline">
              <button class="btn-secondary" title="Ouvrir le profil Steam" @click="openSteamProfile">
                Profil Steam
              </button>
              <button class="btn-danger" title="Se déconnecter" @click="handleLogout">
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        <!-- 2. Panneau de Contrôle & Diagnostic du Tracker -->
        <div class="tracker-card">
          <div class="tracker-card-header">
            <div class="tracker-title-box">
              <div class="tracker-pulse-icon">
                <span class="pulse-ring"></span>
                <span class="pulse-center"></span>
              </div>
              <div>
                <h3>Détection des succès en temps réel</h3>
                <p class="tracker-subtitle">Surveillance active des fichiers de logs Steam (0ms de latence)</p>
              </div>
            </div>
            <span class="badge-active-tracker">
              {{ trackerStatus?.isTracking ? '● Écoute en cours' : '○ Déconnecté' }}
            </span>
          </div>

          <!-- Informations système détectées -->
          <div class="tracker-diagnostics">
            <div class="diag-item">
              <span class="diag-label">Répertoire Steam :</span>
              <span class="diag-value" :title="trackerStatus?.steamPath">
                {{ trackerStatus?.steamPath || 'Recherche automatique en cours...' }}
              </span>
            </div>
            <div class="diag-item">
              <span class="diag-label">Log surveillé :</span>
              <span class="diag-value" :title="trackerStatus?.watchedFiles?.join(', ')">
                {{ trackerStatus?.watchedFiles?.[0] ? getFilename(trackerStatus.watchedFiles[0]) : 'stats_log.txt' }}
              </span>
            </div>
            <div class="diag-item">
              <span class="diag-label">Clé Steam Web API :</span>
              <span class="diag-value" :class="{ 'api-ok': trackerStatus?.hasApiKey, 'api-warn': !trackerStatus?.hasApiKey }">
                {{ trackerStatus?.hasApiKey ? 'Configurée (.env) ✔' : 'Non renseignée (Mode fallback public)' }}
              </span>
            </div>
          </div>

          <!-- Section de Test & Simulation -->
          <div class="simulation-section">
            <div class="simulation-header">
              <h4>Tester l'overlay (Simulation instantanée)</h4>
              <p>Simulez le déblocage d'un succès pour valider la chaîne complète (Logs ➜ API ➜ IPC ➜ Notification) :</p>
            </div>

            <div class="sim-buttons-row">
              <button
                class="btn-sim"
                :disabled="isSimulating"
                @click="simulateAchievement('440', 'TF_PLAY_GAME_EVERYCLASS')"
              >
                <span class="sim-game-badge">TF2</span>
                <span>Tête de classe</span>
              </button>

              <button
                class="btn-sim"
                :disabled="isSimulating"
                @click="simulateAchievement('1794680', 'ACH_DISCOVER_HYPER_ROSETTA')"
              >
                <span class="sim-game-badge">Vampire Survivors</span>
                <span>Hyper Rosetta</span>
              </button>

              <button
                class="btn-sim"
                :disabled="isSimulating"
                @click="simulateAchievement('550', 'ACH_SURVIVE_CAMPAIGN_NEW')"
              >
                <span class="sim-game-badge">Left 4 Dead 2</span>
                <span>Survivant</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Historique des succès reçus durant la session -->
        <div class="history-card">
          <div class="history-header">
            <h3>Succès détectés cette session ({{ unlockedHistory.length }})</h3>
            <span v-if="unlockedHistory.length > 0" class="btn-clear-history" @click="unlockedHistory = []">
              Effacer la liste
            </span>
          </div>

          <div v-if="unlockedHistory.length === 0" class="history-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-trophy">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.072 0a5.25 5.25 0 00-6.072 0m6.072 0c.937.606 1.572 1.637 1.603 2.825m-7.675-2.825c-.937.606-1.572 1.637-1.603 2.825M12 3v9m0 0l-3-3m3 3l3-3" />
            </svg>
            <p>En attente du premier succès...</p>
            <span class="empty-sub">Lancez un jeu Steam ou cliquez sur l'un des boutons de simulation ci-dessus.</span>
          </div>

          <div v-else class="history-list">
            <div
              v-for="(item, idx) in unlockedHistory"
              :key="idx"
              class="history-item"
            >
              <img :src="item.icon || fallbackIcon" :alt="item.displayName" class="history-icon" @error="onIconError" />
              <div class="history-info">
                <div class="history-top">
                  <span class="history-game">{{ item.gameName }}</span>
                  <span class="history-time">{{ formatTime(item.unlockedAt) }}</span>
                </div>
                <div class="history-name">{{ item.displayName }}</div>
                <div class="history-desc">{{ item.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentUser = ref(null)
const isLoading = ref(false)
const errorMessage = ref(null)
const copied = ref(false)
const isElectron = ref(typeof window !== 'undefined' && !!window.steamAPI)

// État du tracker et des succès
const trackerStatus = ref(null)
const activeNotification = ref(null)
const unlockedHistory = ref([])
const isSimulating = ref(false)
let toastTimer = null

const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

// Initialisation au montage
onMounted(async () => {
  isElectron.value = typeof window !== 'undefined' && !!window.steamAPI
  if (window.steamAPI) {
    try {
      // 1. Utilisateur courant
      const user = await window.steamAPI.getCurrentUser()
      if (user) currentUser.value = user

      // 2. Statut du tracker de log
      const status = await window.steamAPI.getTrackerStatus()
      trackerStatus.value = status
    } catch (err) {
      console.error('Erreur initialisation:', err)
    }

    // Écoute des mises à jour d'authentification
    window.steamAPI.onAuthStatusChanged((user) => {
      currentUser.value = user
    })

    // Écoute des succès débloqués en temps réel
    window.steamAPI.onAchievementUnlocked((achievement) => {
      triggerAchievementToast(achievement)
    })
  }
})

// Déclenche l'affichage du toast de notification
function triggerAchievementToast(achievement) {
  activeNotification.value = achievement
  unlockedHistory.value.unshift(achievement)

  // Annule le timer précédent si un succès arrive à la suite
  if (toastTimer) clearTimeout(toastTimer)

  // Disparition automatique après 7 secondes
  toastTimer = setTimeout(() => {
    activeNotification.value = null
  }, 7000)
}

function dismissToast() {
  if (toastTimer) clearTimeout(toastTimer)
  activeNotification.value = null
}

// Déclenche une simulation via le pont IPC
async function simulateAchievement(appId, achievementCode) {
  if (!window.steamAPI || isSimulating.value) return
  isSimulating.value = true
  try {
    await window.steamAPI.simulateAchievement({ appId, achievementCode })
  } catch (err) {
    console.error('Erreur simulation:', err)
  } finally {
    isSimulating.value = false
  }
}

// Connexion Steam
async function handleLogin() {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = null

  try {
    if (!window.steamAPI) {
      throw new Error("L'API Steam Preload n'est pas disponible dans un navigateur standard. Veuillez utiliser la fenêtre de l'application Electron.")
    }

    const result = await window.steamAPI.login()
    if (result.success) {
      currentUser.value = result.user
    } else {
      errorMessage.value = result.error || 'Connexion échouée.'
    }
  } catch (err) {
    errorMessage.value = err.message || 'Une erreur inattendue est survenue.'
  } finally {
    isLoading.value = false
  }
}

// Déconnexion
async function handleLogout() {
  try {
    if (window.steamAPI) {
      await window.steamAPI.logout()
    }
    currentUser.value = null
    errorMessage.value = null
  } catch (err) {
    console.error('Erreur déconnexion:', err)
  }
}

function openSteamProfile() {
  if (currentUser.value?.profileUrl && window.steamAPI) {
    window.steamAPI.openExternal(currentUser.value.profileUrl)
  }
}

function copySteamId() {
  if (currentUser.value?.steamId) {
    navigator.clipboard.writeText(currentUser.value.steamId)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

function getFilename(fullPath) {
  if (!fullPath) return ''
  return fullPath.split(/\\|\//).pop()
}

function formatTime(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function onAvatarError(e) {
  e.target.src = fallbackIcon
}

function onIconError(e) {
  e.target.src = fallbackIcon
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

/* ========================================================
   TOAST NOTIFICATION OVERLAY (SUCCÈS DÉBLOQUÉ)
   ======================================================== */
.achievement-toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  width: 440px;
  background: rgba(18, 26, 38, 0.95);
  backdrop-filter: blur(16px);
  border-radius: 14px;
  border: 1px solid rgba(240, 195, 48, 0.5);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75), 0 0 25px rgba(240, 195, 48, 0.25);
  overflow: hidden;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
}

.toast-icon-wrapper {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #f0c330;
  box-shadow: 0 0 14px rgba(240, 195, 48, 0.4);
}

.achievement-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #0b0e14;
}

.toast-details {
  flex: 1;
  min-width: 0;
}

.toast-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.2rem;
}

.game-tag {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #66c0f4;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

.unlocked-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: #f0c330;
  letter-spacing: 0.08em;
  text-shadow: 0 0 10px rgba(240, 195, 48, 0.4);
}

.btn-dismiss-toast {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.btn-dismiss-toast:hover {
  color: #fff;
}

.achievement-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.achievement-desc {
  font-size: 0.8rem;
  color: #9cb0c9;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.toast-progress-bar {
  height: 3px;
  background: linear-gradient(90deg, #f0c330, #ffdd77);
  animation: countdown 7s linear forwards;
}

@keyframes countdown {
  from { width: 100%; }
  to { width: 0%; }
}

/* Animations d'entrée / sortie du toast */
.achievement-pop-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.achievement-pop-leave-active {
  transition: all 0.3s ease-in;
}
.achievement-pop-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.92);
}
.achievement-pop-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}

/* ========================================================
   EN-TÊTE & NAVIGATION
   ======================================================== */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.1rem 2.5rem;
  background: rgba(14, 20, 27, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #1b2838 0%, #171a21 100%);
  border: 1px solid rgba(102, 192, 244, 0.3);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.steam-logo {
  width: 26px;
  height: 26px;
  color: var(--steam-blue);
  filter: drop-shadow(0 0 6px rgba(102, 192, 244, 0.4));
}

.brand-text h1 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
}

.badge-phase {
  font-size: 0.72rem;
  color: #f0c330;
  background: rgba(240, 195, 48, 0.12);
  border: 1px solid rgba(240, 195, 48, 0.25);
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
  display: inline-block;
}

.header-status-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tracker-status-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(23, 33, 45, 0.6);
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  font-size: 0.8rem;
  color: #8b9bb4;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.tracker-status-chip.active {
  color: #57cbde;
  border-color: rgba(87, 203, 222, 0.3);
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7a8b9e;
}

.tracker-status-chip.active .chip-dot {
  background: #57cbde;
  box-shadow: 0 0 8px #57cbde;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(23, 33, 45, 0.6);
  padding: 0.4rem 0.85rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.online {
  background-color: #a1cd44;
  box-shadow: 0 0 8px #a1cd44;
}
.status-dot.offline {
  background-color: #7a8b9e;
}

.status-label {
  font-size: 0.8rem;
  color: #c7d5e0;
}

/* ========================================================
   CONTENU PRINCIPAL
   ======================================================== */
.main-content {
  flex: 1;
  padding: 2.5rem 2rem;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

.dashboard-section {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

/* Cartes */
.profile-card, .tracker-card, .history-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: var(--shadow-card);
}

/* Profil */
.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-container {
  position: relative;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  object-fit: cover;
  border: 2px solid var(--steam-blue);
  box-shadow: 0 0 16px rgba(102, 192, 244, 0.3);
}

.avatar-status-ring {
  position: absolute;
  bottom: -3px;
  right: -3px;
  width: 16px;
  height: 16px;
  background-color: #57cbde;
  border: 2px solid var(--bg-primary);
  border-radius: 50%;
  box-shadow: 0 0 6px #57cbde;
}

.user-meta {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.4rem;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
}

.user-state-pill {
  font-size: 0.7rem;
  color: #57cbde;
  background: rgba(87, 203, 222, 0.12);
  border: 1px solid rgba(87, 203, 222, 0.25);
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.steam-id-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--steam-text-muted);
}

.id-value {
  font-family: monospace;
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 7px;
  border-radius: 5px;
  color: #c7d5e0;
}

.btn-copy {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #c7d5e0;
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 0.75rem;
  cursor: pointer;
}

.profile-actions-inline {
  display: flex;
  gap: 0.75rem;
}

/* Tracker Card */
.tracker-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.tracker-title-box {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.tracker-pulse-icon {
  position: relative;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-center {
  width: 10px;
  height: 10px;
  background-color: #57cbde;
  border-radius: 50%;
  box-shadow: 0 0 8px #57cbde;
}

.pulse-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid #57cbde;
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0% { transform: scale(0.6); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}

.tracker-title-box h3 {
  font-size: 1.15rem;
  color: #fff;
  font-weight: 700;
}

.tracker-subtitle {
  font-size: 0.8rem;
  color: var(--steam-text-muted);
}

.badge-active-tracker {
  font-size: 0.75rem;
  color: #a1cd44;
  background: rgba(161, 205, 68, 0.12);
  border: 1px solid rgba(161, 205, 68, 0.3);
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 600;
}

.tracker-diagnostics {
  background: rgba(11, 14, 20, 0.6);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.04);
  margin-bottom: 1.5rem;
}

.diag-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.diag-label {
  font-size: 0.75rem;
  color: #8b9bb4;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.diag-value {
  font-size: 0.85rem;
  color: #e6edf3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.api-ok {
  color: #a1cd44;
  font-weight: 600;
}

.api-warn {
  color: #f5a623;
  font-weight: 600;
}

/* Simulation section */
.simulation-section {
  background: rgba(23, 33, 45, 0.4);
  border-radius: 12px;
  padding: 1.2rem;
  border: 1px dashed rgba(102, 192, 244, 0.25);
}

.simulation-header h4 {
  font-size: 0.95rem;
  color: #f0c330;
  margin-bottom: 0.25rem;
}

.simulation-header p {
  font-size: 0.8rem;
  color: var(--steam-text-muted);
  margin-bottom: 0.9rem;
}

.sim-buttons-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-sim {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(102, 192, 244, 0.1);
  border: 1px solid rgba(102, 192, 244, 0.3);
  color: #e6edf3;
  padding: 0.6rem 1rem;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-sim:hover:not(:disabled) {
  background: rgba(102, 192, 244, 0.2);
  border-color: #66c0f4;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 192, 244, 0.25);
}

.sim-game-badge {
  font-size: 0.7rem;
  background: rgba(255, 255, 255, 0.12);
  color: #66c0f4;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Historique */
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.history-header h3 {
  font-size: 1.1rem;
  color: #fff;
  font-weight: 700;
}

.btn-clear-history {
  font-size: 0.75rem;
  color: var(--steam-text-muted);
  cursor: pointer;
  text-decoration: underline;
}

.btn-clear-history:hover {
  color: #fff;
}

.history-empty {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--steam-text-muted);
}

.empty-trophy {
  width: 48px;
  height: 48px;
  color: rgba(255, 255, 255, 0.15);
  margin-bottom: 0.5rem;
}

.empty-sub {
  display: block;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 0.25rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(11, 14, 20, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  transition: var(--transition-smooth);
}

.history-item:hover {
  border-color: rgba(102, 192, 244, 0.25);
  background: rgba(18, 24, 34, 0.6);
}

.history-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #f0c330;
  flex-shrink: 0;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.15rem;
}

.history-game {
  font-size: 0.75rem;
  color: #66c0f4;
  font-weight: 600;
}

.history-time {
  font-size: 0.7rem;
  color: #7a8b9e;
}

.history-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.15rem;
}

.history-desc {
  font-size: 0.8rem;
  color: #9cb0c9;
  line-height: 1.3;
}

/* Boutons communs */
.btn-secondary, .btn-danger {
  display: inline-flex;
  align-items: center;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}
.btn-secondary {
  background: rgba(102, 192, 244, 0.12);
  border: 1px solid rgba(102, 192, 244, 0.25);
  color: var(--steam-blue);
}
.btn-secondary:hover {
  background: rgba(102, 192, 244, 0.22);
}
.btn-danger {
  background: rgba(235, 87, 87, 0.12);
  border: 1px solid rgba(235, 87, 87, 0.25);
  color: #ff7b7b;
}
.btn-danger:hover {
  background: rgba(235, 87, 87, 0.22);
}

/* Auth Card Styles */
.auth-section {
  width: 100%;
  max-width: 520px;
  margin: 2rem auto;
}
.auth-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 18px;
  padding: 3rem 2.5rem;
  text-align: center;
}
.auth-icon-wrapper {
  width: 64px;
  height: 64px;
  background: radial-gradient(circle, rgba(102, 192, 244, 0.2) 0%, rgba(27, 40, 56, 0.4) 100%);
  border: 1px solid rgba(102, 192, 244, 0.3);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
}
.shield-icon {
  width: 32px;
  height: 32px;
  color: var(--steam-blue);
}
.auth-card h2 {
  font-size: 1.5rem;
  margin-bottom: 0.6rem;
  color: #fff;
}
.auth-description {
  font-size: 0.9rem;
  color: var(--steam-text-muted);
  margin-bottom: 1.75rem;
  line-height: 1.5;
}
.steam-login-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: linear-gradient(90deg, #1999e3 0%, #00adee 100%);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 0.95rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 173, 238, 0.35);
  transition: var(--transition-smooth);
}
.steam-login-button:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-2px);
}
.btn-steam-icon {
  width: 22px;
  height: 22px;
}
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.security-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  font-size: 0.8rem;
  color: var(--steam-text-muted);
  background: rgba(14, 20, 27, 0.5);
  border-radius: 8px;
  padding: 0.75rem;
  margin-top: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-align: left;
}
.lock-icon {
  width: 18px;
  height: 18px;
  color: #66c0f4;
  flex-shrink: 0;
}
.browser-warning-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: rgba(245, 166, 35, 0.12);
  border: 1px solid rgba(245, 166, 35, 0.4);
  color: #f5a623;
  padding: 0.9rem 1.1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
}
.warning-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  color: #f5a623;
}
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: rgba(235, 87, 87, 0.15);
  border: 1px solid rgba(235, 87, 87, 0.35);
  color: #ff7b7b;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}
.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
