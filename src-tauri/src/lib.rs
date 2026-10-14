pub mod auth;
pub mod error;
pub mod models;
pub mod obs;
pub mod services;
pub mod state;
pub mod tracker;

use models::{Achievement, AppSettings, ObsStatus, SteamUser, TrackerStatus};
use obs::ObsServer;
use services::{AudioService, AuthService, ConfigService, ObsService, ThemeService, TrackerService};
use state::AppState;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::{Emitter, Manager, State};
use tokio::sync::RwLock;
use tracker::AchievementTracker;

// =========================================================================
// COMMANDES TAURI (IPC Bridge — Aucune logique métier directe)
// =========================================================================

#[tauri::command]
async fn login(state: State<'_, AppState>) -> Result<SteamUser, String> {
    state.auth_service.login().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn logout(state: State<'_, AppState>) -> Result<bool, String> {
    state.auth_service.logout().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_current_user(state: State<'_, AppState>) -> Result<Option<SteamUser>, String> {
    state.auth_service.get_current_user().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_tracker_status(state: State<'_, AppState>) -> Result<TrackerStatus, String> {
    Ok(state.tracker_service.get_status().await)
}

#[tauri::command]
async fn get_obs_status(state: State<'_, AppState>) -> Result<ObsStatus, String> {
    Ok(state.obs_service.get_status())
}

#[tauri::command]
async fn simulate_achievement(
    state: State<'_, AppState>,
    app_id: Option<String>,
    achievement_code: Option<String>,
) -> Result<Achievement, String> {
    state
        .tracker_service
        .simulate_achievement(app_id, achievement_code)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn broadcast_test_achievement(
    state: State<'_, AppState>,
    achievement_data: serde_json::Value,
) -> Result<bool, String> {
    state
        .tracker_service
        .broadcast_test_achievement(achievement_data)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn broadcast_draft_achievement(
    state: State<'_, AppState>,
    draft_data: serde_json::Value,
) -> Result<bool, String> {
    state
        .tracker_service
        .broadcast_draft_achievement(draft_data)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_steam_api_key(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    state.auth_service.get_steam_api_key().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_steam_api_key(
    state: State<'_, AppState>,
    key: String,
) -> Result<serde_json::Value, String> {
    state.auth_service.save_steam_api_key(key).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_theme_library(state: State<'_, AppState>) -> Result<Option<serde_json::Value>, String> {
    state.theme_service.get_theme_library().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_theme_library(
    state: State<'_, AppState>,
    library: serde_json::Value,
) -> Result<bool, String> {
    state.theme_service.save_theme_library(library).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn open_external(url: String) -> Result<bool, String> {
    let trimmed = url.trim();
    if !trimmed.starts_with("https://") && !trimmed.starts_with("http://") {
        return Err("URL non autorisée : seuls les liens web HTTPS et HTTP sont acceptés pour des raisons de sécurité".to_string());
    }
    open::that(trimmed).map_err(|e| format!("Impossible d'ouvrir l'URL: {e}"))?;
    Ok(true)
}

#[tauri::command]
async fn update_customization(
    state: State<'_, AppState>,
    theme: serde_json::Value,
) -> Result<bool, String> {
    state.theme_service.update_customization(theme).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn select_audio_file(state: State<'_, AppState>) -> Result<Option<String>, String> {
    state.audio_service.select_audio_file().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_audio_data(
    state: State<'_, AppState>,
    file_path: Option<String>,
) -> Result<serde_json::Value, String> {
    state.audio_service.get_audio_data(file_path).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_app_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    state.config_service.get_app_settings().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_app_settings(
    state: State<'_, AppState>,
    settings: AppSettings,
) -> Result<AppSettings, String> {
    let current_status = state.obs_service.get_status();
    let port_changed = settings.obs_port != current_status.preferred_port;
    let lan_changed = settings.obs_lan_broadcast != current_status.lan_broadcast_enabled;

    let saved = state.config_service.save_app_settings(settings).await.map_err(|e| e.to_string())?;

    if port_changed || lan_changed {
        state.obs_service.obs.preferred_port.store(saved.obs_port, Ordering::Relaxed);
        state.obs_service.obs.lan_broadcast.store(saved.obs_lan_broadcast, Ordering::Relaxed);
        let _ = state.obs_service.start().await;
    }

    Ok(saved)
}

#[tauri::command]
async fn set_obs_port(
    state: State<'_, AppState>,
    port: u16,
) -> Result<ObsStatus, String> {
    state.obs_service.set_port(port).await.map_err(|e| e.to_string())
}

// =========================================================================
// APPLICATION RUNNER & CYCLE DE VIE
// =========================================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
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
            broadcast_draft_achievement,
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
        .setup(|app| {
            if cfg!(debug_assertions) {
                if let Err(e) = app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                ) {
                    eprintln!("[LogPlugin] Erreur d'initialisation: {e}");
                }
            }

            // Configuration de la fenêtre transparente d'overlay
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

            // Instanciation de l'architecture des Services & Injection d'État Tauri
            let app_handle = app.handle().clone();

            let tracker = Arc::new(AchievementTracker::new());
            let obs = Arc::new(ObsServer::new(8080));
            let current_user_arc = Arc::new(RwLock::new(None));
            let api_key_arc = Arc::new(RwLock::new(None));

            let config_service = Arc::new(ConfigService::new(app_handle.clone()));
            let auth_service = Arc::new(AuthService::new(
                app_handle.clone(),
                current_user_arc.clone(),
                api_key_arc.clone(),
                tracker.clone(),
                config_service.clone(),
            ));
            let obs_service = Arc::new(ObsService::new(
                app_handle.clone(),
                obs.clone(),
                config_service.clone(),
            ));
            let theme_service = Arc::new(ThemeService::new(
                app_handle.clone(),
                obs.clone(),
                config_service.clone(),
            ));
            let tracker_service = Arc::new(TrackerService::new(
                app_handle.clone(),
                tracker.clone(),
                obs.clone(),
            ));
            let audio_service = Arc::new(AudioService::new(obs.clone()));

            let app_state = AppState::new(
                auth_service.clone(),
                tracker_service.clone(),
                obs_service.clone(),
                theme_service.clone(),
                config_service.clone(),
                audio_service.clone(),
            );

            app.manage(app_state);

            // Démarrage asynchrone des services en arrière-plan
            let app_handle_bg = app_handle.clone();
            let obs_service_bg = obs_service.clone();
            let tracker_service_bg = tracker_service.clone();
            let config_service_bg = config_service.clone();
            let theme_service_bg = theme_service.clone();
            let state_user_bg = current_user_arc.clone();
            let state_key_bg = api_key_arc.clone();

            tauri::async_runtime::spawn(async move {
                // 1. Restauration de la configuration
                if let Ok(settings) = config_service_bg.get_app_settings().await {
                    if settings.obs_port > 0 {
                        obs_service_bg.obs.preferred_port.store(settings.obs_port, Ordering::Relaxed);
                    }
                    obs_service_bg.obs.lan_broadcast.store(settings.obs_lan_broadcast, Ordering::Relaxed);
                }

                if let Ok(cfg) = config_service_bg.read_app_config().await {
                    if let Some(k) = cfg.get("apiKey").and_then(|v| v.as_str()) {
                        let clean = k.trim().to_string();
                        if !clean.is_empty() {
                            let mut w = state_key_bg.write().await;
                            *w = Some(clean.clone());
                            tracker_service_bg.tracker.set_api_key(clean).await;
                        }
                    }

                    if let Some(user_val) = cfg.get("currentUser") {
                        if !user_val.is_null() {
                            if let Ok(u) = serde_json::from_value::<SteamUser>(user_val.clone()) {
                                let mut w = state_user_bg.write().await;
                                *w = Some(u.clone());
                                tracker_service_bg.tracker.set_steam_id(u.steam_id.clone()).await;
                                let _ = app_handle_bg.emit("steam:auth-status-changed", Some(&u));
                            }
                        }
                    }
                }

                // 2. Restauration du thème actif dans OBS
                if let Ok(Some(lib)) = theme_service_bg.get_theme_library().await {
                    if let Some(themes) = lib.get("themes").and_then(|t| t.as_array()) {
                        let active_id = lib.get("activeThemeId").and_then(|i| i.as_str());
                        let active = themes
                            .iter()
                            .find(|t| active_id.map_or(false, |id| t.get("id").and_then(|i| i.as_str()) == Some(id)))
                            .or_else(|| themes.first());
                        if let Some(t) = active {
                            obs_service_bg.obs.update_customization(t.clone()).await;
                        }
                    }
                }

                // 3. Lancement des démons OBS et Tracker
                if let Err(e) = obs_service_bg.start().await {
                    eprintln!("[ObsServer] Erreur démarrage: {e}");
                }
                tracker_service_bg.start().await;
            });

            Ok(())
        });

    if let Err(err) = builder.run(tauri::generate_context!()) {
        eprintln!("[Tauri] Erreur critique d'exécution de l'application: {err}");
    }
}
