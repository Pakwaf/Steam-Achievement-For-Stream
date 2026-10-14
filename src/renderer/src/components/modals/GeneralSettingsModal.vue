<template>
  <div v-if="isOpen" class="api-key-modal-overlay" @click.self="$emit('close')">
    <div class="api-key-modal-card general-settings-modal">
      <!-- En-tête de la modale -->
      <div class="modal-card-header">
        <div class="modal-title-group">
          <div class="settings-header-icon-glow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="settings-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.27.1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.27-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.142-.854-.108-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3>Paramètres de l'Application</h3>
            <p class="modal-subtitle-text">Configurez le comportement général, la détection Steam et votre flux OBS</p>
          </div>
        </div>
        <button class="btn-close-modal" title="Fermer" @click="$emit('close')">✕</button>
      </div>

      <!-- Barre d'onglets stricte et catégorisée -->
      <div class="settings-tabs-nav">
        <button
          class="settings-tab-btn"
          :class="{ active: activeTab === 'app' }"
          @click="activeTab = 'app'"
        >
          <span class="tab-icon">💻</span>
          <span>Général / Application</span>
        </button>
        <button
          class="settings-tab-btn"
          :class="{ active: activeTab === 'steam' }"
          @click="activeTab = 'steam'"
        >
          <span class="tab-icon">🎯</span>
          <span>Steam & Tracker</span>
        </button>
        <button
          class="settings-tab-btn"
          :class="{ active: activeTab === 'stream' }"
          @click="activeTab = 'stream'"
        >
          <span class="tab-icon">📡</span>
          <span>Streaming (OBS / Audio)</span>
        </button>
      </div>

      <!-- Corps du formulaire selon l'onglet actif -->
      <div class="general-settings-body">
        <!-- ==========================================
             ONGLET 1 : GÉNÉRAL / APPLICATION
             ========================================== -->
        <div v-if="activeTab === 'app'" class="tab-content-panel">
          <!-- 1. Démarrage avec Windows -->
          <div class="settings-block">
            <div class="block-header-row">
              <span class="block-icon">🚀</span>
              <div>
                <h4 class="block-title">Démarrage avec Windows</h4>
                <p class="block-sub">Lancer automatiquement SteamOverlayStream en tâche de fond dès le démarrage de votre PC</p>
              </div>
            </div>
            <div class="settings-field-row">
              <label class="toggle-switch">
                <input v-model="localAutostart" type="checkbox" />
                <span class="slider"></span>
                <span class="toggle-text">{{ localAutostart ? 'Activé (Démarrage automatique)' : 'Désactivé' }}</span>
              </label>
            </div>
          </div>

          <!-- 2. Thème de l'interface (Clair / Sombre) -->
          <div class="settings-block">
            <div class="block-header-row">
              <span class="block-icon">🌓</span>
              <div>
                <h4 class="block-title">Thème de l'Application</h4>
                <p class="block-sub">Choisissez l'apparence visuelle de l'interface du tableau de bord</p>
              </div>
            </div>
            <div class="theme-choice-row">
              <button
                class="theme-preset-card"
                :class="{ active: appTheme === 'dark' }"
                @click="setAppTheme('dark')"
              >
                <div class="theme-preview dark-preview"></div>
                <span class="theme-preset-name">Mode Sombre (Steam Dark)</span>
              </button>
              <button
                class="theme-preset-card"
                :class="{ active: appTheme === 'light' }"
                @click="setAppTheme('light')"
              >
                <div class="theme-preview light-preview"></div>
                <span class="theme-preset-name">Mode Clair (Modern Light)</span>
              </button>
            </div>
          </div>

          <!-- 3. Mises à jour logicielles (Auto-Updater) -->
          <div class="settings-block">
            <div class="block-header-row">
              <span class="block-icon">🔄</span>
              <div>
                <h4 class="block-title">Mise à Jour de l'Application</h4>
                <p class="block-sub">Recherchez et installez les dernières versions de SteamOverlayStream</p>
              </div>
            </div>
            <div class="settings-field-row updater-field-row">
              <div class="updater-status-info">
                <span class="current-version-text">Version installée : <strong>v{{ currentAppVersion }}</strong></span>
                <span v-if="updaterStatusMessage" class="updater-status-badge" :class="{ error: updaterError }">
                  {{ updaterStatusMessage }}
                </span>
              </div>
              <button
                class="btn-check-updates"
                :disabled="isCheckingUpdates || isDownloadingUpdates"
                @click="handleCheckUpdates"
              >
                <span v-if="isCheckingUpdates">⏳ Recherche...</span>
                <span v-else-if="isDownloadingUpdates">📥 Téléchargement...</span>
                <span v-else>🔍 Rechercher</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ==========================================
             ONGLET 2 : STEAM & TRACKER
             ========================================== -->
        <div v-else-if="activeTab === 'steam'" class="tab-content-panel">
          <!-- 1. Intervalle de rafraîchissement (polling) -->
          <div class="settings-block">
            <div class="block-header-row">
              <span class="block-icon">⏱️</span>
              <div>
                <h4 class="block-title">Intervalle de Rafraîchissement (Polling)</h4>
                <p class="block-sub">Fréquence de vérification des succès débloqués lorsque vous êtes en jeu</p>
              </div>
            </div>
            <div class="settings-field-row">
              <select v-model.number="localPollingInterval" class="device-select-global">
                <option :value="1500">1.5 seconde (Ultra Réactif - Recommandé pour le Stream)</option>
                <option :value="3000">3.0 secondes (Équilibré)</option>
                <option :value="5000">5.0 secondes (Économie processeur)</option>
              </select>
            </div>
          </div>

          <!-- 2. Dossier surveillé & Fichiers de log Steam -->
          <div class="settings-block">
            <div class="block-header-row">
              <span class="block-icon">📂</span>
              <div>
                <h4 class="block-title">Dossier et Fichiers Steam Surveillés</h4>
                <p class="block-sub">Emplacement local des fichiers de statistiques et logs Steam détectés</p>
              </div>
            </div>
            <div class="steam-path-info-box">
              <div class="path-line">
                <span class="path-label">Répertoire Steam :</span>
                <span class="path-val">{{ trackerStatus?.steamPath || 'C:\\Program Files (x86)\\Steam (Détection auto)' }}</span>
              </div>
              <div v-if="trackerStatus?.watchedFiles?.length" class="watched-files-list">
                <span class="path-label">Fichiers surveillés en direct :</span>
                <div v-for="file in trackerStatus.watchedFiles" :key="file" class="file-chip">
                  📄 {{ file.split(/[\\/]/).pop() }}
                </div>
              </div>
              <div v-else class="status-tip">
                ⚡ Le tracker surveille automatiquement les fichiers <code>stats.bin</code> et les logs Steam au lancement d'un jeu.
              </div>
            </div>
          </div>

          <!-- 3. Statut Clé API Steam -->
          <div class="settings-block">
            <div class="block-header-row">
              <span class="block-icon">🔑</span>
              <div>
                <h4 class="block-title">Clé Steam Web API</h4>
                <p class="block-sub">Nécessaire pour récupérer les descriptions enrichies, icônes HD et le temps de jeu Master</p>
              </div>
            </div>
            <div class="settings-field-row justify-between">
              <div class="api-key-status-indicator">
                <span class="badge-dot" :class="{ green: trackerStatus?.hasApiKey }"></span>
                <span class="api-key-text">
                  {{ trackerStatus?.hasApiKey ? 'Clé API active et opérationnelle' : 'Aucune clé configurée (Mode dégradé)' }}
                </span>
              </div>
              <button class="btn-manage-api-key" @click="$emit('open-api-key')">
                Modifier la clé
              </button>
            </div>
          </div>
        </div>

        <!-- ==========================================
             ONGLET 3 : STREAMING (OBS / AUDIO)
             ========================================== -->
        <div v-else-if="activeTab === 'stream'" class="tab-content-panel">
          <!-- 1. Périphérique de sortie audio matériel (setSinkId) -->
          <div class="settings-block">
            <div class="block-header-row">
              <span class="block-icon">🎧</span>
              <div>
                <h4 class="block-title">Périphérique de Sortie Audio (setSinkId)</h4>
                <p class="block-sub">Règle la carte son ou le canal virtuel pour les alertes (ex : Elgato Wave Link SFX, Casque, Voicemeeter)</p>
              </div>
            </div>
            <div class="settings-field-row">
              <select
                v-model="localAudioSettings.deviceId"
                class="device-select-global"
              >
                <option v-for="dev in audioDevicesList" :key="dev.deviceId" :value="dev.deviceId">
                  {{ dev.label }}
                </option>
              </select>
              <button class="btn-test-global-audio" :disabled="isPlayingTest" @click="$emit('test-audio')">
                {{ isPlayingTest ? '🔊 Lecture...' : '▶ Tester la sortie' }}
              </button>
            </div>
          </div>

          <!-- 2. Volume et activation sonore -->
          <div class="settings-block">
            <div class="block-header-row">
              <span class="block-icon">🔊</span>
              <div>
                <h4 class="block-title">Volume et Lecture Sonore Globale</h4>
                <p class="block-sub">Contrôlez l'activation et le volume général de notification des succès</p>
              </div>
            </div>
            <div class="settings-volume-controls">
              <label class="toggle-switch">
                <input v-model="localAudioSettings.soundEnabled" type="checkbox" />
                <span class="slider"></span>
                <span class="toggle-text">{{ localAudioSettings.soundEnabled ? 'Sons Activés' : 'Mode Muet' }}</span>
              </label>

              <div class="global-volume-slider-box">
                <span class="volume-pct">{{ Math.round((localAudioSettings.soundVolume || 0.8) * 100) }}%</span>
                <input
                  v-model.number="localAudioSettings.soundVolume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  class="range-slider"
                  :disabled="!localAudioSettings.soundEnabled"
                />
              </div>
            </div>
          </div>

          <!-- 3. Port OBS et Réseau local -->
          <div class="settings-block">
            <div class="block-header-row">
              <span class="block-icon">🔌</span>
              <div>
                <h4 class="block-title">Port du Serveur Web OBS</h4>
                <p class="block-sub">Port utilisé pour la source navigateur OBS (par défaut 8080, bascule automatique si Streamer.bot est actif)</p>
              </div>
            </div>

            <div class="settings-field-row">
              <input
                v-model.number="localPort"
                type="number"
                min="1024"
                max="65535"
                class="key-text-input port-input"
                placeholder="8080"
              />
              <span class="port-status-badge" :class="{ conflict: obsStatus?.hasPortConflict }">
                Port actif : {{ obsStatus?.port || 8080 }}
              </span>
            </div>

            <div class="settings-field-row lan-field-row">
              <label class="custom-checkbox-label">
                <input v-model="localLanBroadcast" type="checkbox" class="styled-checkbox" />
                <span class="checkbox-label-text">Activer la diffusion LAN pour OBS (écoute sur 0.0.0.0)</span>
              </label>
              <p class="field-hint-text">
                🔒 <strong>Sécurité renforcée :</strong> Désactivé par défaut. Activez uniquement si OBS fonctionne sur un second PC dédié au streaming sur votre réseau local.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="statusMessage" class="success-banner">
        <span>{{ statusMessage }}</span>
      </div>

      <div class="modal-actions-footer">
        <button class="btn-secondary" @click="$emit('close')">Fermer</button>
        <button class="btn-save-modal-key" @click="handleSave">
          Enregistrer les Paramètres
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAppUpdater } from '../../composables/useAppUpdater.js'

