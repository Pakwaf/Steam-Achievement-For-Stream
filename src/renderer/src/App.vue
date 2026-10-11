<template>
  <div class="app-container">
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
          <span class="badge-phase">Phase 1 • Initialisation & Auth</span>
        </div>
      </div>
      <div class="system-status">
        <span class="status-dot" :class="{ online: currentUser, offline: !currentUser }"></span>
        <span class="status-label">{{ currentUser ? 'Connecté à Steam' : 'Déconnecté' }}</span>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="main-content">
      <!-- État 1 : Utilisateur non connecté -->
      <section v-if="!currentUser" class="auth-section">
        <div class="auth-card">
          <div class="auth-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="shield-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>

          <h2>Bienvenue sur l'overlay de succès</h2>
          <p class="auth-description">
            Affichez des notifications de succès Steam 100% personnalisables (HTML/CSS/JS) directement sur votre écran ou via une source navigateur OBS.
          </p>

          <!-- Alerte si ouvert dans un navigateur standard au lieu d'Electron -->
          <div v-if="!isElectron" class="browser-warning-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div class="warning-text">
              <strong>Application ouverte dans un navigateur web standard.</strong>
              <p>L'authentification Steam et les overlays nécessitent la fenêtre de l'application de bureau Electron.</p>
            </div>
          </div>

          <!-- Message d'erreur éventuel -->
          <div v-if="errorMessage" class="error-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Bouton de connexion Steam officiel -->
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
              <span>{{ isLoading ? 'Connexion Steam en cours...' : 'Se connecter avec Steam' }}</span>
            </button>
          </div>

          <div class="security-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lock-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <p>
              Authentification sécurisée officielle via <strong>Steam OpenID 2.0</strong>.<br/>
              Votre mot de passe n'est jamais demandé ni accessible par l'application.
            </p>
          </div>
        </div>
      </section>

      <!-- État 2 : Utilisateur connecté avec succès -->
      <section v-else class="profile-section">
        <div class="profile-card">
          <div class="profile-badge-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="check-icon">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Authentifié avec succès
          </div>

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
                <button
                  class="btn-copy"
                  title="Copier le SteamID"
                  @click="copySteamId"
                >
                  <span v-if="copied">Copié !</span>
                  <span v-else>Copier</span>
                </button>
              </div>
            </div>
          </div>

          <div class="profile-actions">
            <button
              class="btn-secondary"
              @click="openSteamProfile"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              Voir mon profil Steam
            </button>
            <button
              class="btn-danger"
              @click="handleLogout"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="action-icon">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Se déconnecter
            </button>
          </div>
        </div>

        <!-- Aperçu de la prochaine étape (Phase 2) -->
        <div class="next-phase-preview">
          <div class="preview-header">
            <h3>Prochaines étapes • Phase 2</h3>
            <span class="phase-tag">À venir</span>
          </div>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">🎮</div>
              <div class="feature-title">Overlay en jeu</div>
              <div class="feature-desc">Affichage des succès par-dessus votre session de jeu avec transparence matérielle.</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📡</div>
              <div class="feature-title">Source OBS Studio</div>
              <div class="feature-desc">Serveur WebSocket local fournissant une URL directe pour vos alertes de stream.</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎨</div>
              <div class="feature-title">Éditeur de thèmes</div>
              <div class="feature-desc">Personnalisation complète du design des notifications en pur HTML/CSS et animations.</div>
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

// Initialisation au montage du composant
onMounted(async () => {
  isElectron.value = typeof window !== 'undefined' && !!window.steamAPI
  if (window.steamAPI) {
    try {
      const user = await window.steamAPI.getCurrentUser()
      if (user) {
        currentUser.value = user
      }
    } catch (err) {
      console.error('Erreur lors de la récupération de la session:', err)
    }

    // Écoute des mises à jour d'état provenant du Main process
    window.steamAPI.onAuthStatusChanged((user) => {
      currentUser.value = user
    })
  }
})

// Déclenche l'authentification Steam
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
    console.error('Erreur lors de la déconnexion:', err)
  }
}

// Ouvrir le profil Steam dans le navigateur externe
function openSteamProfile() {
  if (currentUser.value?.profileUrl && window.steamAPI) {
    window.steamAPI.openExternal(currentUser.value.profileUrl)
  }
}

