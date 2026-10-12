use crate::models::{Achievement, ObsStatus};
use axum::{
    extract::{
        ws::{rejection::WebSocketUpgradeRejection, Message, WebSocket, WebSocketUpgrade},
        State,
    },
    http::{header, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::get,
    Router,
};
use futures_util::{SinkExt, StreamExt};
use std::path::PathBuf;
use std::sync::{
    atomic::{AtomicBool, AtomicU16, AtomicUsize, Ordering},
    Arc,
};
use tauri::{AppHandle, Emitter};
use tokio::sync::{broadcast, watch, RwLock};
use tower_http::cors::CorsLayer;

pub const DEFAULT_HTML: &str = r#"<div class="custom-achievement-card">
  <div class="card-glow"></div>
  <div class="card-body">
    <div class="icon-container">
      <img src="{icon}" alt="{title}" class="ach-icon" />
      <div class="icon-sheen"></div>
    </div>
    <div class="text-content">
      <div class="meta-line">
        <span class="game-tag">{game}</span>
        <span class="unlock-tag">SUCCÈS DÉBLOQUÉ</span>
      </div>
      <h3 class="ach-title">{title}</h3>
      <p class="ach-desc">{description}</p>
    </div>
  </div>
  <div class="progress-countdown"></div>
</div>"#;

pub const DEFAULT_CSS: &str = r#"/* Conteneur principal de la notification */
.custom-achievement-card {
  position: fixed;
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
  font-family: 'Outfit', sans-serif;
  color: #fff;
  user-select: none;
  z-index: 999999;
}

.card-glow {
  position: absolute;
  top: -20px;
  left: -20px;
  width: 90px;
  height: 90px;
  background: radial-gradient(circle, rgba(240, 195, 48, 0.3) 0%, transparent 70%);
  pointer-events: none;
}

.card-body {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
}

.icon-container {
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

.ach-icon {
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
  background: linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.35) 50%, transparent 60%);
  animation: ach-sheen 4s infinite;
  pointer-events: none;
}

@keyframes ach-sheen {
  0% { transform: translate(-80%, -80%); }
  35%, 100% { transform: translate(80%, 80%); }
}

.text-content {
  flex: 1;
  min-width: 0;
}

.meta-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 3px;
}

.game-tag {
  font-size: 11px;
  font-weight: 700;
  color: #f0c330;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unlock-tag {
  font-size: 9.5px;
  font-weight: 800;
  color: #a4b4cc;
  letter-spacing: 0.6px;
}

.ach-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ach-desc {
  margin: 0;
  font-size: 12.5px;
  color: #c7d5e0;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.progress-countdown {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #f0c330, #ffdb65);
  animation: ach-progress 5s linear forwards;
}

@keyframes ach-progress {
  from { width: 100%; }
  to { width: 0%; }
}

