import { ref, onMounted, onUnmounted } from 'vue'
import { steamAPI } from '../services/steamApi.js'
import { STORAGE_KEYS } from '../constants/index.js'

/**
 * Composable réactif pour la gestion du serveur OBS intégré,
 * des ports et de la détection d'adresses LAN/Localhost.
 */
export function useObsManager() {
  const obsStatus = ref({
    isRunning: true,
    port: 8080,
    preferredPort: 8080,
    hasPortConflict: false,
    connectedClients: 0,
    obsUrl: 'http://127.0.0.1:8080/obs',
    obsUrlLocalhost: 'http://localhost:8080/obs',
    obsUrlLan: null,
    lanBroadcastEnabled: false
  })
  const obsUrl = ref('http://127.0.0.1:8080/obs')

  const obsCopied = ref(false)
  const obsLanCopied = ref(false)
  const obsLocalhostCopied = ref(false)

  const showPortModal = ref(false)
  const modalPortValue = ref(8080)
  const portModalMessage = ref('')
  const isSavingPort = ref(false)

  let unsubs = []
  let obsPollInterval = null

  async function loadInitialObsStatus() {
    try {
      const [obs, appSettings] = await Promise.all([
        steamAPI.getObsStatus().catch(() => null),
        steamAPI.getAppSettings().catch(() => null)
      ])

      if (obs) {
        obsStatus.value = obs
        if (obs.obsUrl) obsUrl.value = obs.obsUrl
      }
      if (appSettings?.obsPort) {
        modalPortValue.value = appSettings.obsPort
      }
    } catch (err) {
      console.warn('[useObsManager] Erreur chargement initial OBS:', err)
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

  function openObsInBrowser() {
    steamAPI.openExternal(obsUrl.value)
  }

  function openObsLanInBrowser() {
    if (obsStatus.value?.obsUrlLan) {
      steamAPI.openExternal(obsStatus.value.obsUrlLan)
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

  async function saveCustomPort(newPort) {
    if (!newPort || newPort < 1024 || newPort > 65535) {
      alert('Veuillez entrer un numéro de port valide entre 1024 et 65535.')
      return
    }

    isSavingPort.value = true
    try {
      const updatedStatus = await steamAPI.setObsPort(newPort)
      if (updatedStatus) {
        obsStatus.value = updatedStatus
        if (updatedStatus.obsUrl) obsUrl.value = updatedStatus.obsUrl
      }

      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS)
        const parsed = stored ? JSON.parse(stored) : {}
        parsed.obsPort = newPort
        localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(parsed))
      }

      portModalMessage.value = `Port mis à jour sur ${newPort} avec succès !`
      setTimeout(() => {
        closePortModal()
      }, 1200)
    } catch (err) {
      console.error('[useObsManager] Erreur setObsPort:', err)
      alert('Erreur lors du changement de port: ' + err)
    } finally {
      isSavingPort.value = false
    }
  }

  onMounted(() => {
    loadInitialObsStatus()

    const unsubObs = steamAPI.onObsStatusChanged((obs) => {
      if (obs) {
        obsStatus.value = obs
        if (obs.obsUrl) obsUrl.value = obs.obsUrl
      }
    })
    unsubs.push(unsubObs)

    obsPollInterval = setInterval(async () => {
      try {
        const obs = await steamAPI.getObsStatus()
        if (obs) obsStatus.value = obs
      } catch {
        // ignore
      }
    }, 2500)
  })

  onUnmounted(() => {
    if (obsPollInterval) clearInterval(obsPollInterval)
    for (const unsub of unsubs) {
      if (typeof unsub === 'function') unsub()
    }
    unsubs = []
  })

  return {
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
  }
}
