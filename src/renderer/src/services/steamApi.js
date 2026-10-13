import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { themeStorage } from './themeStorage.js'
import { IPC_EVENTS, IPC_COMMANDS } from '../constants/index.js'

export const steamAPI = {
  login: async () => {
    try {
      const user = await invoke(IPC_COMMANDS.LOGIN)
      return { success: true, user }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },

  logout: async () => {
    try {
      await invoke(IPC_COMMANDS.LOGOUT)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },

  getCurrentUser: async () => {
    try {
      return await invoke(IPC_COMMANDS.GET_CURRENT_USER)
    } catch {
      return null
    }
  },

  openExternal: async (url) => {
    try {
      return await invoke(IPC_COMMANDS.OPEN_EXTERNAL, { url })
    } catch (err) {
      console.warn('Erreur ouverture lien externe:', err)
      if (typeof window !== 'undefined') window.open(url, '_blank')
    }
  },

  onAuthStatusChanged: (callback) => {
    let unlisten = null
    listen(IPC_EVENTS.AUTH_STATUS_CHANGED, (event) => {
      callback(event.payload)
    }).then((fn) => {
      unlisten = fn
    })
    return () => {
      if (unlisten) unlisten()
    }
  },

  onAchievementUnlocked: (callback) => {
    let unlisten = null
    listen(IPC_EVENTS.ACHIEVEMENT_UNLOCKED, (event) => {
      callback(event.payload)
    }).then((fn) => {
      unlisten = fn
    })
    return () => {
      if (unlisten) unlisten()
    }
  },

  getTrackerStatus: async () => {
    try {
      return await invoke(IPC_COMMANDS.GET_TRACKER_STATUS)
    } catch (err) {
      return {
        isTracking: false,
        activeGameName: null,
        activeAppId: null,
        steamPath: null,
        steamId: null,
        hasApiKey: false,
        watchedFiles: []
      }
    }
  },

  simulateAchievement: async (params = {}) => {
    try {
      const achievement = await invoke(IPC_COMMANDS.SIMULATE_ACHIEVEMENT, {
        appId: params.appId || '440',
        achievementCode: params.achievementCode || 'TF_PLAY_GAME_EVERYCLASS'
      })
      return { success: true, achievement }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },

  getObsStatus: async () => {
    try {
      return await invoke(IPC_COMMANDS.GET_OBS_STATUS)
    } catch {
      return {
        isRunning: false,
        port: 8080,
        connectedClients: 0,
        obsUrl: 'http://127.0.0.1:8080/obs'
      }
    }
  },

  onObsStatusChanged: (callback) => {
    let unlisten = null
    listen(IPC_EVENTS.OBS_STATUS_CHANGED, (event) => {
      callback(event.payload)
    }).then((fn) => {
      unlisten = fn
    })
    return () => {
      if (unlisten) unlisten()
    }
  },

  // Gestion des thèmes dans le système de fichiers (AppData)
  getThemeLibrary: () => themeStorage.getLibrary(),
  getActiveTheme: () => themeStorage.getActiveTheme(),
  setActiveTheme: (id) => themeStorage.setActiveTheme(id),
  saveTheme: (themeData) => themeStorage.saveTheme(themeData),
  createTheme: (initialData) => themeStorage.createTheme(initialData),
  duplicateTheme: (id) => themeStorage.duplicateTheme(id),
  deleteTheme: (id) => themeStorage.deleteTheme(id),
  restoreDefaultThemes: () => themeStorage.restoreDefaultThemes(),
  exportTheme: (id) => themeStorage.exportTheme(id),
  exportLibrary: () => themeStorage.exportLibrary(),
  importTheme: (jsonOrString) => themeStorage.importTheme(jsonOrString),
  importLibrary: (jsonOrString) => themeStorage.importLibrary(jsonOrString),
  onThemeLibraryUpdated: (callback) => themeStorage.onLibraryUpdated(callback),

  getCustomization: () => themeStorage.getActiveTheme(),
  saveCustomization: (theme) => themeStorage.saveTheme(theme),
  resetCustomization: async () => {
    const res = await themeStorage.loadLibrary()
    return { success: true, theme: res.themes[0] }
  },

  onCustomizationUpdated: (callback) => {
    const unsubLocal = themeStorage.onCustomizationUpdated(callback)
    let unlistenEvent = null
    listen(IPC_EVENTS.CUSTOMIZATION_UPDATED, (event) => {
      callback(event.payload)
    }).then((fn) => {
      unlistenEvent = fn
    })

    return () => {
      unsubLocal()
      if (unlistenEvent) unlistenEvent()
    }
  },

  broadcastTestAchievement: async (achievementData) => {
    try {
      await invoke(IPC_COMMANDS.BROADCAST_TEST_ACHIEVEMENT, { achievementData })
      return { success: true, achievement: achievementData }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },

  selectAudioFile: async () => {
    try {
      const filePath = await invoke(IPC_COMMANDS.SELECT_AUDIO_FILE)
      if (filePath) {
        return { success: true, filePath }
      }
      return { success: false, canceled: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },

  getAudioData: async (filePath) => {
    try {
      return await invoke(IPC_COMMANDS.GET_AUDIO_DATA, { filePath: filePath || null })
    } catch (err) {
      console.warn('[steamAPI] getAudioData error:', err)
      return { hasAudio: false, dataUrl: null }
    }
  },

  getSteamApiKey: async () => {
    try {
      return await invoke(IPC_COMMANDS.GET_STEAM_API_KEY)
    } catch {
      return { apiKey: '', hasKey: false }
    }
  },

  saveSteamApiKey: async (key) => {
    try {
      return await invoke(IPC_COMMANDS.SAVE_STEAM_API_KEY, { key })
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },

  getAppSettings: async () => {
    try {
      return await invoke(IPC_COMMANDS.GET_APP_SETTINGS)
    } catch (err) {
      console.warn('[steamAPI] getAppSettings error:', err)
      return {
        obsPort: 8080,
        soundEnabled: true,
        soundVolume: 0.8,
        desktopOverlayEnabled: true
      }
    }
  },

  saveAppSettings: async (settings) => {
    try {
      return await invoke(IPC_COMMANDS.SAVE_APP_SETTINGS, { settings })
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },

  setObsPort: async (port) => {
    try {
      return await invoke(IPC_COMMANDS.SET_OBS_PORT, { port: Number(port) })
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }
}

// Initialisation globale pour compatibilité immédiate
if (typeof window !== 'undefined') {
  window.steamAPI = steamAPI
}
