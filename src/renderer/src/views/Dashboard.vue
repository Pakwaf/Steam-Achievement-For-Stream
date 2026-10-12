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

        <!-- 5. Bibliothèque de Thèmes & Éditeur Modulaire -->
        <div v-if="currentView === 'editor'" class="editor-view-wrapper">
          <CustomizationEditor
            :target-theme="editingTheme"
            :is-active-theme="editingTheme?.id === themeLibrary.activeThemeId"
            @back="closeEditor"
            @saved="onEditorThemeSaved"
            @activate="handleActivateTheme"
          />
        </div>

        <ThemeStudioGallery
          v-else
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
          @create-new-theme="handleCreateNewTheme"
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
        :is-playing-test="isPlayingGlobalTest"
        :status-message="generalSettingsMessage"
        @close="closeGeneralSettingsModal"
        @test-audio="testGlobalAudioOutput"
        @save="saveGeneralSettings"
      />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import CustomizationEditor from '../components/CustomizationEditor.vue'
import AchievementToast from '../components/dashboard/AchievementToast.vue'
import AppHeader from '../components/dashboard/AppHeader.vue'
import AuthSection from '../components/dashboard/AuthSection.vue'
import ProfileCard from '../components/dashboard/ProfileCard.vue'
import DisplaySystemsCard from '../components/dashboard/DisplaySystemsCard.vue'
import TrackerCard from '../components/dashboard/TrackerCard.vue'
import AchievementHistory from '../components/dashboard/AchievementHistory.vue'
import ThemeStudioGallery from '../components/studio/ThemeStudioGallery.vue'
import ApiKeyModal from '../components/modals/ApiKeyModal.vue'
import PortModal from '../components/modals/PortModal.vue'
import GeneralSettingsModal from '../components/modals/GeneralSettingsModal.vue'

import {
  playAchievementSound,
  playSynthesizedChime,
  getAudioOutputDevices,
  getGlobalAudioSettings,
  setGlobalAudioSettings
} from '../utils/soundPlayer.js'
import { themeStorage } from '../services/themeStorage.js'
import { ACHIEVEMENT_TIERS } from '../utils/visualEffects.js'

const isInitializing = ref(true)
const currentUser = ref(null)
const isLoading = ref(false)
const errorMessage = ref(null)
const copied = ref(false)
const obsCopied = ref(false)
const obsLanCopied = ref(false)
const obsLocalhostCopied = ref(false)
const isElectron = ref(typeof window !== 'undefined' && !!window.steamAPI)

// Authentification et configuration Clé Steam API
const authStep = ref('apikey') // 'apikey' | 'login'
const steamApiKey = ref('')
const isSavingKey = ref(false)
const keySavedMessage = ref('')
const showApiKeyModal = ref(false)
const modalApiKey = ref('')

// Configuration Port OBS & Préférences
const showPortModal = ref(false)
const modalPortValue = ref(8080)
const portModalMessage = ref('')
const isSavingPort = ref(false)
const appSettings = ref({
  obsPort: 8080,
  soundEnabled: true,
  soundVolume: 0.8,
  desktopOverlayEnabled: true
})

// État du tracker, de l'OBS et des succès
const trackerStatus = ref(null)
const obsStatus = ref({
  isRunning: true,
  port: 8080,
  preferredPort: 8080,
  hasPortConflict: false,
  connectedClients: 0,
  obsUrl: 'http://127.0.0.1:8080/obs',
  obsUrlLocalhost: 'http://localhost:8080/obs',
  obsUrlLan: null
})
const obsUrl = ref('http://127.0.0.1:8080/obs')
const activeNotification = ref(null)
const unlockedHistory = ref([])
const isSimulating = ref(false)
let toastTimer = null
let obsPollInterval = null

// Paramètres généraux et Audio global
const showGeneralSettingsModal = ref(false)
const generalSettingsMessage = ref('')
const isPlayingGlobalTest = ref(false)
const audioDevicesList = ref([{ deviceId: 'default', label: 'Périphérique Windows par défaut' }])
const globalAudioSettings = ref(getGlobalAudioSettings())

