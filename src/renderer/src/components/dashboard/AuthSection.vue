<template>
  <section class="auth-section">
    <!-- ÉTAPE 1 : Configuration initiale de la Clé Steam Web API -->
    <div v-if="authStep === 'apikey'" class="auth-card apikey-setup-card">
      <div class="auth-steps-header">
        <span class="step-chip active">1. Clé API</span>
        <span class="step-separator">➔</span>
        <span class="step-chip">2. Connexion</span>
      </div>

      <div class="auth-icon-wrapper apikey-glow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="key-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      </div>

      <h2>Clé Steam Web API</h2>
      <p class="auth-description">
        Nécessaire pour récupérer les visuels et informations officielles de vos succès.
      </p>

      <!-- Notification de transparence et de confidentialité sur le stockage local -->
      <div class="local-privacy-notice-box">
        <div class="privacy-notice-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shield-notice-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div class="privacy-notice-text">
          <h4>Stockage 100% Local & Sauvegarde Automatique</h4>
          <p>
            Pour vous éviter d'avoir à remettre votre clé ou vous reconnecter à chaque lancement, vos identifiants sont sauvegardés <strong>exclusivement en local sur votre ordinateur</strong> (dans <code>%AppData%</code>).
            Aucune donnée n'est envoyée à des tiers : tout reste privé et confidentiel sur votre PC.
          </p>
        </div>
      </div>

      <!-- Bloc portail Steam -->
      <div class="apikey-portal-box">
        <div class="portal-info">
          <p>Générez gratuitement votre clé sur le portail officiel de Steam. <em>(Indiquez le nom de domaine de votre choix, ex : <code>overlay-stream</code>)</em></p>
        </div>
        <button class="btn-open-steam-portal" @click="openSteamApiKeyPortal">
          <span>Obtenir ma clé</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="external-link-icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </button>
      </div>

      <!-- Champ pour coller la clé -->
      <div class="apikey-input-section">
        <label class="apikey-label">
          <span>Collez votre clé API (32 caractères)</span>
        </label>
        <div class="key-input-wrapper">
          <input
            :value="steamApiKey"
            type="text"
            class="key-text-input"
            placeholder="Ex : 4B8A92FD7E83C1A4B02E9104..."
            spellcheck="false"
            @input="$emit('update:steamApiKey', $event.target.value)"
          />
          <button class="btn-paste-key" title="Coller depuis le presse-papier" @click="pasteApiKey">
            📋 Coller
          </button>
        </div>
      </div>

      <div v-if="keySavedMessage" class="success-banner">
        <span>{{ keySavedMessage }}</span>
      </div>

      <!-- Actions de navigation -->
      <div class="apikey-actions-footer">
        <button
          class="btn-save-key-next"
          :disabled="isSavingKey"
          @click="$emit('save-api-key')"
        >
          <span>{{ isSavingKey ? 'Enregistrement...' : 'Continuer' }}</span>
        </button>

        <button class="btn-skip-key-step" @click="$emit('skip-api-key')">
          Passer cette étape
        </button>
      </div>
    </div>

    <!-- ÉTAPE 2 : Connexion Steam OpenID -->
    <div v-else class="auth-card">
      <div class="auth-steps-header">
        <button class="btn-back-step" title="Modifier la clé API Steam" @click="$emit('update:authStep', 'apikey')">
          ← Clé API
        </button>
        <span class="step-chip active">2. Connexion</span>
      </div>

      <div class="auth-icon-wrapper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="shield-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      </div>

      <h2>Connexion Steam</h2>
      <p class="auth-description">
        Connectez votre compte pour synchroniser vos succès en temps réel.
      </p>

      <div class="session-persistence-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mini-save-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        <span>Votre session restera enregistrée sur ce PC pour vos prochains lancements.</span>
      </div>

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
          @click="$emit('login')"
        >
          <div v-if="isLoading" class="spinner"></div>
          <svg v-else viewBox="0 0 24 24" fill="currentColor" class="btn-steam-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15c-.55-.26-1-.8-1-1.5 0-.83.67-1.5 1.5-1.5.15 0 .29.02.43.07L13.5 9.5C13.2 9.07 13 8.56 13 8c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3c-.56 0-1.07-.2-1.5-.5l-2.57 2.57c.05.14.07.28.07.43 0 .7-.45 1.24-1 1.5v6.8c4.56-.93 8-4.96 8-9.8 0-5.52-4.48-10-10-10z"/>
          </svg>
          <span>{{ isLoading ? 'Connexion en cours...' : 'Se connecter' }}</span>
        </button>
      </div>

      <div class="security-notice" title="Connexion officielle Steam OpenID 2.0. Aucun mot de passe requis.">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lock-icon">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <p>Authentification sécurisée via <strong>Steam OpenID</strong>.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  authStep: {
    type: String,
    default: 'apikey'
  },
  steamApiKey: {
    type: String,
    default: ''
  },
  isSavingKey: {
    type: Boolean,
    default: false
  },
  keySavedMessage: {
    type: String,
    default: ''
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: null
  }
})

const emit = defineEmits([
  'update:authStep',
  'update:steamApiKey',
  'save-api-key',
  'skip-api-key',
  'login'
])

function openSteamApiKeyPortal() {
  const portalUrl = 'https://steamcommunity.com/dev/apikey'
  if (window.steamAPI?.openExternal) {
    window.steamAPI.openExternal(portalUrl)
  } else {
    window.open(portalUrl, '_blank')
  }
}

async function pasteApiKey() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      emit('update:steamApiKey', text.trim())
    }
  } catch (err) {
    console.warn('[AuthSection] Impossible de lire le presse-papier:', err)
  }
}
</script>