const {
  isChecking: isCheckingUpdates,
  isDownloading: isDownloadingUpdates,
  statusMessage: updaterStatusMessage,
  errorMessage: updaterError,
  currentAppVersion,
  checkForUpdates
} = useAppUpdater()

function handleCheckUpdates() {
  checkForUpdates(true)
}

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  audioSettings: {
    type: Object,
    default: () => ({
      deviceId: 'default',
      soundEnabled: true,
      soundVolume: 0.8
    })
  },
  audioDevicesList: {
    type: Array,
    default: () => [{ deviceId: 'default', label: 'Périphérique Windows par défaut' }]
  },
  obsStatus: {
    type: Object,
    default: null
  },
  obsPort: {
    type: Number,
    default: 8080
  },
  trackerStatus: {
    type: Object,
    default: null
  },
  isPlayingTest: {
    type: Boolean,
    default: false
  },
  statusMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'save', 'test-audio', 'open-api-key'])

// Onglet actif : 'app' | 'steam' | 'stream'
const activeTab = ref('app')

// Paramètres de l'onglet Application
const localAutostart = ref(false)
const appTheme = ref('dark') // 'dark' | 'light'

// Paramètres de l'onglet Steam
const localPollingInterval = ref(1500)

// Paramètres de l'onglet Streaming
const localAudioSettings = ref({
  deviceId: 'default',
  soundEnabled: true,
  soundVolume: 0.8
})
const localPort = ref(8080)
const localLanBroadcast = ref(false)

