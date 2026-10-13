use crate::error::AppResult;
use crate::models::ObsStatus;
use crate::obs::ObsServer;
use crate::services::config_service::ConfigService;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use tauri::AppHandle;

#[derive(Clone)]
pub struct ObsService {
    pub app: AppHandle,
    pub obs: Arc<ObsServer>,
    pub config_service: Arc<ConfigService>,
}

impl ObsService {
    pub fn new(app: AppHandle, obs: Arc<ObsServer>, config_service: Arc<ConfigService>) -> Self {
        Self {
            app,
            obs,
            config_service,
        }
    }

    pub fn get_status(&self) -> ObsStatus {
        self.obs.get_status()
    }

    pub async fn set_port(&self, port: u16) -> AppResult<ObsStatus> {
        self.obs.preferred_port.store(port, Ordering::Relaxed);

        let mut current_settings = self.config_service.get_app_settings().await.unwrap_or_default();
        current_settings.obs_port = port;
        self.config_service.save_app_settings(current_settings).await?;

        let _ = self.obs.clone().start(self.app.clone()).await;
        Ok(self.obs.get_status())
    }

    pub async fn set_lan_broadcast(&self, enabled: bool) -> AppResult<ObsStatus> {
        self.obs.lan_broadcast.store(enabled, Ordering::Relaxed);

        let mut current_settings = self.config_service.get_app_settings().await.unwrap_or_default();
        current_settings.obs_lan_broadcast = enabled;
        self.config_service.save_app_settings(current_settings).await?;

        let _ = self.obs.clone().start(self.app.clone()).await;
        Ok(self.obs.get_status())
    }

    pub fn broadcast_raw(&self, payload: String) {
        self.obs.broadcast_raw(payload);
    }

    pub async fn start(&self) -> AppResult<()> {
        self.obs
            .clone()
            .start(self.app.clone())
            .await
            .map_err(crate::error::AppError::Obs)
    }
}
