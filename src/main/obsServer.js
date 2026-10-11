import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { customizationService } from './customizationService.js'

export class ObsServer {
  constructor() {
    this.port = 8080
    this.app = null
    this.server = null
    this.wss = null
    this.clients = new Set()
    this.isRunning = false
    this.lastAchievement = null
    this.onStatusChange = null
  }

  /**
   * Démarre le serveur Express et le serveur WebSocket pour OBS
   * @param {number} port - Port d'écoute (défaut 8080)
   * @param {Object} options - { onSimulateRequest, onStatusChange }
   */
  start(port = 8080, options = {}) {
    if (this.isRunning) return

    const onSimulateRequest = typeof options === 'function' ? options : options?.onSimulateRequest
    if (options?.onStatusChange) {
      this.onStatusChange = options.onStatusChange
    }

    this.port = parseInt(process.env.OBS_PORT || port, 10)
    this.app = express()
    this.server = http.createServer(this.app)
    this.wss = new WebSocketServer({ server: this.server })

    // 1. Journalisation des requêtes HTTP pour diagnostic immédiat
    this.app.use((req, _res, next) => {
      console.log(`[ObsServer HTTP] 🌐 ${req.method} ${req.url} (depuis ${req.socket.remoteAddress || 'inconnu'})`)
      next()
    })

    // 2. Middleware CORS pour autoriser l'accès depuis OBS et navigateurs
    this.app.use((_req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      next()
    })
    this.app.use(express.json())

    // 3. Gestion des connexions WebSocket (clients OBS Browser Source)
    this.wss.on('connection', (ws, req) => {
      this.clients.add(ws)
      const clientIp = req.socket.remoteAddress || 'inconnu'
      console.log(`[ObsServer WS] 🟢 SOURCE OBS CONNECTÉE depuis ${clientIp} ! (Total connectés: ${this.clients.size})`)
      this.notifyStatus()

      // Message de confirmation envoyé au client
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        message: 'Connecté au serveur OBS Steam Custom Achievements',
        port: this.port
      }))

      // Envoyer le thème de personnalisation actif dès la connexion
      const theme = customizationService.getTheme()
      ws.send(JSON.stringify({
        type: 'CUSTOMIZATION_UPDATED',
        data: {
          html: theme.html,
          css: theme.css,
          hasAudio: Boolean(theme.audioPath && fs.existsSync(theme.audioPath)),
          audioUrl: '/audio/custom',
          soundEnabled: theme.soundEnabled,
          soundVolume: theme.soundVolume
        }
      }))

      // Répondre aux pings / messages du client OBS
      ws.on('message', (message) => {
        try {
          const parsed = JSON.parse(message.toString())
          if (parsed.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG' }))
          } else if (parsed.type === 'OBS_CLIENT_READY') {
            console.log(`[ObsServer WS] 📺 Source OBS prête à recevoir les succès`)
          }
        } catch {
          // message non-JSON ignoré
        }
      })

      ws.on('close', () => {
        this.clients.delete(ws)
        console.log(`[ObsServer WS] 🔴 Source OBS déconnectée (Restant: ${this.clients.size})`)
        this.notifyStatus()
      })