function loadLocalAppSettings() {
  if (typeof localStorage !== 'undefined') {
    const savedAutostart = localStorage.getItem('steam_autostart_enabled')
    if (savedAutostart !== null) {
      localAutostart.value = savedAutostart === 'true'
    }

    const savedTheme = localStorage.getItem('steam_app_theme')
    if (savedTheme) {
      setAppTheme(savedTheme)
    }

    const savedPolling = localStorage.getItem('steam_tracker_polling')
    if (savedPolling) {
      localPollingInterval.value = parseInt(savedPolling, 10) || 1500
    }
  }
}

function setAppTheme(theme) {
  appTheme.value = theme
  if (typeof document !== 'undefined') {
    if (theme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('steam_app_theme', theme)
  }
}

onMounted(() => {
  loadLocalAppSettings()
})

watch(
  () => props.audioSettings,
  (val) => {
    if (val) {
      localAudioSettings.value = { ...val }
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.obsPort,
  (val) => {
    localPort.value = val || 8080
  },
  { immediate: true }
)

watch(
  () => props.obsStatus,
  (val) => {
    if (val) {
      localLanBroadcast.value = Boolean(val.lanBroadcastEnabled)
    }
  },
  { immediate: true, deep: true }
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      loadLocalAppSettings()
      if (props.audioSettings) {
        localAudioSettings.value = { ...props.audioSettings }
      }
      localPort.value = props.obsPort || 8080
      localLanBroadcast.value = Boolean(props.obsStatus?.lanBroadcastEnabled)
    }
  }
)

function handleSave() {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('steam_autostart_enabled', String(localAutostart.value))
    localStorage.setItem('steam_tracker_polling', String(localPollingInterval.value))
    localStorage.setItem('steam_app_theme', appTheme.value)
  }

  emit('save', {
    audioSettings: { ...localAudioSettings.value },
    obsPort: localPort.value,
    obsLanBroadcast: localLanBroadcast.value,
    autostart: localAutostart.value,
    pollingInterval: localPollingInterval.value,
    appTheme: appTheme.value
  })
}
</script>

