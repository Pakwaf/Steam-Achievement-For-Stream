<template>
  <div class="dashboard-page">
    <!-- 1. Pop-up Overlay Toast de Succès (Notification animée dans le dashboard) -->
    <AchievementToast
      :notification="activeNotification"
      :fallback-icon="fallbackIcon"
      @dismiss="dismissToast"
      @icon-error="onIconError"
    />

    <!-- 2. Barre supérieure de navigation / En-tête -->
    <AppHeader
      :tracker-status="trackerStatus"
      :current-user="currentUser"
      @open-settings="openGeneralSettingsModal"
    />

    <!-- Contenu principal -->
    <main class="main-content">
      <!-- Alerte si ouvert dans un navigateur standard au lieu de l'application -->
      <div v-if="!isElectron" class="browser-warning-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warning-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div class="warning-text">
          <strong>Application ouverte dans un navigateur web standard.</strong>
          <p>L'application principale tourne sur le bureau. La source OBS est disponible sur <code>http://localhost:8080/obs</code>.</p>
        </div>
      </div>

      <!-- Écran de chargement initial (restauration de la session locale en cours) -->
      <div v-if="isInitializing" class="session-loading-splash">
        <div class="splash-spinner"></div>
        <p class="splash-title">Chargement de votre session Steam...</p>
        <span class="splash-subtitle">Vérification de votre configuration locale</span>
      </div>

      <!-- État 1 : Utilisateur non connecté (Configuration Clé API puis Connexion) -->
      <AuthSection
        v-else-if="!currentUser"
        v-model:auth-step="authStep"
        v-model:steam-api-key="steamApiKey"
        :is-saving-key="isSavingKey"
        :key-saved-message="keySavedMessage"
        :is-loading="isLoading"
        :error-message="errorMessage"
        @save-api-key="handleSaveApiKey"
        @skip-api-key="skipApiKeySetup"
        @login="handleLogin"
      />

      <!-- État 2 : Utilisateur connecté -->
      <section v-else class="dashboard-section">
        <!-- VUE A : Éditeur Custom Expert (Pleine page) -->
        <div v-if="currentView === 'editor'" class="editor-view-wrapper full-page-view">
          <CustomizationEditor
            :target-theme="editingTheme"
            :is-active-theme="editingTheme?.id === themeLibrary.activeThemeId"
            @back="closeEditor"
            @saved="onEditorThemeSaved"
            @activate="handleActivateTheme"
          />
        </div>

        <!-- VUE B : Générateur Visuel Rapide (Pleine page) -->
        <div v-else-if="currentView === 'quick-builder'" class="editor-view-wrapper full-page-view">
          <QuickThemeBuilder
            @back="closeQuickBuilder"
            @saved="onQuickThemeSaved"
          />
        </div>

        <!-- VUE C : Page d'accueil Dashboard (Profil, OBS, Galerie, Tracker & Historique) -->
        <div v-else class="dashboard-home-wrapper">
          <!-- 3. Carte Profil Utilisateur -->
          <ProfileCard
            :current-user="currentUser"
            :copied="copied"
            :fallback-icon="fallbackIcon"
            @copy-steam-id="copySteamId"
            @open-api-key-modal="openApiKeyModal"
            @open-steam-profile="openSteamProfile"
            @logout="handleLogout"
          />

          <!-- 4. Panneau de Double Affichage (Overlay Desktop & OBS) -->
          <DisplaySystemsCard
            :obs-status="obsStatus"
            :obs-url="obsUrl"
            :obs-copied="obsCopied"
            :obs-lan-copied="obsLanCopied"
            :obs-localhost-copied="obsLocalhostCopied"
            @open-port-modal="openPortModal"
            @copy-obs-url="copyObsUrl"
            @copy-obs-url-lan="copyObsUrlLan"
            @copy-obs-url-localhost="copyObsUrlLocalhost"
            @open-obs-in-browser="openObsInBrowser"
            @open-obs-lan-in-browser="openObsLanInBrowser"
          />

          <!-- 5. Bibliothèque de Thèmes & Galerie Studio -->
          <ThemeStudioGallery
            :theme-library="themeLibrary"
            :status-message="libraryStatusMessage"
            @activate-theme="handleActivateTheme"
            @edit-theme="handleEditTheme"
            @duplicate-theme="handleDuplicateTheme"
            @delete-theme="handleDeleteTheme"
            @restore-default-themes="handleRestoreDefaultThemes"
            @export-theme="handleExportTheme"
            @export-library="handleExportLibrary"
            @import-theme-file="handleThemeFileImport"
            @create-new-theme="handleCreateNewThemeClick"
          />

          <!-- 6. Panneau de Contrôle & Diagnostic du Tracker -->
          <TrackerCard
            :tracker-status="trackerStatus"
            :is-simulating="isSimulating"
            @trigger-tier-test="triggerDashboardTierTest"
          />

          <!-- 7. Historique des succès de la session -->
          <AchievementHistory
            :unlocked-history="unlockedHistory"
            :fallback-icon="fallbackIcon"
            @clear-history="unlockedHistory = []"
          />
        </div>
      </section>

      <!-- 8. Modals modulaires -->
      <ApiKeyModal
        :is-open="showApiKeyModal"
        :api-key="modalApiKey"
        @close="closeApiKeyModal"
        @save="saveApiKeyFromModal"
      />

      <PortModal
        :is-open="showPortModal"
        :port="modalPortValue"
        :is-saving="isSavingPort"
        :status-message="portModalMessage"
        @close="closePortModal"
        @save="saveCustomPort"
      />

      <GeneralSettingsModal
        :is-open="showGeneralSettingsModal"
        :audio-settings="globalAudioSettings"
        :audio-devices-list="audioDevicesList"
        :obs-status="obsStatus"
        :obs-port="modalPortValue"
        :tracker-status="trackerStatus"
        :isPlayingTest="isPlayingGlobalTest"
        :status-message="generalSettingsMessage"
        @close="closeGeneralSettingsModal"
        @test-audio="testGlobalAudioOutput"
        @open-api-key="openApiKeyModal"
        @save="saveGeneralSettings"
      />

      <!-- 9. Modal de mise à jour automatique -->
      <UpdateModal
        :is-open="showUpdateModal"
        :update-info="updateInfo"
        :is-checking="isCheckingUpdates"
        :is-downloading="isDownloadingUpdates"
        :is-update-ready="isUpdateReady"
        :download-progress="downloadProgress"
        :downloaded-bytes="downloadedBytes"
        :total-bytes="totalBytes"
        :status-message="updaterStatusMessage"
        :error-message="updaterErrorMessage"
        @close="closeUpdateModal"
        @install="downloadAndInstall"
      />

      <!-- 10. Modal de choix de création de thème (Mode Rapide vs Mode Custom) -->
      <CreateThemeChoiceModal
        :is-open="showCreateChoiceModal"
        @close="closeCreateChoiceModal"
        @select-quick="selectQuickBuilder"
        @select-custom="selectCustomEditor"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'

