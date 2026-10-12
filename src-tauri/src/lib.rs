pub mod auth;
pub mod models;
pub mod obs;
pub mod tracker;

use models::{Achievement, AppSettings, ObsStatus, SteamUser, TrackerStatus};
use obs::ObsServer;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::RwLock;
use tracker::AchievementTracker;

pub struct AppState {
    pub tracker: Arc<AchievementTracker>,
    pub obs: Arc<ObsServer>,
    pub current_user: Arc<RwLock<Option<SteamUser>>>,
    pub api_key: Arc<RwLock<Option<String>>>,
}

fn get_app_dir(app: &AppHandle) -> std::path::PathBuf {
    app.path()
        .app_data_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
}

async fn read_app_config(app: &AppHandle) -> serde_json::Value {
    let path = get_app_dir(app).join("config.json");
    if path.exists() {
        if let Ok(content) = tokio::fs::read_to_string(&path).await {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                return val;
            }
        }
    }
    serde_json::json!({})
}

async fn write_app_config(app: &AppHandle, patch: serde_json::Value) {
    let dir = get_app_dir(app);
    let _ = tokio::fs::create_dir_all(&dir).await;
    let mut current = read_app_config(app).await;
    if let (Some(cur_map), Some(patch_map)) = (current.as_object_mut(), patch.as_object()) {
        for (k, v) in patch_map {
            cur_map.insert(k.clone(), v.clone());
        }
    } else {
        current = patch;
    }
    let path = dir.join("config.json");
    if let Ok(json) = serde_json::to_string_pretty(&current) {
        let _ = tokio::fs::write(&path, json).await;
    }
}

#[tauri::command]
async fn login(app: AppHandle, state: State<'_, AppState>) -> Result<SteamUser, String> {
    let key = state.api_key.read().await.clone();
    let user = auth::authenticate(app.clone(), key).await?;

    {
        let mut u = state.current_user.write().await;
        *u = Some(user.clone());
    }

    state.tracker.set_steam_id(user.steam_id.clone()).await;
    let _ = app.emit("steam:auth-status-changed", Some(&user));

    write_app_config(&app, serde_json::json!({ "currentUser": &user })).await;

    Ok(user)
}

#[tauri::command]
async fn logout(app: AppHandle, state: State<'_, AppState>) -> Result<bool, String> {
    {
        let mut u = state.current_user.write().await;
        *u = None;
    }

    let _ = app.emit("steam:auth-status-changed", Option::<&SteamUser>::None);

    write_app_config(&app, serde_json::json!({ "currentUser": serde_json::Value::Null })).await;

    Ok(true)
}

#[tauri::command]
async fn get_current_user(app: AppHandle, state: State<'_, AppState>) -> Result<Option<SteamUser>, String> {
    let mem_u = state.current_user.read().await.clone();
    if mem_u.is_some() {
        return Ok(mem_u);
    }

    let cfg = read_app_config(&app).await;
    if let Some(user_val) = cfg.get("currentUser") {
        if !user_val.is_null() {
            match serde_json::from_value::<SteamUser>(user_val.clone()) {
                Ok(u) => {
                    let mut w = state.current_user.write().await;
                    *w = Some(u.clone());
                    state.tracker.set_steam_id(u.steam_id.clone()).await;
                    return Ok(Some(u));
                }
                Err(err) => {
                    eprintln!("[Config] Erreur parsing currentUser: {err}");
                }
            }
        }
    }

    Ok(None)
}

#[tauri::command]
async fn get_tracker_status(state: State<'_, AppState>) -> Result<TrackerStatus, String> {
    Ok(state.tracker.get_status().await)
}

#[tauri::command]
async fn get_obs_status(state: State<'_, AppState>) -> Result<ObsStatus, String> {
    Ok(state.obs.get_status())
}

