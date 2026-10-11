import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, ipcMain, shell, screen, dialog } from 'electron'
import { steamAuth } from './steamAuth.js'
import { achievementTracker } from './achievementTracker.js'
import { obsServer } from './obsServer.js'
import { customizationService } from './customizationService.js'
import { settingsService } from './settingsService.js'

// Autorise la lecture audio programmée sans interaction utilisateur préalable dans Electron
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow = null
let overlayWindow = null

/**
 * Crée la fenêtre principale (Dashboard de gestion et configuration)
 */
function createMainWindow() {
  const preloadPath = path.join(__dirname, '../preload/index.js')

  mainWindow = new BrowserWindow({
    width: 1050,
    height: 720,
    minWidth: 850,
    minHeight: 600,
    title: 'Steam Custom Achievements - Dashboard',
    backgroundColor: '#0e141b',
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron] Échec chargement URL (${errorCode}): ${errorDescription} - ${validatedURL}`)
  })

  // Ouvrir les liens externes dans le navigateur par défaut
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  const isDev = !app.isPackaged
  const rendererUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:3000'

  if (isDev) {
    console.log('[Electron] Chargement Dashboard (Dev):', `${rendererUrl}/#/`)
    mainWindow.loadURL(`${rendererUrl}/#/`)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: '/' })
  }

  mainWindow.show()
  mainWindow.focus()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

/**
 * Crée la fenêtre Overlay transparente pour les jeux en plein écran
 */
function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.bounds

  const preloadPath = path.join(__dirname, '../preload/index.js')

  overlayWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    focusable: false,
    show: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  })

  // Les clics de souris traversent l'overlay pour ne pas bloquer le joueur en jeu
  overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  // Garder au premier plan absolu (même au-dessus des jeux plein écran sans bordure)
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  overlayWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] Overlay Desktop transparent chargé avec succès')
  })

  overlayWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron] Échec chargement Overlay (${errorCode}): ${errorDescription} - ${validatedURL}`)
  })

  const isDev = !app.isPackaged
  const rendererUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:3000'

  if (isDev) {
    console.log('[Electron] Chargement Overlay Desktop (Dev):', `${rendererUrl}/#/overlay`)
    overlayWindow.loadURL(`${rendererUrl}/#/overlay`)
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../renderer/index.html'), { hash: 'overlay' })
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
}