// Composants synchrones de base du Dashboard
import AchievementToast from '../components/dashboard/AchievementToast.vue'
import AppHeader from '../components/dashboard/AppHeader.vue'
import AuthSection from '../components/dashboard/AuthSection.vue'
import ProfileCard from '../components/dashboard/ProfileCard.vue'
import DisplaySystemsCard from '../components/dashboard/DisplaySystemsCard.vue'
import TrackerCard from '../components/dashboard/TrackerCard.vue'
import AchievementHistory from '../components/dashboard/AchievementHistory.vue'
import ThemeStudioGallery from '../components/studio/ThemeStudioGallery.vue'

// Composants asynchrones chargés à la demande (Lazy Loading pour réduire le bundle)
const CustomizationEditor = defineAsyncComponent(() => import('../components/CustomizationEditor.vue'))
const QuickThemeBuilder = defineAsyncComponent(() => import('../components/studio/QuickThemeBuilder.vue'))
const CreateThemeChoiceModal = defineAsyncComponent(() => import('../components/modals/CreateThemeChoiceModal.vue'))
const ApiKeyModal = defineAsyncComponent(() => import('../components/modals/ApiKeyModal.vue'))
const PortModal = defineAsyncComponent(() => import('../components/modals/PortModal.vue'))
const GeneralSettingsModal = defineAsyncComponent(() => import('../components/modals/GeneralSettingsModal.vue'))
const UpdateModal = defineAsyncComponent(() => import('../components/modals/UpdateModal.vue'))

// Composables métier isolés
import { useSteamTracker } from '../composables/useSteamTracker.js'
import { useObsManager } from '../composables/useObsManager.js'
import { useThemeLibrary } from '../composables/useThemeLibrary.js'
import {
  useAudioEngine,
  getGlobalAudioSettings
} from '../composables/useAudioEngine.js'
import { useAppUpdater } from '../composables/useAppUpdater.js'

// Constantes & Services
import { steamAPI } from '../services/steamApi.js'
import { STORAGE_KEYS, ACHIEVEMENT_TIERS_KEYS } from '../constants/index.js'

const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'
const isElectron = ref(typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__ || window.steamAPI))

// --- 1. Logique Tracker Steam & Authentification ---
const {
  isInitializing,
  currentUser,
  isLoading,
  errorMessage,
  authStep,
  steamApiKey,
  isSavingKey,
  keySavedMessage,
  trackerStatus,
  activeNotification,
  unlockedHistory,
  isSimulating,
  handleSaveApiKey,
  skipApiKeySetup,
  handleLogin,
  handleLogout,
  triggerDashboardTierTest,
  dismissToast
} = useSteamTracker()

// --- 2. Logique Serveur OBS & Ports ---
const {
  obsStatus,
  obsUrl,
  obsCopied,
  obsLanCopied,
  obsLocalhostCopied,
  showPortModal,
  modalPortValue,
  portModalMessage,
  isSavingPort,
  copyObsUrl,
  copyObsUrlLocalhost,
  copyObsUrlLan,
  openObsInBrowser,
  openObsLanInBrowser,
  openPortModal,
  closePortModal,
  saveCustomPort
} = useObsManager()