// Copier le SteamID64 dans le presse-papier
function copySteamId() {
  if (currentUser.value?.steamId) {
    navigator.clipboard.writeText(currentUser.value.steamId)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// Fallback image en cas d'erreur réseau sur l'avatar
function onAvatarError(e) {
  e.target.src = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* En-tête */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2.5rem;
  background: rgba(14, 20, 27, 0.8);
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
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #fff;
}

.badge-phase {
  font-size: 0.75rem;
  color: var(--steam-blue);
  background: rgba(102, 192, 244, 0.12);
  border: 1px solid rgba(102, 192, 244, 0.25);
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 500;
  display: inline-block;
  margin-top: 2px;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(23, 33, 45, 0.6);
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background-color: #57cbde;
  box-shadow: 0 0 8px #57cbde;
}

.status-dot.offline {
  background-color: #7a8b9e;
}

.status-label {
  font-size: 0.85rem;
  color: var(--steam-text-muted);
}

/* Zone principale */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem 1.5rem;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

/* Carte de connexion */
.auth-section {
  width: 100%;
  max-width: 540px;
  animation: fadeIn 0.4s ease-out;
}

.auth-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 18px;
  padding: 3rem 2.5rem;
  text-align: center;
  box-shadow: var(--shadow-card);
  transition: var(--transition-smooth);
}

.auth-card:hover {
  border-color: var(--border-color-active);
  box-shadow: var(--shadow-card), var(--glow-blue);
}

.auth-icon-wrapper {
  width: 68px;
  height: 68px;
  background: radial-gradient(circle, rgba(102, 192, 244, 0.2) 0%, rgba(27, 40, 56, 0.4) 100%);
  border: 1px solid rgba(102, 192, 244, 0.3);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem auto;
}

.shield-icon {
  width: 36px;
  height: 36px;
  color: var(--steam-blue);
}

.auth-card h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.8rem;
  color: #fff;
}

.auth-description {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--steam-text-muted);
  margin-bottom: 2rem;
}

/* Bouton de connexion Steam */
.button-wrapper {
  margin-bottom: 1.75rem;
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
  padding: 1rem 1.75rem;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 173, 238, 0.35);
  transition: var(--transition-smooth);
}

.steam-login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 173, 238, 0.55);
  filter: brightness(1.1);
}

.steam-login-button:active:not(:disabled) {
  transform: translateY(0);
}

.steam-login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  filter: grayscale(0.2);
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
  text-align: left;
}

.warning-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  color: #f5a623;
  margin-top: 2px;
}

.warning-text strong {
  display: block;
  font-size: 0.9rem;
  color: #ffc259;
  margin-bottom: 0.25rem;
}

.warning-text p {
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
  margin: 0;
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
  text-align: left;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Carte de profil connecté */
.profile-section {
  width: 100%;
  max-width: 720px;
  animation: fadeIn 0.4s ease-out;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.profile-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 18px;
  padding: 2.5rem;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.profile-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #66c0f4, #57cbde, #5c7e10);
}

.profile-badge-success {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #a1cd44;
  background: rgba(161, 205, 68, 0.12);
  border: 1px solid rgba(161, 205, 68, 0.25);
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 1.5rem;
}

.check-icon {
  width: 14px;
  height: 14px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.avatar-container {
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
}

.user-avatar {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  object-fit: cover;
  border: 2px solid var(--steam-blue);
  box-shadow: 0 0 20px rgba(102, 192, 244, 0.3);
}

.avatar-status-ring {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
  background-color: #57cbde;
  border: 3px solid var(--bg-primary);
  border-radius: 50%;
  box-shadow: 0 0 8px #57cbde;
}

.user-meta {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.user-name {
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
}

.user-state-pill {
  font-size: 0.75rem;
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
  padding: 3px 8px;
  border-radius: 6px;
  color: #c7d5e0;
}

.btn-copy {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #c7d5e0;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-copy:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.profile-actions {
  display: flex;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.btn-secondary, .btn-danger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-secondary {
  background: rgba(102, 192, 244, 0.1);
  border: 1px solid rgba(102, 192, 244, 0.25);
  color: var(--steam-blue);
}

.btn-secondary:hover {
  background: rgba(102, 192, 244, 0.2);
  border-color: rgba(102, 192, 244, 0.45);
}

.btn-danger {
  background: rgba(235, 87, 87, 0.1);
  border: 1px solid rgba(235, 87, 87, 0.25);
  color: #ff7b7b;
}

.btn-danger:hover {
  background: rgba(235, 87, 87, 0.2);
  border-color: rgba(235, 87, 87, 0.45);
}

.action-icon {
  width: 18px;
  height: 18px;
}

/* Aperçu Phase 2 */
.next-phase-preview {
  background: rgba(18, 24, 34, 0.5);
  border: 1px dashed rgba(102, 192, 244, 0.2);
  border-radius: 16px;
  padding: 1.75rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.preview-header h3 {
  font-size: 1.05rem;
  color: #fff;
  font-weight: 600;
}

.phase-tag {
  font-size: 0.75rem;
  color: #8b9bb4;
  background: rgba(255, 255, 255, 0.06);
  padding: 2px 8px;
  border-radius: 999px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.feature-card {
  background: rgba(23, 33, 45, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 1rem;
}

.feature-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.feature-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #e6edf3;
  margin-bottom: 0.25rem;
}

.feature-desc {
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--steam-text-muted);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