// État de la Galerie de Thèmes (Studio)
const currentView = ref('library') // 'library' | 'editor'
const editingTheme = ref(null)
const themeLibrary = ref({ activeThemeId: '', deletedThemeIds: [], themes: [] })
const libraryStatusMessage = ref('')

const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg'

// Initialisation au montage
onMounted(async () => {
  isElectron.value = typeof window !== 'undefined' && !!window.steamAPI
  if (window.steamAPI) {
    try {
      // 0. Récupération parallèle instantanée de la clé Steam API et de l'utilisateur sauvegardé
      const [keyRes, userRes] = await Promise.all([
        window.steamAPI.getSteamApiKey ? window.steamAPI.getSteamApiKey().catch(() => ({ apiKey: '' })) : Promise.resolve({ apiKey: '' }),
        window.steamAPI.getCurrentUser ? window.steamAPI.getCurrentUser().catch(() => null) : Promise.resolve(null)
      ])

      // Restauration de la clé API
      let rawKey = typeof keyRes === 'string' ? keyRes : (keyRes?.apiKey || '')
      if (!rawKey && typeof localStorage !== 'undefined') {
        rawKey = localStorage.getItem('steam_api_key') || ''
      }
      const trimmedKey = (rawKey || '').trim()
      if (trimmedKey && trimmedKey.length >= 8) {
        steamApiKey.value = trimmedKey
        authStep.value = 'login'
      } else {
        steamApiKey.value = ''
        authStep.value = 'apikey'
      }

      // Restauration de l'utilisateur connecté
      let user = userRes
      if (!user && typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem('steam_user')
          if (stored) user = JSON.parse(stored)
        } catch {
          // ignore
        }
      }
      if (user) {
        currentUser.value = user
      }

      // Statut du tracker de log
      const status = await window.steamAPI.getTrackerStatus()
      trackerStatus.value = status

      // Statut initial du serveur OBS
      if (window.steamAPI.getObsStatus) {
        const obs = await window.steamAPI.getObsStatus()
        if (obs) {
          obsStatus.value = obs
          if (obs.obsUrl) obsUrl.value = obs.obsUrl
        }
      }

      // Chargement des paramètres d'application
      if (window.steamAPI.getAppSettings) {
        try {
          const s = await window.steamAPI.getAppSettings()
          if (s) {
            appSettings.value = { ...appSettings.value, ...s }
            modalPortValue.value = s.obsPort || 8080
          }
        } catch (e) {
          console.warn('[Dashboard] Erreur chargement settings:', e)
        }
      }

      // Chargement de la bibliothèque de thèmes modulaires
      await fetchThemeLibrary()
    } catch (err) {
      console.error('Erreur initialisation dashboard:', err)
    } finally {
      isInitializing.value = false
    }

    // Écoute des mises à jour d'authentification
    if (window.steamAPI.onAuthStatusChanged) {
      window.steamAPI.onAuthStatusChanged((user) => {
        currentUser.value = user
      })
    }

    // Écoute des modifications de la bibliothèque de thèmes en temps réel
    if (window.steamAPI.onThemeLibraryUpdated) {
      window.steamAPI.onThemeLibraryUpdated((lib) => {
        if (lib) {
          themeLibrary.value = lib
        }
      })
    }

    // Écoute des succès débloqués en temps réel
    window.steamAPI.onAchievementUnlocked(async (achievement) => {
      if (achievement?.isTest) return

      triggerAchievementToast(achievement)
      try {
        let theme = null
        if (achievement.previewTheme) {
          theme = achievement.previewTheme
        } else if (window.steamAPI?.getActiveTheme) {
          theme = await window.steamAPI.getActiveTheme()
        } else if (window.steamAPI?.getCustomization) {
          theme = await window.steamAPI.getCustomization()
        }
        await playAchievementSound(theme || {})
      } catch (err) {
        console.warn('[Dashboard] Erreur lecture audio succès:', err)
      }
    })

    // Écoute en temps réel des connexions/déconnexions de sources OBS
    if (window.steamAPI.onObsStatusChanged) {
      window.steamAPI.onObsStatusChanged((obs) => {
        if (obs) {
          obsStatus.value = obs
          if (obs.obsUrl) obsUrl.value = obs.obsUrl
        }
      })
    }

    // Polling de secours toutes les 2.5 secondes
    obsPollInterval = setInterval(async () => {
      if (window.steamAPI?.getObsStatus) {
        try {
          const obs = await window.steamAPI.getObsStatus()
          if (obs) obsStatus.value = obs
        } catch {
          // ignore
        }
      }

      if (window.steamAPI?.getTrackerStatus) {
        try {
          const st = await window.steamAPI.getTrackerStatus()
          if (st) trackerStatus.value = st
        } catch {
          // ignore
        }
      }
    }, 2500)
  }
})