<style scoped>
.auth-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 55vh;
}

.auth-card {
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 3rem 2.5rem;
  width: 100%;
  max-width: 480px;
  text-align: center;
  box-shadow: var(--shadow-card);
}

.apikey-setup-card {
  max-width: 580px;
}

.auth-steps-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.step-chip {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--steam-text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  border: 1px solid transparent;
}

.step-chip.active {
  color: #66c0f4;
  background: rgba(102, 192, 244, 0.15);
  border-color: rgba(102, 192, 244, 0.4);
}

.step-separator {
  color: rgba(255, 255, 255, 0.25);
  font-size: 0.8rem;
}

.btn-back-step {
  background: none;
  border: none;
  color: #66c0f4;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  transition: var(--transition-smooth);
}

.btn-back-step:hover {
  background: rgba(102, 192, 244, 0.1);
  text-decoration: underline;
}

.auth-icon-wrapper {
  width: 64px;
  height: 64px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 192, 244, 0.1);
  border: 1px solid rgba(102, 192, 244, 0.2);
  border-radius: 16px;
}

.apikey-glow {
  background: rgba(240, 195, 48, 0.1) !important;
  border-color: rgba(240, 195, 48, 0.3) !important;
}

.key-icon {
  width: 32px;
  height: 32px;
  color: #f0c330;
}

.shield-icon {
  width: 32px;
  height: 32px;
  color: var(--steam-blue);
}

.auth-card h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #fff;
}

.auth-description {
  font-size: 0.9rem;
  color: var(--steam-text-muted);
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.local-privacy-notice-box {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: rgba(102, 192, 244, 0.08);
  border: 1px solid rgba(102, 192, 244, 0.25);
  border-radius: 12px;
  padding: 1.1rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.shield-notice-icon {
  width: 26px;
  height: 26px;
  color: #66c0f4;
  flex-shrink: 0;
  margin-top: 2px;
}

.privacy-notice-text h4 {
  font-size: 0.88rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.3rem 0;
}

.privacy-notice-text p {
  font-size: 0.78rem;
  color: #a8b8cf;
  margin: 0;
  line-height: 1.45;
}

.privacy-notice-text code {
  background: rgba(0, 0, 0, 0.35);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  color: #66c0f4;
}

.apikey-portal-box {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.portal-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
  font-size: 0.86rem;
  color: #c5d4e8;
  line-height: 1.45;
}

.portal-info code {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  color: #ffd644;
}

.btn-open-steam-portal {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
}

.btn-open-steam-portal:hover {
  background: rgba(102, 192, 244, 0.2);
  border-color: #66c0f4;
  color: #66c0f4;
}

.external-link-icon {
  width: 16px;
  height: 16px;
}

.apikey-input-section {
  text-align: left;
  margin-bottom: 1.5rem;
}

.apikey-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 600;
  color: #c5d4e8;
  margin-bottom: 0.5rem;
}

.key-input-wrapper {
  display: flex;
  gap: 0.5rem;
}

.key-text-input {
  flex: 1;
  background: rgba(15, 21, 29, 0.9);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fff;
  font-family: monospace;
  font-size: 0.85rem;
  transition: var(--transition-smooth);
}

.key-text-input:focus {
  outline: none;
  border-color: #f0c330;
  box-shadow: 0 0 10px rgba(240, 195, 48, 0.2);
}

.btn-paste-key {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-color);
  color: #fff;
  padding: 0 1rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-smooth);
  white-space: nowrap;
}

.btn-paste-key:hover {
  background: rgba(255, 255, 255, 0.15);
}

.success-banner {
  background: rgba(92, 126, 16, 0.25);
  border: 1px solid rgba(161, 205, 68, 0.5);
  color: #c7eb74;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1.25rem;
}

.apikey-actions-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-save-key-next {
  width: 100%;
  background: linear-gradient(135deg, #f0c330 0%, #d89e1b 100%);
  border: none;
  border-radius: 10px;
  padding: 0.85rem;
  color: #0b0e14;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(240, 195, 48, 0.3);
  transition: var(--transition-smooth);
}

.btn-save-key-next:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffd859 0%, #e6a722 100%);
  transform: translateY(-2px);
}

.btn-skip-key-step {
  background: none;
  border: none;
  color: var(--steam-text-muted);
  font-size: 0.82rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0.4rem;
}

.btn-skip-key-step:hover {
  color: #fff;
}

.session-persistence-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  background: rgba(102, 192, 244, 0.08);
  border: 1px solid rgba(102, 192, 244, 0.2);
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  margin-bottom: 1.5rem;
  font-size: 0.78rem;
  color: #9cbcdb;
}

.mini-save-icon {
  width: 16px;
  height: 16px;
  color: #66c0f4;
  flex-shrink: 0;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(235, 87, 87, 0.15);
  border: 1px solid rgba(235, 87, 87, 0.4);
  color: #ff8080;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.error-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.button-wrapper {
  margin-bottom: 1.75rem;
}

.steam-login-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #2a475e 0%, #1b2838 100%);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #ffffff;
  padding: 0.95rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  transition: var(--transition-smooth);
}

.steam-login-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #375975 0%, #203144 100%);
  border-color: #66c0f4;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 192, 244, 0.25);
}

.btn-steam-icon {
  width: 22px;
  height: 22px;
  color: #66c0f4;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.security-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: var(--steam-text-muted);
}

.security-notice p {
  margin: 0;
}

.lock-icon {
  width: 14px;
  height: 14px;
}
</style>
