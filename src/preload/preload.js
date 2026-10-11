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
  simulateAchievement: (params) => ipcRenderer.invoke('steam:simulate-achievement', params)
})