<style scoped>
.api-key-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 1.5rem;
}

.api-key-modal-card {
  background: #171d25;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.85);
  animation: fadeIn 0.25s ease;
}

.general-settings-modal {
  max-width: 640px;
  width: 95vw;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.modal-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.settings-header-icon-glow {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(102, 192, 244, 0.2) 0%, rgba(27, 40, 56, 0.8) 100%);
  border: 1px solid rgba(102, 192, 244, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #66c0f4;
  box-shadow: 0 0 16px rgba(102, 192, 244, 0.25);
}

.settings-icon {
  width: 24px;
  height: 24px;
}

.modal-title-group h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.modal-subtitle-text {
  margin: 0.2rem 0 0 0;
  font-size: 0.78rem;
  color: #8b9bb4;
}

.btn-close-modal {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  line-height: 1;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.btn-close-modal:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Barre d'onglets stricte */
.settings-tabs-nav {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.75rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.settings-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #8b9bb4;
  padding: 0.55rem 0.95rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-tab-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.settings-tab-btn.active {
  background: rgba(102, 192, 244, 0.15);
  border-color: rgba(102, 192, 244, 0.45);
  color: #66c0f4;
  font-weight: 700;
}

.tab-icon {
  font-size: 0.95rem;
}

.tab-content-panel {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.general-settings-body {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 0.35rem;
}

.settings-block {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 1rem 1.15rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.block-header-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.block-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.block-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #fff;
}

.block-sub {
  margin: 0.2rem 0 0 0;
  font-size: 0.74rem;
  color: #8b9bb4;
  line-height: 1.35;
}

.settings-field-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.settings-field-row.justify-between {
  justify-content: space-between;
}

/* Sélecteur de thème d'app */
.theme-choice-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.theme-preset-card {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-preset-card:hover {
  border-color: rgba(102, 192, 244, 0.4);
}

.theme-preset-card.active {
  border-color: #66c0f4;
  background: rgba(102, 192, 244, 0.12);
}

.theme-preview {
  width: 100%;
  height: 28px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.dark-preview {
  background: linear-gradient(135deg, #0b0e14 0%, #171d25 100%);
}

.light-preview {
  background: linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%);
}

.theme-preset-name {
  font-size: 0.76rem;
  font-weight: 600;
  color: #c7d5e0;
}

/* Info Steam */
.steam-path-info-box {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 0.75rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.78rem;
}

.path-line {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.path-label {
  color: #8b9bb4;
  font-size: 0.72rem;
  font-weight: 600;
}

.path-val {
  color: #fff;
  font-family: monospace;
  font-size: 0.75rem;
  word-break: break-all;
}

.watched-files-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.25rem;
}

.file-chip {
  background: rgba(102, 192, 244, 0.1);
  border: 1px solid rgba(102, 192, 244, 0.25);
  color: #66c0f4;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-family: monospace;
  font-size: 0.72rem;
}

.status-tip {
  font-size: 0.73rem;
  color: #8b9bb4;
}

.api-key-status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f0c330;
}

.badge-dot.green {
  background: #a1cd44;
  box-shadow: 0 0 8px rgba(161, 205, 68, 0.5);
}

.api-key-text {
  font-size: 0.82rem;
  color: #fff;
}

.btn-manage-api-key {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #c7d5e0;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-manage-api-key:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.device-select-global {
  flex: 1;
  background: rgba(16, 24, 34, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0.55rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  outline: none;
}

.device-select-global:focus {
  border-color: #66c0f4;
}

.btn-test-global-audio {
  background: rgba(102, 192, 244, 0.15);
  border: 1px solid rgba(102, 192, 244, 0.4);
  color: #66c0f4;
  padding: 0.55rem 0.95rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.btn-test-global-audio:hover:not(:disabled) {
  background: rgba(102, 192, 244, 0.28);
  box-shadow: 0 0 12px rgba(102, 192, 244, 0.3);
}

.settings-volume-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.toggle-switch {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  position: relative;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.slider {
  width: 38px;
  height: 22px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 34px;
  position: relative;
  transition: 0.3s;
}

.slider::before {
  content: "";
  position: absolute;
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
}

input:checked + .slider {
  background-color: #a1cd44;
}

input:checked + .slider::before {
  transform: translateX(16px);
}

.toggle-text {
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
}

.global-volume-slider-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 200px;
}

.volume-pct {
  font-size: 0.82rem;
  font-weight: 700;
  color: #f0c330;
  min-width: 42px;
}

.range-slider {
  flex: 1;
  accent-color: #66c0f4;
}

.key-text-input {
  background: rgba(15, 21, 29, 0.9);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.55rem 0.85rem;
  color: #fff;
  font-family: monospace;
  font-size: 0.85rem;
}

.key-text-input:focus {
  outline: none;
  border-color: #66c0f4;
}

.port-input {
  width: 140px;
}

.port-status-badge {
  font-size: 0.76rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  color: #9cb3ce;
}

.port-status-badge.conflict {
  border-color: #f0c330;
  color: #ffd644;
}

.lan-field-row {
  margin-top: 0.5rem;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}

.custom-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  user-select: none;
}

.styled-checkbox {
  width: 17px;
  height: 17px;
  cursor: pointer;
  accent-color: #66c0f4;
}

.checkbox-label-text {
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--steam-text-main, #c6d4df);
}

.field-hint-text {
  font-size: 0.76rem;
  color: #8b9bb4;
  line-height: 1.4;
  margin: 0;
  padding-left: 1.6rem;
}

.field-hint-text strong {
  color: #f0c330;
}

.success-banner {
  background: rgba(92, 126, 16, 0.25);
  border: 1px solid rgba(161, 205, 68, 0.5);
  color: #c7eb74;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-top: 1rem;
}

.modal-actions-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 1rem;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  color: var(--steam-text-main);
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-save-modal-key {
  background: linear-gradient(135deg, #66c0f4 0%, #1999e3 100%);
  border: none;
  color: #fff;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(102, 192, 244, 0.3);
}

.btn-save-modal-key:hover {
  background: linear-gradient(135deg, #7ad0ff 0%, #20a7f5 100%);
}

.updater-field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.updater-status-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.current-version-text {
  font-size: 0.85rem;
  color: var(--steam-text-main);
}

.current-version-text strong {
  color: #66c0f4;
}

.updater-status-badge {
  font-size: 0.75rem;
  color: #a1cd44;
}

.updater-status-badge.error {
  color: #ff6b6b;
}

.btn-check-updates {
  background: rgba(102, 192, 244, 0.12);
  border: 1px solid rgba(102, 192, 244, 0.35);
  color: #66c0f4;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-check-updates:hover:not(:disabled) {
  background: rgba(102, 192, 244, 0.22);
  border-color: #66c0f4;
  transform: translateY(-1px);
}

.btn-check-updates:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