.animate-enter {
  animation: ach-slide-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-leave {
  animation: ach-slide-out 0.4s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}

@keyframes ach-slide-in {
  from { opacity: 0; transform: translateY(40px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes ach-slide-out {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to { opacity: 0; transform: translateY(20px) scale(0.96); }
}"#;

pub fn detect_lan_ip() -> Option<String> {
    // Crée une socket UDP connectée sans envoyer de paquets.
    // L'OS sélectionne automatiquement l'interface réseau locale active (LAN).
    let socket = std::net::UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;
    let local_addr = socket.local_addr().ok()?;
    let ip = local_addr.ip();
    if ip.is_loopback() || ip.is_unspecified() {
        None
    } else {
        Some(ip.to_string())
    }
}

pub struct ObsServer {
    pub port: Arc<AtomicU16>,
    pub preferred_port: Arc<AtomicU16>,
    pub is_running: Arc<AtomicBool>,
    pub connected_clients: Arc<AtomicUsize>,
    pub broadcast_tx: broadcast::Sender<String>,
    pub shutdown_tx: Arc<RwLock<Option<watch::Sender<()>>>>,
    pub current_theme: Arc<RwLock<serde_json::Value>>,
    pub app_handle: RwLock<Option<AppHandle>>,
}

impl ObsServer {
    pub fn new(preferred_port: u16) -> Self {
        let (broadcast_tx, _) = broadcast::channel(100);
        let default_theme_json = serde_json::json!({
            "html": DEFAULT_HTML,
            "css": DEFAULT_CSS,
            "hasAudio": false,
            "audioUrl": null,
            "soundEnabled": true,
            "soundVolume": 0.8
        });

        Self {
            port: Arc::new(AtomicU16::new(preferred_port)),
            preferred_port: Arc::new(AtomicU16::new(preferred_port)),
            is_running: Arc::new(AtomicBool::new(false)),
            connected_clients: Arc::new(AtomicUsize::new(0)),
            broadcast_tx,
            shutdown_tx: Arc::new(RwLock::new(None)),
            current_theme: Arc::new(RwLock::new(default_theme_json)),
            app_handle: RwLock::new(None),
        }
    }

    pub fn get_status(&self) -> ObsStatus {
        let is_running = self.is_running.load(Ordering::Relaxed);
        let actual_port = self.port.load(Ordering::Relaxed);
        let pref_port = self.preferred_port.load(Ordering::Relaxed);
        let connected_clients = self.connected_clients.load(Ordering::Relaxed);
        let has_port_conflict = actual_port != pref_port;
        let lan_ip = detect_lan_ip();

        ObsStatus {
            is_running,
            port: actual_port,
            preferred_port: pref_port,
            has_port_conflict,
            connected_clients,
            obs_url: format!("http://127.0.0.1:{}/obs", actual_port),
            obs_url_localhost: format!("http://localhost:{}/obs", actual_port),
            obs_url_lan: lan_ip.map(|ip| format!("http://{}:{}/obs", ip, actual_port)),
        }
    }

    pub fn broadcast_achievement(&self, achievement: &Achievement) {
        let payload = serde_json::json!({
            "type": "ACHIEVEMENT_UNLOCKED",
            "data": achievement
        });
        let _ = self.broadcast_tx.send(payload.to_string());
    }

    pub async fn update_customization(&self, theme: serde_json::Value) {
        let has_audio = theme
            .get("audioPath")
            .and_then(|v| v.as_str())
            .map(|p| std::path::Path::new(p).exists())
            .unwrap_or(false);

        let data = serde_json::json!({
            "html": theme.get("html").and_then(|v| v.as_str()).unwrap_or(DEFAULT_HTML),
            "css": theme.get("css").and_then(|v| v.as_str()).unwrap_or(DEFAULT_CSS),
            "audioPath": theme.get("audioPath"),
            "hasAudio": has_audio,
            "audioUrl": if has_audio { Some("/audio/custom") } else { None },
            "soundEnabled": theme.get("soundEnabled").and_then(|v| v.as_bool()).unwrap_or(true),
            "soundVolume": theme.get("soundVolume").and_then(|v| v.as_f64()).unwrap_or(0.8),
        });

        {
            let mut cur = self.current_theme.write().await;
            *cur = data.clone();
        }

        let payload = serde_json::json!({
            "type": "CUSTOMIZATION_UPDATED",
            "data": data
        });
        let _ = self.broadcast_tx.send(payload.to_string());
    }

    pub fn notify_status_change(&self) {
        let status = self.get_status();
        let app_guard = self.app_handle.try_read();
        if let Ok(guard) = app_guard {
            if let Some(app) = guard.as_ref() {
                let _ = app.emit("obs:status-changed", &status);
            }
        }
    }

    pub async fn start(self: Arc<Self>, app: AppHandle) -> Result<(), String> {
        {
            let mut h = self.app_handle.write().await;
            *h = Some(app);
        }

        // Arrêt d'une éventuelle instance précédente du serveur (changement de port)
        {
            let mut shutdown_guard = self.shutdown_tx.write().await;
            if let Some(tx) = shutdown_guard.take() {
                let _ = tx.send(());
                tokio::time::sleep(std::time::Duration::from_millis(60)).await;
            }
        }

        let pref = self.preferred_port.load(Ordering::Relaxed);

        // Liste des candidats si le port préféré est déjà occupé (ex: Streamer.bot sur 8080)
        let mut candidates = vec![pref];
        for offset in 1..=10 {
            let alt = pref.saturating_add(offset);
            if !candidates.contains(&alt) {
                candidates.push(alt);
            }
        }
        for common in [8081, 8082, 8085, 8088, 8090, 8888, 18080] {
            if !candidates.contains(&common) {
                candidates.push(common);
            }
        }
        // Port 0 demande à l'OS n'importe quel port libre du système
        candidates.push(0);

        let mut bound_listener = None;
        let mut final_port = pref;

        for candidate in candidates {
            let addr = format!("0.0.0.0:{}", candidate);
            match tokio::net::TcpListener::bind(&addr).await {
                Ok(listener) => {
                    if let Ok(local) = listener.local_addr() {
                        final_port = local.port();
                    } else {
                        final_port = candidate;
                    }
                    bound_listener = Some(listener);
                    break;
                }
                Err(err) => {
                    eprintln!(
                        "[ObsServer] Port {} occupé ou indisponible ({:?}). Tentative du port suivant...",
                        candidate, err
                    );
                }
            }
        }

        let listener = bound_listener.ok_or_else(|| {
            format!("Impossible d'allouer un port libre pour le serveur OBS (port préféré: {})", pref)
        })?;

        self.port.store(final_port, Ordering::Relaxed);
        self.is_running.store(true, Ordering::Relaxed);

        if final_port != pref {
            eprintln!(
                "[ObsServer] ⚠️ Conflit détecté : Le port {} est déjà utilisé (ex: Streamer.bot). Bascule automatique réussie sur le port libre {} !",
                pref, final_port
            );
        } else {
            println!("[ObsServer] Serveur OBS démarré avec succès sur le port {} !", final_port);
        }

        let (shutdown_tx, mut shutdown_rx) = watch::channel(());
        {
            let mut shutdown_guard = self.shutdown_tx.write().await;
            *shutdown_guard = Some(shutdown_tx);
        }

        self.notify_status_change();

        let state = self.clone();

        let router = Router::new()
            .route("/ws", get(ws_handler))
            .route("/", get(index_handler))
            .route("/obs", get(obs_html_handler))
            .route("/obs/", get(obs_html_handler))
            .route("/audio/custom", get(audio_handler))
            .route("/api/status", get(api_status_handler))
            .layer(CorsLayer::permissive())
            .with_state(state);

        tokio::spawn(async move {
            let server = axum::serve(listener, router).with_graceful_shutdown(async move {
                let _ = shutdown_rx.changed().await;
            });
            if let Err(e) = server.await {
                eprintln!("[ObsServer] Serveur arrêté ou erreur: {e}");
            }
        });

        Ok(())
    }
}

// Handler WebSocket
async fn ws_handler(ws: WebSocketUpgrade, State(server): State<Arc<ObsServer>>) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, server))
}

// Handler pour la racine '/' : gère l'upgrade WebSocket si présent, ou sert le HTML OBS
async fn index_handler(
    ws: Result<WebSocketUpgrade, WebSocketUpgradeRejection>,
    State(server): State<Arc<ObsServer>>,
) -> Response {
    match ws {
        Ok(upgrade) => upgrade.on_upgrade(move |socket| handle_socket(socket, server)).into_response(),
        Err(_) => obs_html_handler(State(server)).await.into_response(),
    }
}

// Handler WebSocket connection
async fn handle_socket(mut socket: WebSocket, server: Arc<ObsServer>) {
    server.connected_clients.fetch_add(1, Ordering::Relaxed);
    server.notify_status_change();

    // 1. Envoyer le message CONNECTED
    let connected_msg = serde_json::json!({
        "type": "CONNECTED",
        "message": "Connecté au serveur OBS Steam Custom Achievements",
        "port": server.port.load(Ordering::Relaxed)
    });
    let _ = socket.send(Message::Text(connected_msg.to_string().into())).await;

    // 2. Envoyer le thème actif
    let theme_data = {
        let cur = server.current_theme.read().await;
        cur.clone()
    };
    let theme_msg = serde_json::json!({
        "type": "CUSTOMIZATION_UPDATED",
        "data": theme_data
    });
    let _ = socket.send(Message::Text(theme_msg.to_string().into())).await;

    let (mut sender, mut receiver) = socket.split();
    let mut broadcast_rx = server.broadcast_tx.subscribe();

    // Tâche d'émission (broadcast -> websocket)
    let send_task = tokio::spawn(async move {
        while let Ok(msg) = broadcast_rx.recv().await {
            if sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    // Tâche de réception (websocket -> ping/pong/close)
    let recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Close(_) => break,
                _ => {}
            }
        }
    });

    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    };

    server.connected_clients.fetch_sub(1, Ordering::Relaxed);
    server.notify_status_change();
}

