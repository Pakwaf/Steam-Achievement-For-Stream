import { ref, onMounted, onUnmounted } from 'vue'
import { steamAPI } from '../services/steamApi.js'
import { themeStorage } from '../services/themeStorage.js'
import { playAchievementSound } from './useAudioEngine.js'
import { ACHIEVEMENT_TIERS } from '../utils/visualEffects.js'
import { STORAGE_KEYS, ACHIEVEMENT_TIERS_KEYS } from '../constants/index.js'

/**
 * Composable réactif pour la gestion du cycle de vie du tracker Steam,
 * de l'authentification, de l'historique et des alertes de succès.
 */
export function useSteamTracker() {
  const isInitializing = ref(true)
  const currentUser = ref(null)
  const isLoading = ref(false)
  const errorMessage = ref(null)

  const authStep = ref('apikey') // 'apikey' | 'login'
  const steamApiKey = ref('')
  const isSavingKey = ref(false)
  const keySavedMessage = ref('')

  const trackerStatus = ref(null)
  const activeNotification = ref(null)
  const unlockedHistory = ref([])
  const isSimulating = ref(false)

  let unsubs = []
  let toastTimer = null
  let trackerPollInterval = null

  async function loadInitialState() {
    try {
      const [keyRes, userRes, trackerRes] = await Promise.all([
        steamAPI.getSteamApiKey().catch(() => ({ apiKey: '' })),
        steamAPI.getCurrentUser().catch(() => null),
        steamAPI.getTrackerStatus().catch(() => null)
      ])

      // Restauration de la clé API exclusivement depuis le backend Rust
      const rawKey = typeof keyRes === 'string' ? keyRes : (keyRes?.apiKey || '')
      // Nettoyage proactif de tout reliquat dans le localStorage pour la sécurité
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.STEAM_API_KEY)
      }
      const trimmedKey = (rawKey || '').trim()
      if (trimmedKey && trimmedKey.length >= 8) {
        steamApiKey.value = trimmedKey
        authStep.value = 'login'
      } else {
        steamApiKey.value = ''
        authStep.value = 'apikey'
      }

      // Restauration de l'utilisateur
      let user = userRes
      if (!user && typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem(STORAGE_KEYS.STEAM_USER)
          if (stored) user = JSON.parse(stored)
        } catch {
          // ignore
        }
      }
      if (user && user.steamId) {
        currentUser.value = user
      }

      if (trackerRes) {
        trackerStatus.value = trackerRes
      }
    } catch (err) {
      console.error('[useSteamTracker] Erreur chargement initial:', err)
    } finally {
      isInitializing.value = false
    }
  }

  async function refreshTrackerStatus() {
    try {
      const status = await steamAPI.getTrackerStatus()
      if (status) trackerStatus.value = status
    } catch (err) {
      console.warn('[useSteamTracker] Erreur refreshTrackerStatus:', err)
    }
  }

  async function handleSaveApiKey() {
    if (isSavingKey.value) return
    const keyToSave = typeof steamApiKey.value === 'string' ? steamApiKey.value.trim() : ''
    if (keyToSave.length < 8) {
      return
    }

    isSavingKey.value = true
    try {
      await steamAPI.saveSteamApiKey(keyToSave)
      keySavedMessage.value = 'Clé API enregistrée avec succès ! Redirection...'
      setTimeout(() => {
        keySavedMessage.value = ''
        authStep.value = 'login'
      }, 750)
      await refreshTrackerStatus()
    } catch (err) {
      console.error('[useSteamTracker] Erreur enregistrement clé Steam API:', err)
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
      const result = await steamAPI.login()
      if (result.success && result.user) {
        currentUser.value = result.user
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.STEAM_USER, JSON.stringify(result.user))
        }
        await refreshTrackerStatus()
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
        localStorage.removeItem(STORAGE_KEYS.STEAM_USER)
      }
      await steamAPI.logout()
      currentUser.value = null
      errorMessage.value = null
      authStep.value = steamApiKey.value ? 'login' : 'apikey'
      await refreshTrackerStatus()
    } catch (err) {
      console.error('[useSteamTracker] Erreur déconnexion:', err)
    }
  }

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

  async function triggerDashboardTierTest(tier = ACHIEVEMENT_TIERS_KEYS.COMMON) {
    if (isSimulating.value) return
    isSimulating.value = true

    const meta = ACHIEVEMENT_TIERS[tier] || ACHIEVEMENT_TIERS.common

    // 1. Jouer immédiatement le son avec la tonalité / carillon du Tier dans l'app
    let activeThm = null
    try {
      activeThm = await steamAPI.getActiveTheme()
    } catch {
      activeThm = themeStorage.getActiveThemeSync()
    }
    playAchievementSound(activeThm || {}, tier)

    // 2. Diffuser l'alerte de test complète vers DesktopOverlay et OBS
    try {
      await steamAPI.broadcastTestAchievement({
        appId: tier === ACHIEVEMENT_TIERS_KEYS.RARE ? '550' : (tier === ACHIEVEMENT_TIERS_KEYS.MASTER ? '1794680' : '440'),
        achievementCode: tier === ACHIEVEMENT_TIERS_KEYS.RARE ? 'ACH_FINISH_CAMPAIGN_MELEE_ONLY' : (tier === ACHIEVEMENT_TIERS_KEYS.MASTER ? '100_PERCENT_MASTER' : 'TF_PLAY_GAME_EVERYCLASS'),
        displayName: meta.defaultTitle,
        description: meta.defaultDesc,
        gameName: meta.defaultGame,
        icon: meta.icon,
        tier,
        rarityPercent: meta.defaultPercent,
        playtimeHours: tier === ACHIEVEMENT_TIERS_KEYS.MASTER ? 142.5 : null,
        playtime_hours: tier === ACHIEVEMENT_TIERS_KEYS.MASTER ? 142.5 : null,
        unlockedAt: new Date().toISOString(),
        isTest: true
      })
    } catch (err) {
      console.error('[useSteamTracker] Erreur simulation tier:', err)
    } finally {
      setTimeout(() => {
        isSimulating.value = false
      }, 1200)
    }
  }

  onMounted(() => {
    loadInitialState()

    // Écoute des succès débloqués en direct
    const unsubAch = steamAPI.onAchievementUnlocked(async (achievement) => {
      if (achievement?.isTest) return

      triggerAchievementToast(achievement)
      try {
        let theme = null
        if (achievement.previewTheme) {
          theme = achievement.previewTheme
        } else {
          theme = await steamAPI.getActiveTheme().catch(() => null)
        }
        await playAchievementSound(theme || {}, achievement.tier || ACHIEVEMENT_TIERS_KEYS.COMMON)
      } catch (err) {
        console.warn('[useSteamTracker] Erreur lecture audio succès:', err)
      }
    })
    unsubs.push(unsubAch)

    // Écoute des modifications d'authentification
    const unsubAuth = steamAPI.onAuthStatusChanged((user) => {
      currentUser.value = user
      if (user && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.STEAM_USER, JSON.stringify(user))
      }
    })
    unsubs.push(unsubAuth)

    // Polling du statut du tracker
    trackerPollInterval = setInterval(() => {
      refreshTrackerStatus()
    }, 2500)
  })

  onUnmounted(() => {
    if (toastTimer) clearTimeout(toastTimer)
    if (trackerPollInterval) clearInterval(trackerPollInterval)
    for (const unsub of unsubs) {
      if (typeof unsub === 'function') unsub()
    }
    unsubs = []
  })

  return {
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
    triggerAchievementToast,
    dismissToast,
    refreshTrackerStatus
  }
}