      ws.on('error', (err) => {
        console.warn('[ObsServer WS] Erreur client:', err.message)
        this.clients.delete(ws)
        this.notifyStatus()
      })
    })

    // 4. Routes pour OBS : acceptent '/', '/obs', '/obs/'
    const serveOverlay = (_req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.send(this.getObsOverlayHtml())
    }
    this.app.get('/', serveOverlay)
    this.app.get('/obs', serveOverlay)
    this.app.get('/obs/', serveOverlay)

    // 5. Route pour servir le fichier audio personnalisé sélectionné par l'utilisateur
    this.app.get('/audio/custom', (_req, res) => {
      const theme = customizationService.getTheme()
      if (theme.audioPath && fs.existsSync(theme.audioPath)) {
        res.sendFile(path.resolve(theme.audioPath))
      } else {
        res.status(404).json({ error: 'Aucun fichier audio personnalisé' })
      }
    })

    // 6. Route API personnalisation : renvoie le thème actif et l'état audio
    this.app.get('/api/customization', (_req, res) => {
      const theme = customizationService.getTheme()
      res.json({
        html: theme.html,
        css: theme.css,
        hasAudio: Boolean(theme.audioPath && fs.existsSync(theme.audioPath)),
        audioUrl: '/audio/custom',
        soundEnabled: theme.soundEnabled,
        soundVolume: theme.soundVolume
      })
    })

    // 7. Route API statut : http://localhost:8080/api/status
    this.app.get('/api/status', (_req, res) => {
      res.json(this.getStatus())
    })

    // 8. Route API simulation : http://localhost:8080/api/simulate
    this.app.get('/api/simulate', async (req, res) => {
      const appId = req.query.appId || '440'
      const code = req.query.code || 'TF_PLAY_GAME_EVERYCLASS'

      if (onSimulateRequest) {
        await onSimulateRequest(appId, code)
      }
      res.json({ success: true, message: `Simulation envoyée pour AppID ${appId} : ${code}` })
    })

    // 9. Démarrage de l'écoute sur TOUTES les interfaces (dual-stack IPv4 et IPv6 pour Windows localhost)
    this.server.listen(this.port, () => {
      this.isRunning = true
      console.log(`[ObsServer] 📡 Serveur OBS & WebSocket actif sur :`)
      console.log(`            ➜ http://127.0.0.1:${this.port}/obs`)
      console.log(`            ➜ http://localhost:${this.port}/obs`)
      this.notifyStatus()
    })

    this.server.on('error', (err) => {
      console.error(`[ObsServer] ❌ Erreur du serveur sur le port ${this.port}:`, err.message)
    })
  }

  /**
   * Diffuse la mise à jour du thème en direct à toutes les sources OBS sans rechargement
   * @param {Object} themeData 
   */
  broadcastCustomization(themeData) {
    const payload = JSON.stringify({
      type: 'CUSTOMIZATION_UPDATED',
      data: {
        html: themeData.html,
        css: themeData.css,
        hasAudio: Boolean(themeData.audioPath && fs.existsSync(themeData.audioPath)),
        audioUrl: `/audio/custom?t=${Date.now()}`,
        soundEnabled: themeData.soundEnabled,
        soundVolume: themeData.soundVolume
      }
    })

    let sentCount = 0
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
        sentCount++
      }
    }
    console.log(`[ObsServer] 🎨 Thème personnalisé diffusé à ${sentCount} source(s) OBS`)
  }

  /**
   * Notifie les changements de statut au Main Process
   */
  notifyStatus() {
    if (typeof this.onStatusChange === 'function') {
      try {
        this.onStatusChange(this.getStatus())
      } catch (err) {
        console.error('[ObsServer] Erreur lors de la notification de statut:', err)
      }
    }
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
    this.notifyStatus()
  }

  /**
   * Retourne l'état actuel du serveur
   */
  getStatus() {
    return {
      status: this.isRunning ? 'online' : 'offline',
      isRunning: this.isRunning,
      port: this.port,
      obsUrl: `http://127.0.0.1:${this.port}/obs`,
      obsUrlLocalhost: `http://localhost:${this.port}/obs`,
      connectedClients: this.clients.size,
      lastAchievement: this.lastAchievement
    }
  }

  /**
   * Génère le HTML autonome pour OBS Browser Source avec injection dynamique du HTML/CSS et son
   */
  getObsOverlayHtml() {
    const theme = customizationService.getTheme()
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Steam Overlay OBS Browser Source</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* 100% transparent pour OBS Studio */
    html, body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      background: transparent !important;
      background-color: transparent !important;
      overflow: hidden;
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
      -webkit-font-smoothing: antialiased;
    }

    #overlay-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
    }

    /* Pastille de statut discrète (visible lors du positionnement dans OBS) */
    #status-pill {
      position: absolute;
      top: 16px;
      left: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 999px;
      background: rgba(14, 20, 27, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #a4b4cc;
      font-size: 12px;
      font-weight: 600;
      transition: opacity 0.8s ease;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }
    #status-pill.connected {
      border-color: rgba(92, 126, 16, 0.7);
      color: #a1cd44;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff5555;
    }
    #status-pill.connected .status-dot {
      background: #a1cd44;
      box-shadow: 0 0 8px #a1cd44;
    }
  </style>
  <!-- CSS Personnalisé injecté dynamiquement -->
  <style id="custom-theme-css">
${theme.css || ''}
  </style>
