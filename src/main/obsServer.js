import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class ObsServer {
  constructor() {
    this.port = 8080
    this.app = null
    this.server = null
    this.wss = null
    this.clients = new Set()
    this.isRunning = false
    this.lastAchievement = null
  }

  /**
   * Démarre le serveur Express et le serveur WebSocket pour OBS
   * @param {number} port - Port d'écoute (défaut 8080)
   * @param {Function} onSimulateRequest - Callback si une simulation est déclenchée via l'API HTTP
   */
  start(port = 8080, onSimulateRequest = null) {
    if (this.isRunning) return

    this.port = parseInt(process.env.OBS_PORT || port, 10)
    this.app = express()
    this.server = http.createServer(this.app)
    this.wss = new WebSocketServer({ server: this.server })

    // 1. Gestion des connexions WebSocket (clients OBS Overlay)
    this.wss.on('connection', (ws, req) => {
      this.clients.add(ws)
      console.log(`[ObsServer] Nouveau client OBS connecté depuis ${req.socket.remoteAddress} (Total: ${this.clients.size})`)

      // Message de bienvenue et confirmation
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        message: 'Connecté au serveur OBS Steam Custom Achievements',
        port: this.port
      }))

      // Si un succès récent a été débloqué il y a moins de 10s, on peut le renvoyer
      if (this.lastAchievement) {
        ws.send(JSON.stringify({
          type: 'LAST_ACHIEVEMENT',
          data: this.lastAchievement
        }))
      }

      ws.on('close', () => {
        this.clients.delete(ws)
        console.log(`[ObsServer] Client OBS déconnecté (Restants: ${this.clients.size})`)
      })

      ws.on('error', (err) => {
        console.warn('[ObsServer] Erreur WebSocket client:', err.message)
        this.clients.delete(ws)
      })
    })

    // 2. Middleware Express
    this.app.use(express.json())

    // En production, servir les fichiers statiques du renderer
    const rendererDistPath = path.join(__dirname, '../renderer')
    this.app.use(express.static(rendererDistPath))

    // Route spéciale pour OBS Browser Source : http://localhost:8080/obs
    this.app.get('/obs', (_req, res) => {
      const isDev = process.env.NODE_ENV !== 'production' && Boolean(process.env.ELECTRON_RENDERER_URL)
      const devUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:3000'

      if (isDev) {
        // En développement, rediriger vers la route OBS du serveur Vite
        res.redirect(`${devUrl}/#/obs`)
      } else {
        // En production, servir le fichier index.html avec le hash #/obs
        res.sendFile(path.join(rendererDistPath, 'index.html'))
      }
    })

    // Route API pour vérifier l'état du serveur
    this.app.get('/api/status', (_req, res) => {
      res.json({
        status: 'online',
        port: this.port,
        connectedClients: this.clients.size,
        lastAchievement: this.lastAchievement
      })
    })

    // Route API pour déclencher un test directement depuis le navigateur
    this.app.get('/api/simulate', async (req, res) => {
      const appId = req.query.appId || '440'
      const code = req.query.code || 'TF_PLAY_GAME_EVERYCLASS'

      if (onSimulateRequest) {
        await onSimulateRequest(appId, code)
      }
      res.json({ success: true, message: `Simulation envoyée pour AppID ${appId} : ${code}` })
    })

    // 3. Démarrage de l'écoute HTTP / WebSocket
    this.server.listen(this.port, () => {
      this.isRunning = true
      console.log(`[ObsServer] 📡 Serveur OBS & WebSocket actif sur http://localhost:${this.port}/obs`)
    })

    this.server.on('error', (err) => {
      console.error(`[ObsServer] Erreur du serveur sur le port ${this.port}:`, err.message)
    })
  }

  /**
   * Diffuse les données d'un succès débloqué à toutes les sources OBS connectées
   * @param {Object} achievementData 
   */
  broadcastAchievement(achievementData) {
    this.lastAchievement = achievementData
    const payload = JSON.stringify({
      type: 'ACHIEVEMENT_UNLOCKED',
      data: achievementData
    })

    let sentCount = 0
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
        sentCount++
      }
    }
    console.log(`[ObsServer] 📢 Succès diffusé à ${sentCount} source(s) OBS connectée(s) :`, achievementData.displayName)
  }

  /**
   * Arrête le serveur
   */
  stop() {
    if (this.wss) {
      for (const client of this.clients) {
        client.terminate()
      }
      this.clients.clear()
      this.wss.close()
    }
    if (this.server) {
      this.server.close()
    }
    this.isRunning = false
    console.log('[ObsServer] Serveur OBS arrêté.')
  }

  /**
   * Retourne l'état actuel du serveur pour le dashboard
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      obsUrl: `http://localhost:${this.port}/obs`,
      connectedClients: this.clients.size
    }
  }
}

export const obsServer = new ObsServer()
