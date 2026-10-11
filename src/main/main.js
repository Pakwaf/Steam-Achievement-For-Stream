import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, ipcMain, shell, screen } from 'electron'
import { steamAuth } from './steamAuth.js'
import { achievementTracker } from './achievementTracker.js'
import { obsServer } from './obsServer.js'

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
}

// Cycle de vie de l'application Electron
app.whenReady().then(() => {
  registerIpcHandlers()

  // 1. Démarrer les fenêtres
  createMainWindow()
  createOverlayWindow()

  // 2. Démarrer le serveur local OBS Express & WebSocket (port 8080)
  obsServer.start(8080, async (appId, code) => {
    await achievementTracker.simulateUnlock(appId, code)
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