// Enregistrement des écouteurs IPC
function registerIpcHandlers() {
  // 1. Authentification Steam OpenID
  ipcMain.handle('steam:login', async () => {
    try {
      const user = await steamAuth.authenticate(mainWindow)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('steam:auth-status-changed', user)
      }
      return { success: true, user }
    } catch (error) {
      console.error('Erreur de connexion Steam:', error.message)
      return { success: false, error: error.message }
    }
  })

  // 2. Utilisateur courant
  ipcMain.handle('steam:get-current-user', () => {
    return steamAuth.getCurrentUser()
  })

  // 3. Déconnexion
  ipcMain.handle('steam:logout', () => {
    const result = steamAuth.logout()
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('steam:auth-status-changed', null)
    }
    return result
  })

  // 4. Ouvrir un lien externe
  ipcMain.handle('app:open-external', (_event, url) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      shell.openExternal(url)
      return true
    }
    return false
  })

  // 5. Statut du tracker de succès
  ipcMain.handle('steam:get-tracker-status', () => {
    return achievementTracker.getStatus()
  })

  // 6. Simulation d'un succès
  ipcMain.handle('steam:simulate-achievement', async (_event, params) => {
    const appId = params?.appId || '440'
    const achievementCode = params?.achievementCode || 'TF_PLAY_GAME_EVERYCLASS'
    await achievementTracker.simulateUnlock(appId, achievementCode)
    return { success: true }
  })

  // 7. Statut du serveur OBS
  ipcMain.handle('obs:get-server-status', () => {
    return obsServer.getStatus()
  })

  // 8. Récupération de la bibliothèque complète de thèmes
  ipcMain.handle('customization:get-library', () => {
    return customizationService.getLibrary()
  })

  // 9. Récupération du thème actif pour les overlays
  ipcMain.handle('customization:get-active', () => {
    return customizationService.getActiveTheme()
  })

  // Compatibilité ascendante : alias vers getActiveTheme
  ipcMain.handle('customization:get', () => {
    return customizationService.getActiveTheme()
  })

  // 10. Activation d'un thème précis pour les overlays
  ipcMain.handle('customization:set-active', (_event, themeId) => {
    const result = customizationService.setActiveTheme(themeId)
    if (result.success) {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('customization:updated', result.activeTheme)
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('customization:updated', result.activeTheme)
        mainWindow.webContents.send('customization:library-updated', result.library)
      }
      obsServer.broadcastCustomization(result.activeTheme)
    }
    return result
  })

  // 11. Sauvegarde / mise à jour d'un thème spécifique
  ipcMain.handle('customization:save-theme', (_event, themeData) => {
    const result = customizationService.saveTheme(themeData)
    if (result.success) {
      const activeTheme = customizationService.getActiveTheme()
      if (themeData.id === activeTheme.id) {
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.webContents.send('customization:updated', activeTheme)
        }
        obsServer.broadcastCustomization(activeTheme)
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('customization:library-updated', result.library)
        mainWindow.webContents.send('customization:updated', activeTheme)
      }
    }
    return result
  })

  // Compatibilité ascendante : sauvegarde du thème actif
  ipcMain.handle('customization:save', (_event, themeData) => {
    const active = customizationService.getActiveTheme()
    return customizationService.saveTheme({ ...active, ...themeData })
  })

  // 12. Création d'un nouveau thème
  ipcMain.handle('customization:create-theme', (_event, initialData) => {
    const result = customizationService.createTheme(initialData)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('customization:library-updated', result.library)
    }
    return result
  })

  // 13. Duplication d'un thème existant
  ipcMain.handle('customization:duplicate-theme', (_event, id) => {
    const result = customizationService.duplicateTheme(id)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('customization:library-updated', result.library)
    }
    return result
  })

  // 14. Suppression d'un thème avec confirmation
  ipcMain.handle('customization:delete-theme', (_event, id) => {
    const result = customizationService.deleteTheme(id)
    if (result.success) {
      const activeTheme = customizationService.getActiveTheme()
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('customization:updated', activeTheme)
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('customization:library-updated', result.library)
        mainWindow.webContents.send('customization:updated', activeTheme)
      }
      obsServer.broadcastCustomization(activeTheme)
    }
    return result
  })

  // 15. Réinitialisation au thème par défaut
  ipcMain.handle('customization:reset', () => {
    const defaultTheme = customizationService.reset()
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('customization:updated', defaultTheme)
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('customization:updated', defaultTheme)
      mainWindow.webContents.send('customization:library-updated', customizationService.getLibrary())
    }
    obsServer.broadcastCustomization(defaultTheme)
    return { success: true, theme: defaultTheme }
  })

  // 16. Boîte de dialogue pour sélectionner un fichier audio local
  ipcMain.handle('customization:select-audio', async () => {
    const win = mainWindow || overlayWindow
    const result = await dialog.showOpenDialog(win, {
      title: 'Sélectionner un fichier audio pour la notification',
      filters: [
        { name: 'Fichiers Audio', extensions: ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'] }
      ],
      properties: ['openFile']
    })

    if (!result.canceled && result.filePaths?.length > 0) {
      return { success: true, filePath: result.filePaths[0] }
    }
    return { success: false, canceled: true }
  })

  // 17. Récupération directe des données audio d'un fichier sous forme de Data URL Base64
  ipcMain.handle('customization:get-audio-data', (_event, specificPath) => {
    const theme = customizationService.getActiveTheme()
    const targetPath = specificPath || theme.audioPath
    if (targetPath && fs.existsSync(targetPath)) {
      try {
        const buffer = fs.readFileSync(targetPath)
        const ext = path.extname(targetPath).toLowerCase().replace('.', '')
        const mimeMap = {
          mp3: 'audio/mpeg',
          wav: 'audio/wav',
          ogg: 'audio/ogg',
          aac: 'audio/aac',
          flac: 'audio/flac',
          m4a: 'audio/mp4'
        }
        const mimeType = mimeMap[ext] || 'audio/mpeg'
        return {
          hasAudio: true,
          dataUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
          rawBuffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
        }
      } catch (err) {
        console.warn('[Main] Impossible de charger le fichier audio en Base64:', err.message)
      }
    }
    return { hasAudio: false, dataUrl: null, rawBuffer: null }
  })

  // 18. Récupération et sauvegarde de la clé Steam Web API
  ipcMain.handle('steam:get-api-key', () => {
    return settingsService.getSteamApiKey()
  })

  ipcMain.handle('steam:save-api-key', (_event, key) => {
    return settingsService.saveSteamApiKey(key)
  })

  // 19. Diffusion d'un faux succès de test (uniquement sur l'Overlay Écran et OBS)
  ipcMain.handle('steam:broadcast-test-achievement', (_event, customData) => {
    const achievementData = {
      appId: customData?.appId || '999999',
      achievementCode: customData?.achievementCode || 'TEST_NOTIFICATION',
      displayName: customData?.displayName || 'Ceci est un test',
      description: customData?.description || 'Bravo, tout fonctionne !',
      icon: customData?.icon || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      gameName: customData?.gameName || 'Test Game',
      unlockedAt: new Date().toISOString(),
      previewTheme: customData?.previewTheme || null,
      isTest: true
    }

    console.log('[Main] 🧪 Diffusion d\'un succès factice de test (Desktop + OBS uniquement) :', achievementData.displayName, customData?.previewTheme ? '(Mode Thème Preview)' : '')

    // A) Envoi prioritaire à l'overlay transparent en jeu (ÉCRAN)
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('steam:achievement-unlocked', achievementData)
    }

    // B) NOTE : Volontairement non envoyé au Dashboard mainWindow pour ne pas afficher le popup dans l'app

    // C) Diffusion WebSocket à toutes les sources OBS
    obsServer.broadcastAchievement(achievementData)

    return { success: true, achievement: achievementData }
  })
}

// Cycle de vie de l'application Electron
app.whenReady().then(() => {
  settingsService.init()
  customizationService.init()
  registerIpcHandlers()

  // 1. Démarrer les fenêtres
  createMainWindow()
  createOverlayWindow()

  // 2. Démarrer le serveur local OBS Express & WebSocket (port 8080)
  obsServer.start(8080, {
    onSimulateRequest: async (appId, code) => {
      await achievementTracker.simulateUnlock(appId, code)
    },
    onStatusChange: (status) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('obs:status-changed', status)
      }
    }
  })

  // 3. Démarrer l'écoute des logs Steam en temps réel
  achievementTracker.start((achievementData) => {
    console.log('[Main] 🚀 Succès débloqué :', achievementData.displayName)

    // A) Envoi prioritaire à la fenêtre d'overlay transparent (pour le joueur)
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('steam:achievement-unlocked', achievementData)
    }

    // B) Envoi au dashboard principal (pour mise à jour de l'historique et des logs)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('steam:achievement-unlocked', achievementData)
    }

    // C) Diffusion WebSocket à toutes les sources navigateur OBS connectées
    obsServer.broadcastAchievement(achievementData)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
      createOverlayWindow()
    }
  })
})

app.on('before-quit', () => {
  achievementTracker.stop()
  obsServer.stop()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