// Handler pour la page OBS Browser Source HTML
async fn obs_html_handler(State(server): State<Arc<ObsServer>>) -> Html<String> {
    let theme = {
        let cur = server.current_theme.read().await;
        cur.clone()
    };

    let css = theme
        .get("css")
        .and_then(|v| v.as_str())
        .unwrap_or(DEFAULT_CSS);
    let html_template = theme
        .get("html")
        .and_then(|v| v.as_str())
        .unwrap_or(DEFAULT_HTML);
    let has_audio = theme
        .get("hasAudio")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);
    let sound_enabled = theme
        .get("soundEnabled")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);
    let sound_volume = theme
        .get("soundVolume")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.8);

    let html_content = format!(
        r#"<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Steam Overlay OBS Browser Source</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
  <style>
    html, body {{
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
    }}
    #overlay-container {{
      position: relative;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
    }}
    #status-pill {{
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
    }}
    #status-pill.connected {{
      border-color: rgba(92, 126, 16, 0.7);
      color: #a1cd44;
    }}
    .status-dot {{
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff5555;
    }}
    #status-pill.connected .status-dot {{
      background: #a1cd44;
      box-shadow: 0 0 8px #a1cd44;
    }}
    #achievement-slot {{
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      overflow: hidden;
    }}
  </style>
  <style id="custom-theme-css">
{css}
  </style>
