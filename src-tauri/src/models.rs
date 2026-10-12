use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SteamUser {
    pub steam_id: String,
    #[serde(default)]
    pub persona_name: String,
    #[serde(default)]
    pub avatar: String,
    #[serde(default)]
    pub profile_url: String,
    #[serde(default)]
    pub online_state: String,
    #[serde(default)]
    pub authenticated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Achievement {
    pub app_id: String,
    pub achievement_code: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub api_name: Option<String>,
    pub display_name: String,
    pub description: String,
    pub icon: String,
    pub game_name: String,
    pub unlocked_at: String,
    #[serde(default)]
    pub is_test: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preview_theme: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeCustomization {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    pub html: String,
    pub css: String,
    #[serde(default)]
    pub audio_path: Option<String>,
    #[serde(default = "default_sound_enabled")]
    pub sound_enabled: bool,
    #[serde(default = "default_sound_volume")]
    pub sound_volume: f32,
}

fn default_sound_enabled() -> bool {
    true
}

fn default_sound_volume() -> f32 {
    0.8
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrackerStatus {
    pub is_tracking: bool,
    pub active_game_name: Option<String>,
    pub active_app_id: Option<String>,
    pub steam_path: Option<String>,
    pub steam_id: Option<String>,
    pub has_api_key: bool,
    pub watched_files: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ObsStatus {
    pub is_running: bool,
    pub port: u16,
    pub preferred_port: u16,
    pub has_port_conflict: bool,
    pub connected_clients: usize,
    pub obs_url: String,
    pub obs_url_localhost: String,
    pub obs_url_lan: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    #[serde(default = "default_obs_port")]
    pub obs_port: u16,
    #[serde(default = "default_sound_enabled")]
    pub sound_enabled: bool,
    #[serde(default = "default_sound_volume")]
    pub sound_volume: f32,
    #[serde(default = "default_desktop_overlay")]
    pub desktop_overlay_enabled: bool,
}

fn default_obs_port() -> u16 {
    8080
}

fn default_desktop_overlay() -> bool {
    true
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            obs_port: 8080,
            sound_enabled: true,
            sound_volume: 0.8,
            desktop_overlay_enabled: true,
        }
    }
}
