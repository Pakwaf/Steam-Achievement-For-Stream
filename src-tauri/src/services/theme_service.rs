use crate::error::{AppError, AppResult};
use crate::obs::ObsServer;
use crate::services::config_service::ConfigService;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

#[derive(Clone)]
pub struct ThemeService {
    pub app: AppHandle,
    pub obs: Arc<ObsServer>,
    pub config_service: Arc<ConfigService>,
}

impl ThemeService {
    pub fn new(app: AppHandle, obs: Arc<ObsServer>, config_service: Arc<ConfigService>) -> Self {
        Self {
            app,
            obs,
            config_service,
        }
    }

    pub async fn get_theme_library(&self) -> AppResult<Option<serde_json::Value>> {
        let dir = self.config_service.get_app_dir();
        let path = dir.join("themes.json");
        if path.exists() {
            let content = tokio::fs::read_to_string(&path)
                .await
                .map_err(AppError::Io)?;
            let val = serde_json::from_str::<serde_json::Value>(&content)
                .map_err(AppError::Serialization)?;
            return Ok(Some(val));
        }
        Ok(None)
    }

    pub async fn save_theme_library(&self, library: serde_json::Value) -> AppResult<bool> {
        let dir = self.config_service.get_app_dir();
        tokio::fs::create_dir_all(&dir)
            .await
            .map_err(AppError::Io)?;
        let path = dir.join("themes.json");
        let json = serde_json::to_string_pretty(&library)
            .map_err(AppError::Serialization)?;
        tokio::fs::write(&path, json)
            .await
            .map_err(AppError::Io)?;

        // Synchroniser le thème actif avec le serveur OBS et diffuser l'événement
        if let Some(themes) = library.get("themes").and_then(|t| t.as_array()) {
            let active_id = library.get("activeThemeId").and_then(|i| i.as_str());
            let active_theme = themes
                .iter()
                .find(|t| active_id.map_or(false, |id| t.get("id").and_then(|i| i.as_str()) == Some(id)))
                .or_else(|| themes.first());

            if let Some(t) = active_theme {
                self.obs.update_customization(t.clone()).await;
                let _ = self.app.emit("customization:updated", t);
            }
        }

        Ok(true)
    }

    pub async fn update_customization(&self, theme: serde_json::Value) -> AppResult<bool> {
        self.obs.update_customization(theme.clone()).await;
        self.app
            .emit("customization:updated", &theme)
            .map_err(|e| AppError::Internal(format!("Échec émission événement customization:updated: {e}")))?;
        Ok(true)
    }
}