// Récupération de la bibliothèque complète
async function fetchThemeLibrary() {
  if (window.steamAPI?.getThemeLibrary) {
    try {
      const lib = await window.steamAPI.getThemeLibrary()
      if (lib) {
        themeLibrary.value = lib
      }
    } catch (err) {
      console.error('Erreur chargement bibliothèque de thèmes:', err)
    }
  }
}

// Active un thème pour les overlays
async function handleActivateTheme(themeId) {
  if (!window.steamAPI?.setActiveTheme) return
  try {
    const res = await window.steamAPI.setActiveTheme(themeId)
    if (res.success) {
      themeLibrary.value = res.library
      showLibraryStatus(`Thème "${res.activeTheme?.name}" activé pour vos overlays ! ⚡`)
    }
  } catch (err) {
    console.error('Erreur activation thème:', err)
  }
}

// Ouvre l'éditeur pour ce thème précis
function handleEditTheme(theme) {
  editingTheme.value = JSON.parse(JSON.stringify(theme))
  currentView.value = 'editor'
}

// Crée une copie exacte d'un thème
async function handleDuplicateTheme(themeId) {
  if (!window.steamAPI?.duplicateTheme) return
  try {
    const res = await window.steamAPI.duplicateTheme(themeId)
    if (res.success) {
      themeLibrary.value = res.library
      showLibraryStatus(`Copie créée : "${res.duplicatedTheme?.name}" ✔`)
    }
  } catch (err) {
    console.error('Erreur duplication thème:', err)
  }
}

// Supprime un thème avec confirmation
async function handleDeleteTheme(theme) {
  if (themeLibrary.value.themes.length <= 1) {
    alert('Impossible de supprimer le seul thème restant dans la bibliothèque.')
    return
  }

  const confirmMsg = `Êtes-vous sûr de vouloir supprimer définitivement le thème "${theme.name}" ?`
  if (!confirm(confirmMsg)) return

  if (!window.steamAPI?.deleteTheme) return
  try {
    const res = await window.steamAPI.deleteTheme(theme.id)
    if (res.success) {
      themeLibrary.value = res.library
      showLibraryStatus(`Thème "${theme.name}" supprimé ✔`)
    } else if (res.error) {
      alert(res.error)
    }
  } catch (err) {
    console.error('Erreur suppression thème:', err)
  }
}

// Restaure tous les thèmes officiels par défaut
async function handleRestoreDefaultThemes() {
  if (!confirm('Voulez-vous restaurer tous les thèmes officiels par défaut (Steam Gold, Cozy Pixel, Horror, Dark Fantasy, Frutiger Aero) ? Vos thèmes créés seront conservés.')) return

  try {
    if (window.steamAPI?.restoreDefaultThemes) {
      const res = await window.steamAPI.restoreDefaultThemes()
      if (res.success) {
        themeLibrary.value = res.library
        showLibraryStatus('Thèmes officiels par défaut restaurés avec succès ✔')
      }
    }
  } catch (err) {
    console.error('Erreur restauration thèmes:', err)
  }
}

