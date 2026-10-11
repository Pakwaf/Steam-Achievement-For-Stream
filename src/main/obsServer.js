import http from 'node:http'
import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'

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
    // Sert la page HTML autonome avec styles transparents et animation 5s
    const serveOverlay = (_req, res) => {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.send(this.getObsOverlayHtml())
    }
    this.app.get('/', serveOverlay)
    this.app.get('/obs', serveOverlay)
    this.app.get('/obs/', serveOverlay)

    // 5. Route API statut : http://localhost:8080/api/status
    this.app.get('/api/status', (_req, res) => {
      res.json(this.getStatus())
    })

    // 6. Route API simulation : http://localhost:8080/api/simulate
    this.app.get('/api/simulate', async (req, res) => {
      const appId = req.query.appId || '440'
      const code = req.query.code || 'TF_PLAY_GAME_EVERYCLASS'

      if (onSimulateRequest) {
        await onSimulateRequest(appId, code)
      }
      res.json({ success: true, message: `Simulation envoyée pour AppID ${appId} : ${code}` })
    })

    // 7. Démarrage de l'écoute sur TOUTES les interfaces (dual-stack IPv4 et IPv6 pour Windows localhost)
    // NOTE TRÈS IMPORTANTE : Ne PAS spécifier '0.0.0.0' car sur Windows cela désactive IPv6,
    // ce qui bloque OBS Browser Source qui résout 'localhost' en '::1'.
    this.server.listen(this.port, () => {
      this.isRunning = true
      console.log(`[ObsServer] 📡 Serveur OBS & WebSocket actif sur :`)
      console.log(`            ➜ http://localhost:${this.port}/obs`)
      console.log(`            ➜ http://127.0.0.1:${this.port}/obs`)
      this.notifyStatus()
    })

    this.server.on('error', (err) => {
      console.error(`[ObsServer] ❌ Erreur du serveur sur le port ${this.port}:`, err.message)
    })
  }

  /**
   * Notifie les changements de statut (notamment le nombre de clients OBS) au Main Process
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
   * Génère le HTML autonome, transparent et réactif servi à OBS Browser Source
   */
  getObsOverlayHtml() {
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

    /* Bannière Toast de Succès (Coin inférieur droit par défaut) */
    .achievement-banner {
      position: absolute;
      bottom: 30px;
      right: 30px;
      width: 440px;
      max-width: calc(100vw - 60px);
      background: rgba(14, 20, 29, 0.96);
      border-radius: 14px;
      border: 1px solid rgba(240, 195, 48, 0.6);
      box-shadow: 
        0 20px 48px rgba(0, 0, 0, 0.85),
        0 0 32px rgba(240, 195, 48, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.15);
      overflow: hidden;
      display: none;
      z-index: 9999;
    }

    /* Animations d'entrée / sortie (5 secondes totales) */
    .achievement-banner.entering {
      display: block;
      animation: slideUpFadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .achievement-banner.exiting {
      display: block;
      animation: slideDownFadeOut 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
    }

    @keyframes slideUpFadeIn {
      from {
        opacity: 0;
        transform: translateY(40px) scale(0.94);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes slideDownFadeOut {
      from {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      to {
        opacity: 0;
        transform: translateY(30px) scale(0.96);
      }
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
    }

    .icon-wrapper {
      position: relative;
      width: 64px;
      height: 64px;
      flex-shrink: 0;
      border-radius: 10px;
      overflow: hidden;
      border: 2px solid #f0c330;
      box-shadow: 0 0 16px rgba(240, 195, 48, 0.45);
      background: #090d13;
    }

    .achievement-icon {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .icon-sheen {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        135deg,
        transparent 40%,
        rgba(255, 255, 255, 0.35) 50%,
        transparent 60%
      );
      animation: shine 4s infinite;
      pointer-events: none;
    }

    @keyframes shine {
      0% { transform: translate(-80%, -80%); }
      35%, 100% { transform: translate(80%, 80%); }
    }

    .details {
      flex: 1;
      min-width: 0;
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 3px;
    }

    .game-name {
      font-size: 11px;
      font-weight: 700;
      color: #66c0f4;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 170px;
    }

    .badge-unlocked {
      font-size: 11px;
      font-weight: 800;
      color: #f0c330;
      letter-spacing: 0.08em;
      text-shadow: 0 0 10px rgba(240, 195, 48, 0.5);
      white-space: nowrap;
    }

    .achievement-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 3px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
    }

    .achievement-desc {
      font-size: 12.5px;
      color: #a4b4cc;
      margin: 0;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* Compte à rebours progressif de 5 secondes */
    .countdown-bar {
      height: 3px;
      background: linear-gradient(90deg, #f0c330, #ffe680);
      width: 100%;
      animation: countdown 5s linear forwards;
    }

    @keyframes countdown {
      from { width: 100%; }
      to { width: 0%; }
    }
  </style>
</head>
<body>
  <div id="overlay-container">
    <!-- Indicateur d'état pour OBS -->
    <div id="status-pill">
      <span class="status-dot"></span>
      <span id="status-text">OBS : Connexion au serveur...</span>
    </div>

    <!-- Toast du succès débloqué -->
    <div id="achievement-toast" class="achievement-banner">
      <div class="banner-content">
        <div class="icon-wrapper">
          <img id="ach-icon" class="achievement-icon" src="" alt="Icon" />
          <div class="icon-sheen"></div>
        </div>
        <div class="details">
          <div class="meta-row">
            <span id="ach-game" class="game-name">Steam</span>
            <span class="badge-unlocked">SUCCÈS DÉBLOQUÉ !</span>
          </div>
          <h3 id="ach-title" class="achievement-title"></h3>
          <p id="ach-desc" class="achievement-desc"></p>
        </div>
      </div>
      <div id="countdown" class="countdown-bar"></div>
    </div>
  </div>

  <script>
    const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
    const statusPill = document.getElementById('status-pill');
    const statusText = document.getElementById('status-text');
    const toast = document.getElementById('achievement-toast');
    const achIcon = document.getElementById('ach-icon');
    const achGame = document.getElementById('ach-game');
    const achTitle = document.getElementById('ach-title');
    const achDesc = document.getElementById('ach-desc');
    const countdown = document.getElementById('countdown');

    let toastTimeout = null;
    let ws = null;
    let reconnectAttempts = 0;

    achIcon.onerror = function() {
      achIcon.src = fallbackIcon;
    };

    // Joue un discret carillon audio avec Web Audio API
    function playChime() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.5);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, now + 0.12); // A5
        gain2.gain.setValueAtTime(0.09, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.75);
      } catch (e) {
        // Audio facultatif ignoré si autoplay restreint
      }
    }

    // Connexion WebSocket résiliente avec bascule automatique localhost <-> 127.0.0.1
    function connect() {
      const port = window.location.port || '8080';
      // Alterne entre l'hôte actuel et 127.0.0.1 pour contourner les blocages IPv6 Windows
      let host = window.location.hostname || 'localhost';
      if (reconnectAttempts % 2 === 1 && host === 'localhost') {
        host = '127.0.0.1';
      } else if (reconnectAttempts % 2 === 1 && host === '127.0.0.1') {
        host = 'localhost';
      }

      const wsUrl = 'ws://' + host + ':' + port;
      console.log('[OBS Overlay] Tentative connexion WebSocket vers', wsUrl);

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = function() {
          console.log('[OBS Overlay] ✔ Connecté au serveur OBS via', wsUrl);
          reconnectAttempts = 0;
          statusPill.classList.add('connected');
          statusText.textContent = 'OBS Source Connectée (Port ' + port + ')';

          // Prévient le serveur que la source OBS est prête
          ws.send(JSON.stringify({ type: 'OBS_CLIENT_READY' }));

          // Masque la pastille après 4 secondes pour que l'overlay soit 100% propre
          setTimeout(function() {
            statusPill.style.opacity = '0';
          }, 4000);
        };

        ws.onmessage = function(event) {
          try {
            const payload = JSON.parse(event.data);
            console.log('[OBS Overlay] Message reçu :', payload.type);

            if (payload.type === 'ACHIEVEMENT_UNLOCKED' && payload.data) {
              displayAchievement(payload.data);
            }
          } catch (e) {
            console.error('[OBS Overlay] Erreur traitement message:', e);
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
        console.error('[OBS Overlay] Exception WebSocket:', e);
        setTimeout(connect, 2000);
      }
    }

    // Affiche le succès pendant 5 secondes avec animations CSS
    function displayAchievement(data) {
      if (toastTimeout) {
        clearTimeout(toastTimeout);
      }

      playChime();

      achIcon.src = data.icon || fallbackIcon;
      achGame.textContent = data.gameName || 'Steam';
      achTitle.textContent = data.displayName || 'Succès Débloqué';
      achDesc.textContent = data.description || '';

      // Relance l'animation de la barre de progression
      countdown.style.animation = 'none';
      void countdown.offsetWidth; // Force reflow
      countdown.style.animation = 'countdown 5s linear forwards';

      // Affichage avec animation d'entrée
      toast.classList.remove('exiting');
      toast.classList.add('entering');

      // Après 5 secondes : animation de sortie
      toastTimeout = setTimeout(function() {
        toast.classList.remove('entering');
        toast.classList.add('exiting');

        setTimeout(function() {
          toast.classList.remove('exiting');
          toast.style.display = 'none';
        }, 360);
      }, 5000);
    }

    // Démarrage de la connexion
    connect();
  </script>
</body>
</html>`
  }
}

export const obsServer = new ObsServer()
