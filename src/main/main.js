import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { steamAuth } from './steamAuth.js'
import { achievementTracker } from './achievementTracker.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow = null

function createWindow() {
  const preloadPath = path.join(__dirname, '../preload/index.js')

  mainWindow = new BrowserWindow({
    width: 1050,
    height: 720,
    minWidth: 850,
    minHeight: 600,
    title: 'Steam Custom Achievements',
    backgroundColor: '#0e141b',
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Log en cas d'erreur de chargement de l'URL
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron] Échec chargement URL (${errorCode}): ${errorDescription} - ${validatedURL}`)
  })

  // Ouvrir les liens externes (_blank, profils Steam, etc.) dans le navigateur par défaut de l'OS
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // Chargement en mode dev (serveur Vite) ou prod (bundle HTML)
  const isDev = !app.isPackaged
  const rendererUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:3000'

  if (isDev) {
    console.log('[Electron] Chargement URL de développement:', rendererUrl)
    mainWindow.loadURL(rendererUrl)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.show()
  mainWindow.focus()

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Enregistrement des écouteurs IPC
function registerIpcHandlers() {
  // 1. Déclencher le flux d'authentification Steam OpenID
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

  // 2. Récupérer l'utilisateur actuellement connecté
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

  // 4. Ouvrir une URL externe (ex: profil Steam)
  ipcMain.handle('app:open-external', (_event, url) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      shell.openExternal(url)
      return true
    }
    return false
  })

  // 5. Statut du tracker de succès en temps réel
  ipcMain.handle('steam:get-tracker-status', () => {
    return achievementTracker.getStatus()
  })

  // 6. Simulation d'un succès (pour tester facilement l'overlay)
  ipcMain.handle('steam:simulate-achievement', async (_event, params) => {
    const appId = params?.appId || '440'
    const achievementCode = params?.achievementCode || 'TF_PLAY_GAME_EVERYCLASS'
    await achievementTracker.simulateUnlock(appId, achievementCode)
    return { success: true }
  })
}

// Cycle de vie de l'application Electron
app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  // Démarrage de l'écoute des logs Steam en temps réel
  achievementTracker.start((achievementData) => {
    console.log('[Main] Émission du succès vers Vue.js :', achievementData.displayName)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('steam:achievement-unlocked', achievementData)
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  achievementTracker.stop()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