</head>
<body>
  <div id="overlay-container">
    <!-- Pastille de diagnostic OBS -->
    <div id="status-pill">
      <span class="status-dot"></span>
      <span id="status-text">OBS : Connexion au serveur...</span>
    </div>

    <!-- Zone de rendu dynamique du succès personnalisé -->
    <div id="achievement-slot"></div>
  </div>

  <script>
    const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
    const statusPill = document.getElementById('status-pill');
    const statusText = document.getElementById('status-text');
    const achSlot = document.getElementById('achievement-slot');
    const customCssElem = document.getElementById('custom-theme-css');

    let currentHtmlTemplate = ${JSON.stringify(theme.html || '')};
    let soundSettings = {
      hasAudio: ${Boolean(theme.audioPath && fs.existsSync(theme.audioPath))},
      audioUrl: '/audio/custom',
      soundEnabled: ${Boolean(theme.soundEnabled)},
      soundVolume: ${theme.soundVolume ?? 0.8}
    };

    let toastTimeout = null;
    let ws = null;
    let reconnectAttempts = 0;

    // Échappement des caractères HTML pour la sécurité
    function escapeHtml(text) {
      if (!text) return '';
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return text.toString().replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // Remplacement des placeholders {title}, {description}, {icon}, {game}
    function renderCustomHtml(template, item) {
      if (!template) return '';
      return template
        .replace(/\\{title\\}/gi, escapeHtml(item.displayName || 'Succès Débloqué'))
        .replace(/\\{description\\}/gi, escapeHtml(item.description || ''))
        .replace(/\\{icon\\}/gi, item.icon || fallbackIcon)
        .replace(/\\{game\\}/gi, escapeHtml(item.gameName || 'Steam'));
    }

    // Joue le son personnalisé ou le carillon Web Audio par défaut
    function playNotificationSound() {
      if (!soundSettings.soundEnabled) return;

      if (soundSettings.hasAudio && soundSettings.audioUrl) {
        try {
          const audio = new Audio(soundSettings.audioUrl);
          audio.volume = soundSettings.soundVolume ?? 0.8;
          audio.play().catch(function(err) {
            console.warn('[OBS Sound] Lecture audio personnalisée bloquée, fallback Web Audio:', err);
            playDefaultChime();
          });
          return;
        } catch (e) {
          console.warn('[OBS Sound] Erreur initialisation audio:', e);
        }
      }

      playDefaultChime();
    }

    // Carillon Web Audio par défaut
    function playDefaultChime() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const vol = soundSettings.soundVolume ?? 0.8;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.08 * vol, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.5);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, now + 0.12); // A5
        gain2.gain.setValueAtTime(0.09 * vol, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.75);
      } catch (e) {}
    }

    // Connexion WebSocket résiliente (alterne 127.0.0.1 et localhost)
    function connect() {
      const port = window.location.port || '8080';
      let host = window.location.hostname || '127.0.0.1';
      if (reconnectAttempts % 2 === 1) {
        host = host === '127.0.0.1' ? 'localhost' : '127.0.0.1';
      }

      const wsUrl = 'ws://' + host + ':' + port;
      console.log('[OBS Overlay] Connexion WebSocket vers', wsUrl);

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = function() {
          console.log('[OBS Overlay] ✔ Connecté au serveur OBS via', wsUrl);
          reconnectAttempts = 0;
          statusPill.classList.add('connected');
          statusText.textContent = 'OBS Source Connectée (Port ' + port + ')';

          ws.send(JSON.stringify({ type: 'OBS_CLIENT_READY' }));

          setTimeout(function() {
            statusPill.style.opacity = '0';
          }, 4000);
        };

        ws.onmessage = function(event) {
          try {
            const payload = JSON.parse(event.data);

            if (payload.type === 'CUSTOMIZATION_UPDATED' && payload.data) {
              console.log('[OBS Overlay] 🎨 Mise à jour du thème reçue');
              if (payload.data.html) currentHtmlTemplate = payload.data.html;
              if (payload.data.css) customCssElem.textContent = payload.data.css;
              soundSettings = {
                hasAudio: payload.data.hasAudio,
                audioUrl: payload.data.audioUrl,
                soundEnabled: payload.data.soundEnabled,
                soundVolume: payload.data.soundVolume
              };
            } else if (payload.type === 'ACHIEVEMENT_UNLOCKED' && payload.data) {
              console.log('[OBS Overlay] 🏆 Succès reçu :', payload.data.displayName);
              displayAchievement(payload.data);
            }
          } catch (e) {
            console.error('[OBS Overlay] Erreur message:', e);
          }
        };

        ws.onclose = function() {
          statusPill.classList.remove('connected');
          statusPill.style.opacity = '1';
          reconnectAttempts++;
          statusText.textContent = 'OBS : Reconnexion... (' + reconnectAttempts + ')';
          setTimeout(connect, 1500);
        };

        ws.onerror = function(err) {
          console.warn('[OBS Overlay] Erreur WebSocket:', err);
          ws.close();
        };
      } catch (e) {
        setTimeout(connect, 2000);
      }
    }

    // Affiche le succès pendant 5 secondes avec injection du HTML/CSS personnalisé
    function displayAchievement(data) {
      if (toastTimeout) {
        clearTimeout(toastTimeout);
      }

      // 1. Jouer le son
      playNotificationSound();

      // 2. Générer le HTML personnalisé avec les données remplacées
      const rendered = renderCustomHtml(currentHtmlTemplate, data);
      achSlot.innerHTML = rendered;

      // 3. Ajouter la classe d'animation d'entrée
      const rootNode = achSlot.firstElementChild;
      if (rootNode) {
        rootNode.classList.remove('animate-leave');
        rootNode.classList.add('animate-enter');
      }

      // 4. Après 5 secondes : animation de sortie puis nettoyage
      toastTimeout = setTimeout(function() {
        if (rootNode) {
          rootNode.classList.remove('animate-enter');
          rootNode.classList.add('animate-leave');
        }

        setTimeout(function() {
          achSlot.innerHTML = '';
        }, 400);
      }, 5000);
    }

    connect();
  </script>
</body>
</html>`
  }
}

export const obsServer = new ObsServer()
