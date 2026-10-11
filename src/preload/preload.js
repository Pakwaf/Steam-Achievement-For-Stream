import { contextBridge, ipcRenderer } from 'electron'

// Exposition sécurisée des API vers le contexte du navigateur Vue (Renderer)
contextBridge.exposeInMainWorld('steamAPI', {
  /**
   * Ouvre la fenêtre de connexion Steam OpenID
   * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
   */
  login: () => ipcRenderer.invoke('steam:login'),

  /**
   * Déconnecte l'utilisateur actuel
   * @returns {Promise<{success: boolean}>}
   */
  logout: () => ipcRenderer.invoke('steam:logout'),

  /**
   * Récupère les données de l'utilisateur connecté en mémoire
   * @returns {Promise<Object|null>}
   */
  getCurrentUser: () => ipcRenderer.invoke('steam:get-current-user'),

  /**
   * Ouvre un lien externe dans le navigateur par défaut du système
   * @param {string} url
   */
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),

  /**
   * Écoute les changements d'état d'authentification envoyés par le Main process
   * @param {Function} callback - Fonction appelée avec le profil utilisateur ou null
   * @returns {Function} Fonction de désinscription
   */
  onAuthStatusChanged: (callback) => {
    const handler = (_event, user) => callback(user)
    ipcRenderer.on('steam:auth-status-changed', handler)
    return () => {
      ipcRenderer.removeListener('steam:auth-status-changed', handler)
    }
  },

  /**
   * Écoute les événements de déblocage de succès en temps réel
   * @param {Function} callback - Fonction appelée avec les métadonnées du succès
   * @returns {Function} Fonction de désinscription
   */
  onAchievementUnlocked: (callback) => {
    const handler = (_event, achievement) => callback(achievement)
    ipcRenderer.on('steam:achievement-unlocked', handler)
    return () => {
      ipcRenderer.removeListener('steam:achievement-unlocked', handler)
    }
  },

  /**
   * Récupère le statut actuel du tracker de logs Steam
   * @returns {Promise<{isTracking: boolean, steamPath: string, watchedFiles: string[], hasApiKey: boolean}>}
   */
  getTrackerStatus: () => ipcRenderer.invoke('steam:get-tracker-status'),

  /**
   * Déclenche une simulation de succès pour tester le fonctionnement et l'affichage
   * @param {{appId?: string, achievementCode?: string}} params
   * @returns {Promise<{success: boolean}>}
   */
  simulateAchievement: (params) => ipcRenderer.invoke('steam:simulate-achievement', params),

  /**
   * Récupère le statut du serveur OBS local (port, clients connectés, URL)
   * @returns {Promise<{isRunning: boolean, port: number, obsUrl: string, connectedClients: number}>}
   */
  getObsStatus: () => ipcRenderer.invoke('obs:get-server-status'),

  /**
   * Écoute les changements de statut du serveur OBS (connexions/déconnexions de sources)
   * @param {Function} callback
   * @returns {Function} Fonction de désinscription
   */
  onObsStatusChanged: (callback) => {
    const handler = (_event, status) => callback(status)
    ipcRenderer.on('obs:status-changed', handler)
    return () => {
      ipcRenderer.removeListener('obs:status-changed', handler)
    }
  },

  /**
   * Récupère l'intégralité de la bibliothèque de thèmes et l'identifiant actif
   * @returns {Promise<{activeThemeId: string, themes: Array<Object>}>}
   */
  getThemeLibrary: () => ipcRenderer.invoke('customization:get-library'),

  /**
   * Récupère le thème actuellement actif pour les overlays
   * @returns {Promise<Object>}
   */
  getActiveTheme: () => ipcRenderer.invoke('customization:get-active'),

  /**
   * Définit le thème actif pour les overlays Desktop et OBS
   * @param {string} id
   * @returns {Promise<{success: boolean, activeTheme: Object, library: Object}>}
   */
  setActiveTheme: (id) => ipcRenderer.invoke('customization:set-active', id),

  /**
   * Enregistre ou met à jour un thème spécifique
   * @param {Object} themeData
   * @returns {Promise<{success: boolean, theme: Object, library: Object}>}
   */
  saveTheme: (themeData) => ipcRenderer.invoke('customization:save-theme', themeData),

  /**
   * Crée un nouveau thème dans la bibliothèque
   * @param {Object} initialData
   * @returns {Promise<{success: boolean, theme: Object, library: Object}>}
   */
  createTheme: (initialData) => ipcRenderer.invoke('customization:create-theme', initialData),

  /**
   * Duplique un thème existant
   * @param {string} id
   * @returns {Promise<{success: boolean, duplicatedTheme: Object, library: Object}>}
   */
  duplicateTheme: (id) => ipcRenderer.invoke('customization:duplicate-theme', id),

  /**
   * Supprime un thème de la bibliothèque
   * @param {string} id
   * @returns {Promise<{success: boolean, activeTheme?: Object, library?: Object, error?: string}>}
   */
  deleteTheme: (id) => ipcRenderer.invoke('customization:delete-theme', id),

  /**
   * Écoute les modifications de la bibliothèque de thèmes (création, duplication, suppression...)
   * @param {Function} callback
   * @returns {Function} Fonction de désinscription
   */
  onThemeLibraryUpdated: (callback) => {
    const handler = (_event, library) => callback(library)
    ipcRenderer.on('customization:library-updated', handler)
    return () => {
      ipcRenderer.removeListener('customization:library-updated', handler)
    }
  },

  /**
   * Récupère le thème de personnalisation actif (HTML, CSS, Audio) - alias compatibilité
   * @returns {Promise<{html: string, css: string, audioPath: string|null, soundEnabled: boolean, soundVolume: number}>}
   */
  getCustomization: () => ipcRenderer.invoke('customization:get'),

  /**
   * Enregistre le thème de personnalisation actif - alias compatibilité
   * @param {Object} theme
   * @returns {Promise<{success: boolean, theme: Object}>}
   */
  saveCustomization: (theme) => ipcRenderer.invoke('customization:save', theme),

  /**
   * Réinitialise le thème de personnalisation aux valeurs par défaut
   * @returns {Promise<{success: boolean, theme: Object}>}
   */
  resetCustomization: () => ipcRenderer.invoke('customization:reset'),

  /**
   * Ouvre la boîte de dialogue native pour sélectionner un fichier audio
   * @returns {Promise<{success: boolean, filePath?: string, canceled?: boolean}>}
   */
  selectAudioFile: () => ipcRenderer.invoke('customization:select-audio'),

  /**
   * Écoute les mises à jour en direct du thème personnalisé actif
   * @param {Function} callback
   * @returns {Function} Fonction de désinscription
   */
  onCustomizationUpdated: (callback) => {
    const handler = (_event, theme) => callback(theme)
    ipcRenderer.on('customization:updated', handler)
    return () => {
      ipcRenderer.removeListener('customization:updated', handler)
    }
  },

  /**
   * Diffuse un faux succès de test dans tout le pipeline (Phase 4 & 5 avec support preview)
   * @param {Object} achievementData
   * @returns {Promise<{success: boolean, achievement: Object}>}
   */
  broadcastTestAchievement: (achievementData) => ipcRenderer.invoke('steam:broadcast-test-achievement', achievementData),

  /**
   * Récupère les données audio du fichier sous forme de Data URL (base64)
   * @param {string} [specificPath]
   * @returns {Promise<{hasAudio: boolean, dataUrl: string|null}>}
   */
  getAudioData: (specificPath) => ipcRenderer.invoke('customization:get-audio-data', specificPath),

  /**
   * Récupère la clé Steam Web API enregistrée
   * @returns {Promise<{apiKey: string, hasKey: boolean}>}
   */
  getSteamApiKey: () => ipcRenderer.invoke('steam:get-api-key'),

  /**
   * Enregistre la clé Steam Web API
   * @param {string} key
   * @returns {Promise<{success: boolean, apiKey: string, hasKey: boolean}>}
   */
  saveSteamApiKey: (key) => ipcRenderer.invoke('steam:save-api-key', key)
})