</head>
<body>
  <div id="overlay-container">
    <div id="status-pill">
      <span class="status-dot"></span>
      <span id="status-text">OBS : Connexion au serveur...</span>
    </div>
    <div id="achievement-slot"></div>
    <audio id="obs-audio-element" style="display:none;" preload="auto"></audio>
  </div>

  <script>
    const fallbackIcon = 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg';
    const statusPill = document.getElementById('status-pill');
    const statusText = document.getElementById('status-text');
    const achSlot = document.getElementById('achievement-slot');
    const customCssElem = document.getElementById('custom-theme-css');

    let currentHtmlTemplate = {html_template_json};
    let soundSettings = {{
      hasAudio: {has_audio},
      audioUrl: {has_audio} ? '/audio/custom?_v=' + Date.now() : null,
      soundEnabled: {sound_enabled},
      soundVolume: {sound_volume}
    }};

    let toastTimeout = null;
    let leaveTimeout = null;
    let ws = null;
    let reconnectAttempts = 0;

    function escapeHtml(text) {{
      if (!text) return '';
      const map = {{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }};
      return text.toString().replace(/[&<>"']/g, function(m) {{ return map[m]; }});
    }}

    function renderCustomHtml(template, item) {{
      if (!template) return '';
      return template
        .replace(/\{{title\}}/gi, escapeHtml(item.displayName || 'Succès Débloqué'))
        .replace(/\{{description\}}/gi, escapeHtml(item.description || ''))
        .replace(/\{{icon\}}/gi, item.icon || fallbackIcon)
        .replace(/\{{game\}}/gi, escapeHtml(item.gameName || 'Steam'));
    }}

    function playNotificationSound() {{
      if (!soundSettings.soundEnabled) return;
      if (soundSettings.hasAudio && soundSettings.audioUrl) {{
        try {{
          const audio = new Audio(soundSettings.audioUrl);
          audio.volume = soundSettings.soundVolume;
          audio.play().catch(function() {{ playChimeFallback(); }});
          return;
        }} catch(e) {{}}
      }}
      playChimeFallback();
    }}

    function playChimeFallback() {{
      try {{
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now);
        gain.gain.setValueAtTime(0.08 * soundSettings.soundVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.55);
      }} catch(e) {{}}
    }}

    function showAchievement(item) {{
      if (toastTimeout) clearTimeout(toastTimeout);
      if (leaveTimeout) clearTimeout(leaveTimeout);

      playNotificationSound();
      achSlot.innerHTML = renderCustomHtml(currentHtmlTemplate, item);

      const card = achSlot.firstElementChild;
      if (card) {{
        card.classList.remove('animate-leave');
        void card.offsetWidth;
        card.classList.add('animate-enter');
      }}

      toastTimeout = setTimeout(function() {{
        if (card) {{
          card.classList.remove('animate-enter');
          card.classList.add('animate-leave');
        }}
        leaveTimeout = setTimeout(function() {{
          achSlot.innerHTML = '';
        }}, 450);
      }}, 5000);
    }}

    function connectWebSocket() {{
      const loc = window.location;
      const wsUri = ((loc.protocol === 'https:') ? 'wss://' : 'ws://') + loc.host + '/ws';
      ws = new WebSocket(wsUri);

      ws.onopen = function() {{
        statusPill.classList.add('connected');
        statusText.textContent = 'OBS : Connecté à Steam Overlay';
        setTimeout(function() {{ statusPill.style.opacity = '0'; }}, 3000);
      }};

      ws.onmessage = function(ev) {{
        try {{
          const msg = JSON.parse(ev.data);
          if (msg.type === 'CUSTOMIZATION_UPDATED' && msg.data) {{
            if (msg.data.css) customCssElem.textContent = msg.data.css;
            if (msg.data.html) currentHtmlTemplate = msg.data.html;
            soundSettings = {{
              hasAudio: Boolean(msg.data.hasAudio),
              audioUrl: msg.data.hasAudio ? '/audio/custom?_v=' + Date.now() : null,
              soundEnabled: Boolean(msg.data.soundEnabled),
              soundVolume: msg.data.soundVolume || 0.8
            }};
          }} else if (msg.type === 'ACHIEVEMENT_UNLOCKED' && msg.data) {{
            showAchievement(msg.data);
          }}
        }} catch(e) {{}}
      }};

      ws.onclose = function() {{
        statusPill.classList.remove('connected');
        statusPill.style.opacity = '1';
        statusText.textContent = 'OBS : Déconnecté (reconnexion...)';
        setTimeout(connectWebSocket, 2000);
      }};
    }}

    connectWebSocket();
  </script>
</body>
</html>"#,
        css = css,
        html_template_json = serde_json::to_string(html_template).unwrap_or_default(),
        has_audio = has_audio,
        sound_enabled = sound_enabled,
        sound_volume = sound_volume
    );

    Html(html_content)
}