#[tauri::command]
async fn simulate_achievement(
    app: AppHandle,
    state: State<'_, AppState>,
    app_id: Option<String>,
    achievement_code: Option<String>,
) -> Result<Achievement, String> {
    let target_app = app_id.unwrap_or_else(|| "440".to_string());
    let target_code = achievement_code.unwrap_or_else(|| "TF_PLAY_GAME_EVERYCLASS".to_string());

    let ach = state
        .tracker
        .simulate_achievement(&target_app, &target_code, &app, &state.obs)
        .await;

    Ok(ach)
}

#[tauri::command]
async fn broadcast_test_achievement(
    app: AppHandle,
    state: State<'_, AppState>,
    mut achievement_data: serde_json::Value,
) -> Result<bool, String> {
    if achievement_data.get("unlockedAt").is_none()
        || achievement_data["unlockedAt"]
            .as_str()
            .map_or(true, |s| s.is_empty())
    {
        achievement_data["unlockedAt"] = serde_json::json!(tracker::chrono_like_now());
    }
    if achievement_data.get("appId").is_none() {
        achievement_data["appId"] = serde_json::json!("440");
    }
    if achievement_data.get("achievementCode").is_none() {
        achievement_data["achievementCode"] = serde_json::json!("TF_TEST_ACHIEVEMENT");
    }
    if achievement_data.get("displayName").is_none() {
        achievement_data["displayName"] = serde_json::json!("Succès Débloqué");
    }
    if achievement_data.get("tier").is_none() {
        achievement_data["tier"] = serde_json::json!("common");
    }

    let _ = app.emit("steam:achievement-unlocked", &achievement_data);
    let payload = serde_json::json!({
        "type": "ACHIEVEMENT_UNLOCKED",
        "data": &achievement_data
    });
    state.obs.broadcast_raw(payload.to_string());
    Ok(true)
}

#[tauri::command]
async fn get_steam_api_key(app: AppHandle, state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let mem_key = state.api_key.read().await.clone().unwrap_or_default();
    let k = if mem_key.trim().is_empty() {
        let cfg = read_app_config(&app).await;
        let file_key = cfg
            .get("apiKey")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .trim()
            .to_string();
        if !file_key.is_empty() {
            let mut w = state.api_key.write().await;
            *w = Some(file_key.clone());
            state.tracker.set_api_key(file_key.clone()).await;
        }
        file_key
    } else {
        mem_key
    };

    let has_key = !k.trim().is_empty();
    Ok(serde_json::json!({
        "apiKey": k,
        "hasKey": has_key
    }))
}

#[tauri::command]
async fn save_steam_api_key(
    app: AppHandle,
    state: State<'_, AppState>,
    key: String,
) -> Result<serde_json::Value, String> {
    let clean_key = key.trim().to_string();
    {
        let mut k = state.api_key.write().await;
        *k = Some(clean_key.clone());
    }

    state.tracker.set_api_key(clean_key.clone()).await;

    write_app_config(&app, serde_json::json!({ "apiKey": &clean_key })).await;

    Ok(serde_json::json!({
        "success": true,
        "apiKey": clean_key,
        "hasKey": !clean_key.is_empty()
    }))
}

#[tauri::command]
async fn get_theme_library(app: AppHandle) -> Result<Option<serde_json::Value>, String> {
    let dir = get_app_dir(&app);
    let path = dir.join("themes.json");
    if path.exists() {
        if let Ok(content) = tokio::fs::read_to_string(&path).await {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                return Ok(Some(val));
            }
        }
    }
    Ok(None)
}

#[tauri::command]
async fn save_theme_library(
    app: AppHandle,
    state: State<'_, AppState>,
    library: serde_json::Value,
) -> Result<bool, String> {
    let dir = get_app_dir(&app);
    let _ = tokio::fs::create_dir_all(&dir).await;
    let path = dir.join("themes.json");
    if let Ok(json) = serde_json::to_string_pretty(&library) {
        let _ = tokio::fs::write(&path, json).await;
    }

    // Extraction et mise à jour du thème actif pour OBS
    if let Some(themes) = library.get("themes").and_then(|t| t.as_array()) {
        let active_id = library.get("activeThemeId").and_then(|i| i.as_str());
        let active_theme = themes
            .iter()
            .find(|t| active_id.map_or(false, |id| t.get("id").and_then(|i| i.as_str()) == Some(id)))
            .or_else(|| themes.first());

        if let Some(t) = active_theme {
            state.obs.update_customization(t.clone()).await;
            let _ = app.emit("customization:updated", t);
        }
    }

    Ok(true)
}