// Import / Export de thèmes
async function handleThemeFileImport(file) {
  if (!file) return
  try {
    const text = await file.text()
    const res = await themeStorage.importTheme(text)
    if (res.success) {
      themeLibrary.value = res.library
      showLibraryStatus(`Thème "${res.importedTheme?.name}" importé avec succès ! 🎉`)
    } else {
      alert(res.error || 'Erreur lors de l\'importation du fichier')
    }
  } catch (err) {
    alert(`Erreur de lecture du fichier : ${err.message}`)
  }
}

async function handleExportTheme(themeId) {
  try {
    const res = await themeStorage.exportTheme(themeId)
    if (res.success) {
      showLibraryStatus(`Thème exporté dans ${res.fileName} 💾`)
    } else {
      showLibraryStatus(res.error || 'Erreur lors de l\'export')
    }
  } catch (err) {
    showLibraryStatus('Erreur export: ' + err.message)
  }
}

async function handleExportLibrary() {
  try {
    const res = await themeStorage.exportLibrary()
    if (res.success) {
      showLibraryStatus(`${res.count} thèmes sauvegardés dans ${res.fileName} 💾`)
    } else {
      showLibraryStatus(res.error || 'Erreur lors de la sauvegarde de la bibliothèque')
    }
  } catch (err) {
    showLibraryStatus('Erreur export: ' + err.message)
  }
}

// Paramètres Généraux & Audio
async function openGeneralSettingsModal() {
  showGeneralSettingsModal.value = true
  generalSettingsMessage.value = ''
  await refreshGlobalAudioDevices()
}

function closeGeneralSettingsModal() {
  showGeneralSettingsModal.value = false
  generalSettingsMessage.value = ''
}

async function refreshGlobalAudioDevices() {
  try {
    const devs = await getAudioOutputDevices(true)
    if (devs && devs.length > 0) {
      audioDevicesList.value = devs
    }
  } catch (err) {
    console.warn('[Dashboard] refreshGlobalAudioDevices error:', err)
  }
}

async function testGlobalAudioOutput() {
  if (isPlayingGlobalTest.value) return
  isPlayingGlobalTest.value = true
  try {
    await playSynthesizedChime(
      globalAudioSettings.value.soundVolume,
      globalAudioSettings.value.deviceId,
      'common'
    )
  } catch (err) {
    console.error('[Dashboard] Erreur test audio global:', err)
  } finally {
    setTimeout(() => {
      isPlayingGlobalTest.value = false
    }, 850)
  }
}

async function saveGeneralSettings({ audioSettings, obsPort }) {
  try {
    // 1. Mise à jour de la configuration globale locale
    setGlobalAudioSettings(audioSettings)
    globalAudioSettings.value = { ...audioSettings }
    modalPortValue.value = obsPort

    // 2. Persistance dans le backend AppSettings
    const newSettings = {
      obsPort: obsPort || 8080,
      soundEnabled: audioSettings.soundEnabled,
      soundVolume: audioSettings.soundVolume,
      audioDeviceId: audioSettings.deviceId,
      desktopOverlayEnabled: appSettings.value.desktopOverlayEnabled ?? true
    }

    if (window.steamAPI?.saveAppSettings) {
      await window.steamAPI.saveAppSettings(newSettings)
    }

    generalSettingsMessage.value = 'Paramètres généraux enregistrés ✔'
    setTimeout(() => {
      closeGeneralSettingsModal()
    }, 1100)
  } catch (err) {
    generalSettingsMessage.value = `Erreur : ${err.message}`
  }
}

