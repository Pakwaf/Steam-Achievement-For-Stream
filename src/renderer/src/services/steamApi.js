import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { themeStorage } from './themeStorage.js'

export const steamAPI = {
  login: async () => {
    try {
      const user = await invoke('login')
      return { success: true, user }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },

  logout: async () => {
    try {
      await invoke('logout')
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },

  getCurrentUser: async () => {
    try {
      return await invoke('get_current_user')
    } catch {
      return null
    }
  },

  openExternal: async (url) => {
    try {
      return await invoke('open_external', { url })
    } catch (err) {
      console.warn('Erreur ouverture lien externe:', err)
      if (typeof window !== 'undefined') window.open(url, '_blank')
    }
  },

  onAuthStatusChanged: (callback) => {
    let unlisten = null
    listen('steam:auth-status-changed', (event) => {
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
    listen('steam:achievement-unlocked', (event) => {
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
      return await invoke('get_tracker_status')
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
      const achievement = await invoke('simulate_achievement', {
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
      return await invoke('get_obs_status')
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
    listen('obs:status-changed', (event) => {
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
    listen('customization:updated', (event) => {
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
      await invoke('broadcast_test_achievement', { achievementData })
      return { success: true, achievement: achievementData }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },

  selectAudioFile: async () => {
    try {
      const filePath = await invoke('select_audio_file')
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
      return await invoke('get_audio_data', { filePath: filePath || null })
    } catch (err) {
      console.warn('[steamAPI] getAudioData error:', err)
      return { hasAudio: false, dataUrl: null }
    }
  },

  getSteamApiKey: async () => {
    try {
      return await invoke('get_steam_api_key')
    } catch {
      return { apiKey: '', hasKey: false }
    }
  },

  saveSteamApiKey: async (key) => {
    try {
      return await invoke('save_steam_api_key', { key })
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },

  getAppSettings: async () => {
    try {
      return await invoke('get_app_settings')
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
      return await invoke('save_app_settings', { settings })
    } catch (err) {
      return { success: false, error: String(err) }
    }
  },

  setObsPort: async (port) => {
    try {
      return await invoke('set_obs_port', { port: Number(port) })
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }
}

// Initialisation globale pour compatibilité immédiate
if (typeof window !== 'undefined') {
  window.steamAPI = steamAPI
}