// Handler pour servir le son personnalisé
async fn audio_handler(State(server): State<Arc<ObsServer>>) -> Response {
    let audio_path = {
        let cur = server.current_theme.read().await;
        cur.get("audioPath")
            .and_then(|v| v.as_str())
            .map(PathBuf::from)
    };

    if let Some(path) = audio_path {
        if path.exists() {
            if let Ok(bytes) = tokio::fs::read(&path).await {
                let ext = path
                    .extension()
                    .and_then(|s| s.to_str())
                    .unwrap_or("mp3")
                    .to_lowercase();

                let mime = match ext.as_str() {
                    "wav" => "audio/wav",
                    "ogg" => "audio/ogg",
                    "aac" => "audio/aac",
                    "flac" => "audio/flac",
                    "m4a" => "audio/mp4",
                    _ => "audio/mpeg",
                };

                return (
                    StatusCode::OK,
                    [
                        (header::CONTENT_TYPE, mime),
                        (header::CACHE_CONTROL, "no-cache, no-store"),
                    ],
                    bytes,
                )
                    .into_response();
            }
        }
    }

    (StatusCode::NOT_FOUND, "Aucun fichier audio").into_response()
}

// Handler JSON de statut API
async fn api_status_handler(State(server): State<Arc<ObsServer>>) -> Response {
    let status = server.get_status();
    (
        StatusCode::OK,
        [(header::CONTENT_TYPE, "application/json")],
        serde_json::to_string(&status).unwrap_or_default(),
    )
        .into_response()
}
