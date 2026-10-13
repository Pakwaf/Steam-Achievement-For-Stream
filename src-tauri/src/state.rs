use crate::services::{
    AudioService, AuthService, ConfigService, ObsService, ThemeService, TrackerService,
};
use std::sync::Arc;

pub struct AppState {
    pub auth_service: Arc<AuthService>,
    pub tracker_service: Arc<TrackerService>,
    pub obs_service: Arc<ObsService>,
    pub theme_service: Arc<ThemeService>,
    pub config_service: Arc<ConfigService>,
    pub audio_service: Arc<AudioService>,
}

impl AppState {
    pub fn new(
        auth_service: Arc<AuthService>,
        tracker_service: Arc<TrackerService>,
        obs_service: Arc<ObsService>,
        theme_service: Arc<ThemeService>,
        config_service: Arc<ConfigService>,
        audio_service: Arc<AudioService>,
    ) -> Self {
        Self {
            auth_service,
            tracker_service,
            obs_service,
            theme_service,
            config_service,
            audio_service,
        }
    }
}