// Simulation & Tests par Tier
async function triggerDashboardTierTest(tier = 'common') {
  if (isSimulating.value) return
  isSimulating.value = true

  const meta = ACHIEVEMENT_TIERS[tier] || ACHIEVEMENT_TIERS.common

  // 1. Jouer immédiatement le son avec la tonalité / carillon du Tier dans l'app
  let activeThm = null
  if (window.steamAPI?.getActiveTheme) {
    activeThm = await window.steamAPI.getActiveTheme().catch(() => null)
  }
  playAchievementSound(activeThm || {}, tier)

  // 2. Diffuser l'alerte de test complète vers DesktopOverlay et OBS
  try {
    if (window.steamAPI?.broadcastTestAchievement) {
      await window.steamAPI.broadcastTestAchievement({
        appId: tier === 'rare' ? '550' : (tier === 'master' ? '1794680' : '440'),
        achievementCode: tier === 'rare' ? 'ACH_FINISH_CAMPAIGN_MELEE_ONLY' : (tier === 'master' ? '100_PERCENT_MASTER' : 'TF_PLAY_GAME_EVERYCLASS'),
        displayName: meta.defaultTitle,
        description: meta.defaultDesc,
        gameName: meta.defaultGame,
        icon: meta.icon,
        tier: tier,
        rarityPercent: meta.defaultPercent,
        isTest: false
      })
      showLibraryStatus(`Simulation de test "${meta.name}" diffusée ! 🚀`)
    }
  } catch (err) {
    console.error('[Dashboard] Erreur simulation tier:', err)
  } finally {
    setTimeout(() => {
      isSimulating.value = false
    }, 1200)
  }
}

// Crée un nouveau thème et ouvre l'éditeur
async function handleCreateNewTheme() {
  if (!window.steamAPI?.createTheme) return
  try {
    const defaultName = `Nouveau Thème (${themeLibrary.value.themes.length + 1})`
    const res = await window.steamAPI.createTheme({ name: defaultName })
    if (res.success) {
      themeLibrary.value = res.library
      editingTheme.value = res.theme
      currentView.value = 'editor'
      showLibraryStatus(`Nouveau thème créé : "${res.theme.name}" !`)
    }
  } catch (err) {
    console.error('Erreur création thème:', err)
  }
}

// Navigation éditeur
function closeEditor() {
  currentView.value = 'library'
  editingTheme.value = null
  fetchThemeLibrary()
}

function onEditorThemeSaved(savedTheme) {
  if (savedTheme) {
    const idx = themeLibrary.value.themes.findIndex((t) => t.id === savedTheme.id)
    if (idx !== -1) {
      themeLibrary.value.themes[idx] = savedTheme
    }
  }
  fetchThemeLibrary()
}

function showLibraryStatus(msg) {
  libraryStatusMessage.value = msg
  setTimeout(() => {
    if (libraryStatusMessage.value === msg) libraryStatusMessage.value = ''
  }, 4000)
}

onUnmounted(() => {
  if (obsPollInterval) clearInterval(obsPollInterval)
  if (toastTimer) clearTimeout(toastTimer)
})

function triggerAchievementToast(achievement) {
  activeNotification.value = achievement
  unlockedHistory.value.unshift(achievement)

  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    activeNotification.value = null
  }, 5000)
}

function dismissToast() {
  if (toastTimer) clearTimeout(toastTimer)
  activeNotification.value = null
}

// Auth methods
async function handleSaveApiKey() {
  if (isSavingKey.value) return
  isSavingKey.value = true
  try {
    const keyToSave = typeof steamApiKey.value === 'string' ? steamApiKey.value.trim() : ''
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('steam_api_key', keyToSave)
    }
    if (window.steamAPI?.saveSteamApiKey) {
      await window.steamAPI.saveSteamApiKey(keyToSave)
    }
    keySavedMessage.value = 'Clé API enregistrée avec succès ! Redirection...'
    setTimeout(() => {
      keySavedMessage.value = ''
      authStep.value = 'login'
    }, 750)
  } catch (err) {
    console.error('[Dashboard] Erreur enregistrement clé Steam API:', err)
  } finally {
    isSavingKey.value = false
  }
}

function skipApiKeySetup() {
  authStep.value = 'login'
}

