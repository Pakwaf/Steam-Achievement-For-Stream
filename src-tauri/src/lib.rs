pub mod auth;
pub mod models;
pub mod obs;
pub mod tracker;

use models::{Achievement, ObsStatus, SteamUser, TrackerStatus};
use obs::ObsServer;
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

    Ok(user)
}

#[tauri::command]
async fn logout(app: AppHandle, state: State<'_, AppState>) -> Result<bool, String> {
    {
        let mut u = state.current_user.write().await;
        *u = None;
    }

    let _ = app.emit("steam:auth-status-changed", Option::<&SteamUser>::None);
    Ok(true)
}

#[tauri::command]
async fn get_current_user(state: State<'_, AppState>) -> Result<Option<SteamUser>, String> {
    let u = state.current_user.read().await.clone();
    Ok(u)
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
    achievement_data: Achievement,
) -> Result<bool, String> {
    let _ = app.emit("steam:achievement-unlocked", &achievement_data);
    state.obs.broadcast_achievement(&achievement_data);
    Ok(true)
}

#[tauri::command]
async fn get_steam_api_key(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let k = state.api_key.read().await.clone().unwrap_or_default();
    let has_key = !k.trim().is_empty();
    Ok(serde_json::json!({
        "apiKey": k,
        "hasKey": has_key
    }))
}

#[tauri::command]
async fn save_steam_api_key(
    state: State<'_, AppState>,
    key: String,
) -> Result<serde_json::Value, String> {
    let clean_key = key.trim().to_string();
    {
        let mut k = state.api_key.write().await;
        *k = Some(clean_key.clone());
    }

    state.tracker.set_api_key(clean_key.clone()).await;

    Ok(serde_json::json!({
        "success": true,
        "apiKey": clean_key,
        "hasKey": !clean_key.is_empty()
    }))
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let tracker = Arc::new(AchievementTracker::new());
    let obs = Arc::new(ObsServer::new(8080));

    let app_state = AppState {
        tracker: tracker.clone(),
        obs: obs.clone(),
        current_user: Arc::new(RwLock::new(None)),
        api_key: Arc::new(RwLock::new(None)),
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
            open_external,
            update_customization,
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

            // Démarrage des services en arrière-plan
            let app_handle = app.handle().clone();
            let tracker_service = tracker.clone();
            let obs_service = obs.clone();

            tauri::async_runtime::spawn(async move {
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
