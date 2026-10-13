import { ref, computed, shallowRef, toRaw } from 'vue'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { getVersion } from '@tauri-apps/api/app'
import { UPDATER_STATUS } from '../constants/updater.js'

/**
 * Nettoie une chaîne de version en retirant les préfixes redondants 'v' ou 'v.'
 * @param {string|null|undefined} v
 * @returns {string}
 */
export function cleanVersion(v) {
  if (!v) return ''
  return String(v).replace(/^v+/i, '').trim()
}

// Version de secours via define Vite ou fallback statique
const defaultVersion = typeof __APP_VERSION__ !== 'undefined' ? cleanVersion(__APP_VERSION__) : '1.0.4'
const currentAppVersion = ref(defaultVersion)

// Détection asynchrone de la version réelle de l'exécutable nativement installé
if (typeof window !== 'undefined' && window.__TAURI_INTERNALS__) {
  getVersion()
    .then((ver) => {
      if (ver) {
        currentAppVersion.value = cleanVersion(ver)
      }
    })
    .catch((err) => {
      console.warn('[AppUpdater] Impossible de récupérer la version native via getVersion():', err)
    })
}

// État partagé en singleton au niveau du module
const status = ref(UPDATER_STATUS.IDLE)
const updateInfo = ref(null)
// Instance native brute non proxyfiée pour préserver l'accès aux champs privés de Tauri Resource
let rawUpdateHandle = null
const updateResource = shallowRef(null)
const downloadProgress = ref(0)
const downloadedBytes = ref(0)
const totalBytes = ref(0)
const statusMessage = ref('')
const errorMessage = ref('')
const showUpdateModal = ref(false)

const isChecking = computed(() => status.value === UPDATER_STATUS.CHECKING)
const isDownloading = computed(() => status.value === UPDATER_STATUS.DOWNLOADING)
const isUpdateReady = computed(() => status.value === UPDATER_STATUS.READY)
const updateAvailable = computed(() => status.value === UPDATER_STATUS.AVAILABLE && !!updateInfo.value)

/**
 * Formate un nombre d'octets en chaîne lisible (Mo ou Ko).
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 Mo'
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) {
    return `${mb.toFixed(1)} Mo`
  }
  const kb = bytes / 1024
  return `${kb.toFixed(0)} Ko`
}

/**
 * Composable pour la gestion complète des mises à jour automatiques Tauri v2.
 */
export function useAppUpdater() {
  /**
   * Vérifie la disponibilité d'une mise à jour sur GitHub Releases.
   * @param {boolean} manual Indique si l'action a été déclenchée manuellement par l'utilisateur.
   */
  async function checkForUpdates(manual = false) {
    if (isChecking.value || isDownloading.value) return

    status.value = UPDATER_STATUS.CHECKING
    errorMessage.value = ''
    statusMessage.value = 'Recherche de mises à jour...'

    try {
      // Détection de l'environnement Tauri (évite les erreurs en dev web standard)
      if (typeof window === 'undefined' || !window.__TAURI_INTERNALS__) {
        status.value = UPDATER_STATUS.IDLE
        if (manual) {
          statusMessage.value = 'L\'updater est uniquement actif dans l\'application bureau native.'
        }
        return null
      }

      const update = await check()

      if (update) {
        rawUpdateHandle = update
        updateResource.value = update
        const cleanNextVersion = cleanVersion(update.version)
        const cleanCurrVersion = cleanVersion(update.currentVersion) || currentAppVersion.value

        updateInfo.value = {
          version: cleanNextVersion,
          currentVersion: cleanCurrVersion,
          date: update.date || '',
          body: update.body || ''
        }
        status.value = UPDATER_STATUS.AVAILABLE
        statusMessage.value = `Version v${cleanNextVersion} disponible !`
        showUpdateModal.value = true
        return update
      } else {
        rawUpdateHandle = null
        updateResource.value = null
        updateInfo.value = null
        status.value = UPDATER_STATUS.UP_TO_DATE
        if (manual) {
          statusMessage.value = `Votre application est à jour (v${currentAppVersion.value}) !`
        }
        return null
      }
    } catch (err) {
      console.error('[AppUpdater] Erreur lors de la vérification de mise à jour:', err)
      status.value = UPDATER_STATUS.ERROR
      const errText = err?.message || String(err)
      errorMessage.value = errText
      if (manual) {
        statusMessage.value = `Échec de vérification : ${errText}`
      }
      return null
    }
  }

  /**
   * Télécharge la mise à jour, l'installe et redémarre l'application.
   */
  async function downloadAndInstall() {
    const activeUpdate = rawUpdateHandle || (updateResource.value ? toRaw(updateResource.value) : null)
    if (!activeUpdate || isDownloading.value) return

    status.value = UPDATER_STATUS.DOWNLOADING
    downloadProgress.value = 0
    downloadedBytes.value = 0
    totalBytes.value = 0
    errorMessage.value = ''
    statusMessage.value = 'Démarrage du téléchargement...'

    try {
      let currentDownloaded = 0
      let currentTotal = 0

      await activeUpdate.downloadAndInstall((event) => {
        if (!event) return

        switch (event.event) {
          case 'Started': {
            currentTotal = event.data?.contentLength || 0
            totalBytes.value = currentTotal
            statusMessage.value = `Téléchargement de ${formatBytes(currentTotal)}...`
            break
          }
          case 'Progress': {
            currentDownloaded += event.data?.chunkLength || 0
            downloadedBytes.value = currentDownloaded
            if (currentTotal > 0) {
              const pct = Math.min(100, Math.round((currentDownloaded / currentTotal) * 100))
              downloadProgress.value = pct
              statusMessage.value = `Téléchargement : ${pct}% (${formatBytes(currentDownloaded)} / ${formatBytes(currentTotal)})`
            } else {
              statusMessage.value = `Téléchargé : ${formatBytes(currentDownloaded)}`
            }
            break
          }
          case 'Finished': {
            downloadProgress.value = 100
            statusMessage.value = 'Téléchargement terminé avec succès. Finalisation...'
            break
          }
        }
      })

      status.value = UPDATER_STATUS.READY
      statusMessage.value = 'Installation terminée. Redémarrage de l\'application...'

      // Redémarrage automatique propre de l'application
      setTimeout(async () => {
        try {
          await relaunch()
        } catch (relaunchErr) {
          console.error('[AppUpdater] Erreur de redémarrage:', relaunchErr)
          errorMessage.value = 'Veuillez redémarrer l\'application manuellement.'
        }
      }, 1500)
    } catch (err) {
      console.error('[AppUpdater] Erreur pendant le téléchargement / installation:', err)
      status.value = UPDATER_STATUS.ERROR
      errorMessage.value = err?.message || String(err)
      statusMessage.value = 'Une erreur est survenue lors du téléchargement de la mise à jour.'
    }
  }

  function openUpdateModal() {
    showUpdateModal.value = true
  }

  function closeUpdateModal() {
    // Si un téléchargement est en cours, ne pas fermer brutalement
    if (!isDownloading.value) {
      showUpdateModal.value = false
    }
  }

  return {
    status,
    updateInfo,
    currentAppVersion,
    cleanVersion,
    isChecking,
    isDownloading,
    isUpdateReady,
    updateAvailable,
    downloadProgress,
    downloadedBytes,
    totalBytes,
    statusMessage,
    errorMessage,
    showUpdateModal,
    checkForUpdates,
    downloadAndInstall,
    openUpdateModal,
    closeUpdateModal
  }
}