// --- 3. Logique Bibliothèque de Thèmes & Galerie Studio ---
const {
  currentView,
  editingTheme,
  themeLibrary,
  libraryStatusMessage,
  handleActivateTheme,
  handleEditTheme,
  handleDuplicateTheme,
  handleDeleteTheme,
  handleRestoreDefaultThemes,
  handleThemeFileImport,
  handleExportTheme,
  handleExportLibrary,
  handleCreateNewTheme,
  showCreateChoiceModal,
  handleCreateNewThemeClick,
  closeCreateChoiceModal,
  selectQuickBuilder,
  selectCustomEditor,
  closeQuickBuilder,
  onQuickThemeSaved,
  closeEditor,
  onEditorThemeSaved
} = useThemeLibrary()

// --- 4. Logique Moteur Audio Global & Périphériques ---
const {
  audioDevices: audioDevicesList,
  refreshAudioDevices,
  playChime,
  updateGlobalAudio
} = useAudioEngine()

// --- 5. Logique Auto-Updater Tauri v2 ---
const {
  updateInfo,
  isChecking: isCheckingUpdates,
  isDownloading: isDownloadingUpdates,
  isUpdateReady,
  downloadProgress,
  downloadedBytes,
  totalBytes,
  statusMessage: updaterStatusMessage,
  errorMessage: updaterErrorMessage,
  showUpdateModal,
  checkForUpdates,
  downloadAndInstall,
  closeUpdateModal
} = useAppUpdater()

onMounted(() => {
  // Recherche automatique silencieuse au démarrage
  checkForUpdates(false)
})

const showGeneralSettingsModal = ref(false)
const generalSettingsMessage = ref('')
const isPlayingGlobalTest = ref(false)
const globalAudioSettings = ref(getGlobalAudioSettings())

async function openGeneralSettingsModal() {
  showGeneralSettingsModal.value = true
  generalSettingsMessage.value = ''
  await refreshAudioDevices(true)
}

function closeGeneralSettingsModal() {
  showGeneralSettingsModal.value = false
  generalSettingsMessage.value = ''
}

async function testGlobalAudioOutput() {
  if (isPlayingGlobalTest.value) return
  isPlayingGlobalTest.value = true
  try {
    await playChime(ACHIEVEMENT_TIERS_KEYS.COMMON)
  } finally {
    setTimeout(() => {
      isPlayingGlobalTest.value = false
    }, 850)
  }
}

async function saveGeneralSettings({ audioSettings, obsPort, obsLanBroadcast }) {
  try {
    updateGlobalAudio(audioSettings)
    globalAudioSettings.value = { ...audioSettings }
    modalPortValue.value = obsPort

    await steamAPI.saveAppSettings({
      obsPort: obsPort || 8080,
      obsLanBroadcast: Boolean(obsLanBroadcast),
      soundEnabled: audioSettings.soundEnabled,
      soundVolume: audioSettings.soundVolume,
      audioDeviceId: audioSettings.deviceId,
      desktopOverlayEnabled: true
    })

    // Rafraîchir l'état OBS pour refléter le changement LAN éventuel
    const updatedObs = await steamAPI.getObsStatus().catch(() => null)
    if (updatedObs) {
      obsStatus.value = updatedObs
    }

    generalSettingsMessage.value = 'Paramètres généraux enregistrés ✔'
    setTimeout(() => {
      closeGeneralSettingsModal()
    }, 1100)
  } catch (err) {
    generalSettingsMessage.value = `Erreur : ${err.message}`
  }
}

// --- 5. Actions Profil & Clé API Modal ---
const copied = ref(false)
const showApiKeyModal = ref(false)
const modalApiKey = ref('')

function openApiKeyModal() {
  modalApiKey.value = steamApiKey.value || ''
  showApiKeyModal.value = true
}

function closeApiKeyModal() {
  showApiKeyModal.value = false
}

async function saveApiKeyFromModal(newKey) {
  steamApiKey.value = newKey
  await steamAPI.saveSteamApiKey(newKey)
  showApiKeyModal.value = false
}

function openSteamProfile() {
  if (currentUser.value?.profileUrl) {
    steamAPI.openExternal(currentUser.value.profileUrl)
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

function onIconError(e) {
  e.target.src = fallbackIcon
}
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

.main-content {
  flex: 1;
  max-width: 1040px;
  width: 100%;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}

.browser-warning-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(235, 87, 87, 0.12);
  border: 1px solid rgba(235, 87, 87, 0.4);
  border-radius: 12px;
  margin-bottom: 2rem;
  color: #ff9494;
  font-size: 0.85rem;
}

.warning-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.session-loading-splash {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
}

.splash-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255, 255, 255, 0.15);
  border-top-color: #66c0f4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.splash-title {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.splash-subtitle {
  color: var(--steam-text-muted);
  font-size: 0.82rem;
}

.editor-view-wrapper {
  animation: fadeIn 0.3s ease-out;
  margin-bottom: 2rem;
}

.full-page-view {
  width: 100%;
}

.dashboard-home-wrapper {
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
