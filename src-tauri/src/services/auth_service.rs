use crate::auth;
use crate::error::{AppError, AppResult};
use crate::models::SteamUser;
use crate::services::config_service::ConfigService;
use crate::tracker::AchievementTracker;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct AuthService {
    app: AppHandle,
    current_user: Arc<RwLock<Option<SteamUser>>>,
    api_key: Arc<RwLock<Option<String>>>,
    tracker: Arc<AchievementTracker>,
    config_service: Arc<ConfigService>,
}

impl AuthService {
    pub fn new(
        app: AppHandle,
        current_user: Arc<RwLock<Option<SteamUser>>>,
        api_key: Arc<RwLock<Option<String>>>,
        tracker: Arc<AchievementTracker>,
        config_service: Arc<ConfigService>,
    ) -> Self {
        Self {
            app,
            current_user,
            api_key,
            tracker,
            config_service,
        }
    }

    pub async fn login(&self) -> AppResult<SteamUser> {
        let key = self.api_key.read().await.clone();
        let user = auth::authenticate(self.app.clone(), key).await.map_err(AppError::Auth)?;

        {
            let mut u = self.current_user.write().await;
            *u = Some(user.clone());
        }

        self.tracker.set_steam_id(user.steam_id.clone()).await;
        let _ = self.app.emit("steam:auth-status-changed", Some(&user));

        self.config_service
            .write_app_config(serde_json::json!({ "currentUser": &user }))
            .await?;

        Ok(user)
    }

    pub async fn logout(&self) -> AppResult<bool> {
        {
            let mut u = self.current_user.write().await;
            *u = None;
        }

        let _ = self.app.emit("steam:auth-status-changed", Option::<&SteamUser>::None);

        self.config_service
            .write_app_config(serde_json::json!({ "currentUser": serde_json::Value::Null }))
            .await?;

        Ok(true)
    }

    pub async fn get_current_user(&self) -> AppResult<Option<SteamUser>> {
        let mem_u = self.current_user.read().await.clone();
        if mem_u.is_some() {
            return Ok(mem_u);
        }

        let cfg = self.config_service.read_app_config().await?;
        if let Some(user_val) = cfg.get("currentUser") {
            if !user_val.is_null() {
                if let Ok(u) = serde_json::from_value::<SteamUser>(user_val.clone()) {
                    let mut w = self.current_user.write().await;
                    *w = Some(u.clone());
                    self.tracker.set_steam_id(u.steam_id.clone()).await;
                    return Ok(Some(u));
                }
            }
        }

        Ok(None)
    }

    pub async fn get_steam_api_key(&self) -> AppResult<serde_json::Value> {
        let mem_key = self.api_key.read().await.clone().unwrap_or_default();
        let k = if mem_key.trim().is_empty() {
            let cfg = self.config_service.read_app_config().await?;
            let file_key = cfg
                .get("apiKey")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .trim()
                .to_string();
            if !file_key.is_empty() {
                let mut w = self.api_key.write().await;
                *w = Some(file_key.clone());
                self.tracker.set_api_key(file_key.clone()).await;
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

    pub async fn save_steam_api_key(&self, key: String) -> AppResult<serde_json::Value> {
        let clean_key = key.trim().to_string();
        {
            let mut k = self.api_key.write().await;
            *k = Some(clean_key.clone());
        }

        self.tracker.set_api_key(clean_key.clone()).await;

        self.config_service
            .write_app_config(serde_json::json!({ "apiKey": &clean_key }))
            .await?;

        Ok(serde_json::json!({
            "success": true,
            "apiKey": clean_key,
            "hasKey": !clean_key.is_empty()
        }))
    }
}
