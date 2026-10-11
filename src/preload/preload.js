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
  }
})
