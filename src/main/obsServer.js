import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { customizationService, DEFAULT_THEME } from './customizationService.js'

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
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range')
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length')
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
      const hasAudio = Boolean(theme.audioPath && fs.existsSync(theme.audioPath))
      ws.send(JSON.stringify({
        type: 'CUSTOMIZATION_UPDATED',
        data: {
          html: theme.html || DEFAULT_THEME.html,
          css: theme.css || DEFAULT_THEME.css,
          hasAudio,
          audioUrl: hasAudio ? `/audio/custom?_v=${Date.now()}` : null,
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
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
      res.send(this.getObsOverlayHtml())
    }
    this.app.get('/', serveOverlay)
    this.app.get('/obs', serveOverlay)
    this.app.get('/obs/', serveOverlay)

    // 5. Route pour servir le fichier audio personnalisé sélectionné par l'utilisateur (sans aucun cache)
    this.app.get('/audio/custom', (_req, res) => {
      const theme = customizationService.getTheme()
      if (theme.audioPath && fs.existsSync(theme.audioPath)) {
        const ext = path.extname(theme.audioPath).toLowerCase().replace('.', '')
        const mimeMap = {
          mp3: 'audio/mpeg',
          wav: 'audio/wav',
          ogg: 'audio/ogg',
          aac: 'audio/aac',
          flac: 'audio/flac',
          m4a: 'audio/mp4'
        }
        res.setHeader('Content-Type', mimeMap[ext] || 'audio/mpeg')
        res.setHeader('Accept-Ranges', 'bytes')
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
        res.setHeader('Pragma', 'no-cache')
        res.setHeader('Expires', '0')
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
    const hasAudio = Boolean(themeData.audioPath && fs.existsSync(themeData.audioPath))
    const payload = JSON.stringify({
      type: 'CUSTOMIZATION_UPDATED',
      data: {
        html: themeData.html,
        css: themeData.css,
        hasAudio,
        audioUrl: hasAudio ? `/audio/custom?_v=${Date.now()}` : null,
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
      background: rgba(14, 20, 29, 0.9);
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

    /* Zone de rendu plein écran pour OBS */
    #achievement-slot {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      overflow: hidden;
    }
  </style>
  <!-- CSS Personnalisé injecté dynamiquement -->
  <style id="custom-theme-css">
${theme.css || DEFAULT_THEME.css}
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

    <!-- Élément audio persistant dans le DOM pour OBS -->
    <audio id="obs-audio-element" style="display:none;" preload="auto"></audio>
  </div>

  <script>
    const defaultHtml = ${JSON.stringify(DEFAULT_THEME.html)};
    const defaultCss = ${JSON.stringify(DEFAULT_THEME.css)};
    const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
    const statusPill = document.getElementById('status-pill');
    const statusText = document.getElementById('status-text');
    const achSlot = document.getElementById('achievement-slot');
    const customCssElem = document.getElementById('custom-theme-css');

    const initialHasAudio = ${Boolean(theme.audioPath && fs.existsSync(theme.audioPath))};
    let currentHtmlTemplate = ${JSON.stringify(theme.html || DEFAULT_THEME.html)};
    let soundSettings = {
      hasAudio: initialHasAudio,
      audioUrl: initialHasAudio ? '/audio/custom?_v=' + Date.now() : null,
      soundEnabled: ${Boolean(theme.soundEnabled)},
      soundVolume: ${theme.soundVolume ?? 0.8}
    };

    let audioCtx = null;
    let customAudioBuffer = null;
    let toastTimeout = null;
    let ws = null;
    let reconnectAttempts = 0;

    // Contexte Web Audio API partagé et résilient pour OBS CEF
    function getAudioCtx() {
      if (!audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtx = new AudioCtx();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(function() {});
      }
      return audioCtx;
    }

    // Précharge et décode le fichier audio en mémoire vive dès le chargement ou la mise à jour
    async function preloadAudioFile(url) {
      if (!url) {
        customAudioBuffer = null;
        return;
      }
      const ctx = getAudioCtx();
      if (!ctx) return;

      try {
        const sep = url.indexOf('?') !== -1 ? '&' : '?';
        const fetchUrl = url + sep + '_obs=' + Date.now();
        console.log('[OBS Sound] 📥 Chargement du fichier audio en cours :', fetchUrl);
        const res = await fetch(fetchUrl);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const arrayBuf = await res.arrayBuffer();
        customAudioBuffer = await ctx.decodeAudioData(arrayBuf);
        console.log('[OBS Sound] ✔ Nouveau fichier audio personnalisé décodé et prêt en mémoire !');
      } catch (err) {
        console.warn('[OBS Sound] Impossible de charger l\'audio personnalisé, repli prévu:', err.message);
        customAudioBuffer = null;
      }
    }

    // Préchargement initial dès le démarrage de la page OBS
    if (soundSettings.hasAudio && soundSettings.audioUrl) {
      preloadAudioFile(soundSettings.audioUrl);
    }

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

    // Joue le son personnalisé via Web Audio API (0ms de latence, zéro bug de cache) ou le carillon
    function playNotificationSound() {
      if (!soundSettings.soundEnabled) return;

      const vol = Math.min(1, Math.max(0, soundSettings.soundVolume ?? 0.8));

      // 1. Jouer directement le buffer décodé en mémoire
      if (soundSettings.hasAudio && customAudioBuffer) {
        try {
          const ctx = getAudioCtx();
          if (ctx) {
            const source = ctx.createBufferSource();
            source.buffer = customAudioBuffer;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            source.connect(gain);
            gain.connect(ctx.destination);
            source.start(0);
            console.log('[OBS Sound] 🔊 Son personnalisé joué avec succès via Web Audio !');
            return;
          }
        } catch (e) {
          console.warn('[OBS Sound] Erreur lecture buffer Web Audio:', e);
        }
      }

      // 2. Si le buffer n'était pas encore préchargé : tentative de chargement d'urgence
      if (soundSettings.hasAudio && soundSettings.audioUrl) {
        try {
          const ctx = getAudioCtx();
          if (ctx) {
            fetch(soundSettings.audioUrl + '&_now=' + Date.now())
              .then(function(r) { return r.arrayBuffer(); })
              .then(function(buf) { return ctx.decodeAudioData(buf); })
              .then(function(decoded) {
                customAudioBuffer = decoded;
                const source = ctx.createBufferSource();
                source.buffer = decoded;
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(vol, ctx.currentTime);
                source.connect(gain);
                gain.connect(ctx.destination);
                source.start(0);
                console.log('[OBS Sound] 🔊 Son personnalisé joué à la volée !');
              })
              .catch(function() {
                playDefaultChime();
              });
            return;
          }
        } catch (e) {}
      }

      // 3. Repli au carillon par défaut
      playDefaultChime();
    }

    // Carillon Web Audio par défaut (harmonisé et bien audible)
    function playDefaultChime() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = getAudioCtx();
        if (!ctx) return;

        const now = ctx.currentTime;
        const vol = Math.min(1, Math.max(0, soundSettings.soundVolume ?? 0.8)) * 0.35;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        gain1.gain.setValueAtTime(vol * 0.9, now);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.46);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, now + 0.1); // A5
        gain2.gain.setValueAtTime(vol * 1.0, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.76);
      } catch (e) {}
    }

    // Connexion WebSocket résiliente (priorité absolue à 127.0.0.1 sous Windows pour OBS CEF)
    function connect() {
      const port = window.location.port || '8080';
      let host = '127.0.0.1';
      if (window.location.hostname && window.location.hostname !== 'localhost') {
        host = window.location.hostname;
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
              console.log('[OBS Overlay] 🎨 Mise à jour du thème reçue :', payload.data);
              if (payload.data.html && payload.data.html.trim()) {
                currentHtmlTemplate = payload.data.html;
              }
              if (payload.data.css) {
                customCssElem.textContent = payload.data.css;
              }
              soundSettings = {
                hasAudio: payload.data.hasAudio,
                audioUrl: payload.data.audioUrl,
                soundEnabled: payload.data.soundEnabled,
                soundVolume: payload.data.soundVolume
              };

              // Rechargement immédiat du nouveau son en mémoire dans OBS !
              if (soundSettings.hasAudio && soundSettings.audioUrl) {
                preloadAudioFile(soundSettings.audioUrl);
              } else {
                customAudioBuffer = null;
              }
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
      if (!data) return;
      console.log('[OBS Overlay] 🏆 Affichage du succès :', data.displayName);
      if (toastTimeout) {
        clearTimeout(toastTimeout);
      }

      // 1. Jouer le son avec tolérance d'erreur
      try {
        playNotificationSound();
      } catch (err) {
        console.warn('[OBS Sound] Erreur son:', err);
      }

      // 2. Générer le HTML personnalisé avec les données remplacées (fallback garanti)
      const tpl = (currentHtmlTemplate && currentHtmlTemplate.trim()) ? currentHtmlTemplate : defaultHtml;
      const rendered = renderCustomHtml(tpl, data);
      achSlot.innerHTML = rendered;

      // 3. Ajouter la classe d'animation d'entrée avec force reflow
      const rootNode = achSlot.firstElementChild;
      if (rootNode) {
        rootNode.classList.remove('animate-leave');
        void rootNode.offsetWidth;
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
        }, 450);
      }, 5000);
    }

    connect();
  </script>
</body>
</html>`
  }
}

export const obsServer = new ObsServer()