async function handleLogin() {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = null

  try {
    if (!window.steamAPI) {
      throw new Error("L'API Steam n'est pas disponible dans un navigateur standard. Veuillez utiliser la fenêtre de l'application de bureau.")
    }

    const result = await window.steamAPI.login()
    if (result.success) {
      currentUser.value = result.user
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('steam_user', JSON.stringify(result.user))
      }
    } else {
      errorMessage.value = result.error || 'Connexion échouée.'
    }
  } catch (err) {
    errorMessage.value = err.message || 'Une erreur inattendue est survenue.'
  } finally {
    isLoading.value = false
  }
}

async function handleLogout() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('steam_user')
    }
    if (window.steamAPI) {
      await window.steamAPI.logout()
    }
    currentUser.value = null
    errorMessage.value = null
    authStep.value = steamApiKey.value ? 'login' : 'apikey'
  } catch (err) {
    console.error('Erreur déconnexion:', err)
  }
}

// Modals actions
function openApiKeyModal() {
  modalApiKey.value = steamApiKey.value || ''
  showApiKeyModal.value = true
}

function closeApiKeyModal() {
  showApiKeyModal.value = false
}

async function saveApiKeyFromModal(newKey) {
  steamApiKey.value = newKey
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('steam_api_key', newKey)
  }
  if (window.steamAPI?.saveSteamApiKey) {
    await window.steamAPI.saveSteamApiKey(newKey)
  }
  showApiKeyModal.value = false
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

function copyObsUrl() {
  navigator.clipboard.writeText(obsUrl.value)
  obsCopied.value = true
  setTimeout(() => {
    obsCopied.value = false
  }, 2000)
}

function copyObsUrlLocalhost() {
  const localUrl = obsStatus.value?.obsUrlLocalhost || `http://localhost:${obsStatus.value?.port || 8080}/obs`
  navigator.clipboard.writeText(localUrl)
  obsLocalhostCopied.value = true
  setTimeout(() => {
    obsLocalhostCopied.value = false
  }, 2000)
}

function copyObsUrlLan() {
  if (obsStatus.value?.obsUrlLan) {
    navigator.clipboard.writeText(obsStatus.value.obsUrlLan)
    obsLanCopied.value = true
    setTimeout(() => {
      obsLanCopied.value = false
    }, 2000)
  }
}

function openObsLanInBrowser() {
  if (obsStatus.value?.obsUrlLan) {
    if (window.steamAPI?.openExternal) {
      window.steamAPI.openExternal(obsStatus.value.obsUrlLan)
    } else {
      window.open(obsStatus.value.obsUrlLan, '_blank')
    }
  }
}

function openPortModal() {
  modalPortValue.value = obsStatus.value?.preferredPort || obsStatus.value?.port || 8080
  portModalMessage.value = ''
  showPortModal.value = true
}

function closePortModal() {
  showPortModal.value = false
  portModalMessage.value = ''
}

async function saveCustomPort(p) {
  if (!p || p < 1024 || p > 65535) {
    alert('Veuillez entrer un numéro de port valide entre 1024 et 65535.')
    return
  }

  isSavingPort.value = true
  try {
    if (window.steamAPI?.setObsPort) {
      const updatedStatus = await window.steamAPI.setObsPort(p)
      if (updatedStatus) {
        obsStatus.value = updatedStatus
        if (updatedStatus.obsUrl) obsUrl.value = updatedStatus.obsUrl
      }
    }
    appSettings.value.obsPort = p
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app_settings', JSON.stringify(appSettings.value))
    }
    portModalMessage.value = `Port mis à jour sur ${p} avec succès !`
    setTimeout(() => {
      closePortModal()
    }, 1200)
  } catch (err) {
    console.error('Erreur setObsPort:', err)
    alert('Erreur lors du changement de port: ' + err)
  } finally {
    isSavingPort.value = false
  }
}

function openObsInBrowser() {
  if (window.steamAPI?.openExternal) {
    window.steamAPI.openExternal(obsUrl.value)
  } else {
    window.open(obsUrl.value, '_blank')
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
