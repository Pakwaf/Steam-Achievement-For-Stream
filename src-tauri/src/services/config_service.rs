use crate::error::{AppError, AppResult};
use crate::models::AppSettings;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Clone)]
pub struct ConfigService {
    app: AppHandle,
}

impl ConfigService {
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }

    pub fn get_app_dir(&self) -> PathBuf {
        self.app
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
    }

    pub async fn read_app_config(&self) -> AppResult<serde_json::Value> {
        let path = self.get_app_dir().join("config.json");
        if !path.exists() {
            return Ok(serde_json::json!({}));
        }

        let content = tokio::fs::read_to_string(&path)
            .await
            .map_err(AppError::Io)?;
        let val = serde_json::from_str::<serde_json::Value>(&content)
            .map_err(AppError::Serialization)?;
        Ok(val)
    }

    pub async fn write_app_config(&self, patch: serde_json::Value) -> AppResult<()> {
        let dir = self.get_app_dir();
        tokio::fs::create_dir_all(&dir)
            .await
            .map_err(AppError::Io)?;

        let mut current = self.read_app_config().await.unwrap_or_else(|_| serde_json::json!({}));
        if let (Some(cur_map), Some(patch_map)) = (current.as_object_mut(), patch.as_object()) {
            for (k, v) in patch_map {
                cur_map.insert(k.clone(), v.clone());
            }
        } else {
            current = patch;
        }

        let path = dir.join("config.json");
        let json = serde_json::to_string_pretty(&current)
            .map_err(AppError::Serialization)?;
        tokio::fs::write(&path, json)
            .await
            .map_err(AppError::Io)?;

        Ok(())
    }

    pub async fn get_app_settings(&self) -> AppResult<AppSettings> {
        let cfg = self.read_app_config().await?;
        if let Some(settings_val) = cfg.get("settings") {
            let settings = serde_json::from_value::<AppSettings>(settings_val.clone())
                .map_err(AppError::Serialization)?;
            return Ok(settings);
        }
        Ok(AppSettings::default())
    }

    pub async fn save_app_settings(&self, settings: AppSettings) -> AppResult<AppSettings> {
        self.write_app_config(serde_json::json!({ "settings": &settings })).await?;
        Ok(settings)
    }
}