#[tauri::command]
async fn open_external(url: String) -> Result<bool, String> {
    open::that(&url).map_err(|e| format!("Impossible d'ouvrir l'URL: {e}"))?;
    Ok(true)
}

#[tauri::command]
async fn update_customization(
    app: AppHandle,
    state: State<'_, AppState>,
    theme: serde_json::Value,
) -> Result<bool, String> {
    state.obs.update_customization(theme.clone()).await;
    let _ = app.emit("customization:updated", &theme);
    Ok(true)
}

#[tauri::command]
async fn select_audio_file() -> Result<Option<String>, String> {
    let file = rfd::AsyncFileDialog::new()
        .add_filter("Fichiers Audio", &["mp3", "wav", "ogg", "aac", "flac", "m4a"])
        .set_title("Sélectionner un fichier audio pour la notification")
        .pick_file()
        .await;

    Ok(file.map(|f| f.path().to_string_lossy().to_string()))
}

#[tauri::command]
async fn get_audio_data(
    state: State<'_, AppState>,
    file_path: Option<String>,
) -> Result<serde_json::Value, String> {
    let resolved_path = match file_path.filter(|p| !p.trim().is_empty()) {
        Some(p) => Some(p),
        None => {
            let cur = state.obs.current_theme.read().await;
            cur.get("audioPath")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
        }
    };

    if let Some(path_str) = resolved_path {
        let path = std::path::PathBuf::from(&path_str);
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

                use base64::Engine;
                let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
                let data_url = format!("data:{};base64,{}", mime, b64);

                return Ok(serde_json::json!({
                    "hasAudio": true,
                    "dataUrl": data_url
                }));
            }
        }
    }

    Ok(serde_json::json!({
        "hasAudio": false,
        "dataUrl": null
    }))
}

#[tauri::command]
async fn get_app_settings(app: AppHandle) -> Result<AppSettings, String> {
    let cfg = read_app_config(&app).await;
    if let Some(settings_val) = cfg.get("settings") {
        if let Ok(settings) = serde_json::from_value::<AppSettings>(settings_val.clone()) {
            return Ok(settings);
        }
    }
    Ok(AppSettings::default())
}

