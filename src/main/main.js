import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, ipcMain, shell, screen, dialog } from 'electron'
import { steamAuth } from './steamAuth.js'
import { achievementTracker } from './achievementTracker.js'
import { obsServer } from './obsServer.js'
import { customizationService } from './customizationService.js'

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
      nodeIntegration: false
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
      nodeIntegration: false
    }
  })

  // Les clics de souris traversent l'overlay pour ne pas bloquer le joueur en jeu
  overlayWindow.setIgnoreMouseEvents(true, { forward: true })
  // Garder au premier plan absolu (même au-dessus des jeux plein écran sans bordure)
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')

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

  // 8. Récupération du thème de personnalisation (HTML, CSS, Audio)
  ipcMain.handle('customization:get', () => {
    return customizationService.getTheme()
  })

  // 9. Sauvegarde du thème de personnalisation
  ipcMain.handle('customization:save', (_event, themeData) => {
    const saved = customizationService.save(themeData)
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('customization:updated', saved)
    }
    obsServer.broadcastCustomization(saved)
    return { success: true, theme: saved }
  })

  // 10. Réinitialisation au thème par défaut
  ipcMain.handle('customization:reset', () => {
    const defaultTheme = customizationService.reset()
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('customization:updated', defaultTheme)
    }
    obsServer.broadcastCustomization(defaultTheme)
    return { success: true, theme: defaultTheme }
  })

  // 11. Boîte de dialogue pour sélectionner un fichier audio local
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

  // 12. Récupération directe des données audio personnalisées sous forme de Data URL Base64
  ipcMain.handle('customization:get-audio-data', () => {
    const theme = customizationService.getTheme()
    if (theme.audioPath && fs.existsSync(theme.audioPath)) {
      try {
        const buffer = fs.readFileSync(theme.audioPath)
        const ext = path.extname(theme.audioPath).toLowerCase().replace('.', '')
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
          dataUrl: `data:${mimeType};base64,${buffer.toString('base64')}`
        }
      } catch (err) {
        console.warn('[Main] Impossible de charger le fichier audio en Base64:', err.message)
      }
    }
    return { hasAudio: false, dataUrl: null }
  })

  // 13. Diffusion d'un faux succès de test dans tout le pipeline (Desktop + OBS + Logs)
  ipcMain.handle('steam:broadcast-test-achievement', (_event, customData) => {
    const achievementData = {
      appId: customData?.appId || '999999',
      achievementCode: customData?.achievementCode || 'TEST_NOTIFICATION',
      displayName: customData?.displayName || 'Ceci est un test',
      description: customData?.description || 'Bravo, tout fonctionne !',
      icon: customData?.icon || 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      gameName: customData?.gameName || 'Test Game',
      unlockedAt: new Date().toISOString()
    }

    console.log('[Main] 🧪 Diffusion d\'un succès factice de test :', achievementData.displayName)

    // A) Envoi prioritaire à l'overlay transparent en jeu
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.webContents.send('steam:achievement-unlocked', achievementData)
    }

    // B) Envoi au dashboard principal pour affichage dans l'historique
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('steam:achievement-unlocked', achievementData)
    }

    // C) Diffusion WebSocket à toutes les sources OBS
    obsServer.broadcastAchievement(achievementData)

    return { success: true, achievement: achievementData }
  })
}

// Cycle de vie de l'application Electron
app.whenReady().then(() => {
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