#[tauri::command]
async fn save_app_settings(
    app: AppHandle,
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<AppSettings, String> {
    let current_pref = state.obs.preferred_port.load(Ordering::Relaxed);
    let port_changed = settings.obs_port != current_pref;

    state.obs.preferred_port.store(settings.obs_port, Ordering::Relaxed);
    write_app_config(&app, serde_json::json!({ "settings": &settings })).await;

    if port_changed {
        let _ = state.obs.clone().start(app.clone()).await;
    }

    Ok(settings)
}

#[tauri::command]
async fn set_obs_port(
    app: AppHandle,
    state: State<'_, AppState>,
    port: u16,
) -> Result<ObsStatus, String> {
    state.obs.preferred_port.store(port, Ordering::Relaxed);
    let mut current_settings = get_app_settings(app.clone()).await.unwrap_or_default();
    current_settings.obs_port = port;
    write_app_config(&app, serde_json::json!({ "settings": &current_settings })).await;

    let _ = state.obs.clone().start(app.clone()).await;
    Ok(state.obs.get_status())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let tracker = Arc::new(AchievementTracker::new());
    let obs = Arc::new(ObsServer::new(8080));
    let current_user_arc = Arc::new(RwLock::new(None));
    let api_key_arc = Arc::new(RwLock::new(None));

    let app_state = AppState {
        tracker: tracker.clone(),
        obs: obs.clone(),
        current_user: current_user_arc.clone(),
        api_key: api_key_arc.clone(),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .manage(app_state)
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if window.label() == "main" {
                    std::process::exit(0);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            login,
            logout,
            get_current_user,
            get_tracker_status,
            get_obs_status,
            simulate_achievement,
            broadcast_test_achievement,
            get_steam_api_key,
            save_steam_api_key,
            get_theme_library,
            save_theme_library,
            open_external,
            update_customization,
            select_audio_file,
            get_audio_data,
            get_app_settings,
            save_app_settings,
            set_obs_port,
        ])
        .setup(move |app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Récupère la fenêtre d'overlay transparent, fait traverser les clics souris
            // et dimensionne à l'écran complet sans activer le mode plein écran exclusif de Windows
            if let Some(overlay) = app.get_webview_window("overlay") {
                if let Err(e) = overlay.set_ignore_cursor_events(true) {
                    eprintln!("Erreur set_ignore_cursor_events sur overlay: {e}");
                }
                if let Ok(Some(monitor)) = overlay.primary_monitor() {
                    let size = monitor.size();
                    let _ = overlay.set_size(tauri::Size::Physical(*size));
                    let _ = overlay.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x: 0, y: 0 }));
                }
            }

            // Démarrage des services en arrière-plan et restauration de la config
            let app_handle = app.handle().clone();
            let tracker_service = tracker.clone();
            let obs_service = obs.clone();
            let state_user = current_user_arc.clone();
            let state_key = api_key_arc.clone();

            tauri::async_runtime::spawn(async move {
                // 1. Restauration de la clé API, de l'utilisateur et des paramètres généraux
                let cfg = read_app_config(&app_handle).await;

                if let Some(settings_val) = cfg.get("settings") {
                    if let Ok(settings) = serde_json::from_value::<AppSettings>(settings_val.clone()) {
                        if settings.obs_port > 0 {
                            obs_service.preferred_port.store(settings.obs_port, Ordering::Relaxed);
                        }
                    }
                }

                if let Some(k) = cfg.get("apiKey").and_then(|v| v.as_str()) {
                    let clean = k.trim().to_string();
                    if !clean.is_empty() {
                        let mut w = state_key.write().await;
                        *w = Some(clean.clone());
                        tracker_service.set_api_key(clean).await;
                    }
                }

                if let Some(user_val) = cfg.get("currentUser") {
                    if !user_val.is_null() {
                        if let Ok(u) = serde_json::from_value::<SteamUser>(user_val.clone()) {
                            let mut w = state_user.write().await;
                            *w = Some(u.clone());
                            tracker_service.set_steam_id(u.steam_id.clone()).await;
                            let _ = app_handle.emit("steam:auth-status-changed", Some(&u));
                        }
                    }
                }

                // 2. Restauration du thème actif dans le serveur OBS
                let themes_path = get_app_dir(&app_handle).join("themes.json");
                if themes_path.exists() {
                    if let Ok(content) = tokio::fs::read_to_string(&themes_path).await {
                        if let Ok(lib) = serde_json::from_str::<serde_json::Value>(&content) {
                            if let Some(themes) = lib.get("themes").and_then(|t| t.as_array()) {
                                let active_id = lib.get("activeThemeId").and_then(|i| i.as_str());
                                let active = themes
                                    .iter()
                                    .find(|t| active_id.map_or(false, |id| t.get("id").and_then(|i| i.as_str()) == Some(id)))
                                    .or_else(|| themes.first());
                                if let Some(t) = active {
                                    obs_service.update_customization(t.clone()).await;
                                }
                            }
                        }
                    }
                }

                if let Err(e) = obs_service.clone().start(app_handle.clone()).await {
                    eprintln!("[ObsServer] Erreur démarrage: {e}");
                }
                tracker_service.start(app_handle, obs_service).await;
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
