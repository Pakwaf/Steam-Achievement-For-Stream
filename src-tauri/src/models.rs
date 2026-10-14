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
    #[serde(default)]
    pub app_id: String,
    #[serde(default)]
    pub achievement_code: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub api_name: Option<String>,
    #[serde(default)]
    pub display_name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub icon: String,
    #[serde(default)]
    pub game_name: String,
    #[serde(default)]
    pub unlocked_at: String,
    #[serde(default)]
    pub is_test: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tier: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub rarity_percent: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub preview_theme: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none", alias = "playtime_hours")]
    pub playtime_hours: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeCustomization {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub html: String,
    #[serde(default)]
    pub css: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub visual_effect: Option<String>,
    #[serde(default)]
    pub audio_path: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub audio_device_id: Option<String>,
    #[serde(default = "default_sound_enabled")]
    pub sound_enabled: bool,
    #[serde(default = "default_sound_volume")]
    pub sound_volume: f32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tiers: Option<serde_json::Value>,
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
    #[serde(default)]
    pub lan_broadcast_enabled: bool,
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
    #[serde(default)]
    pub audio_device_id: Option<String>,
    #[serde(default = "default_desktop_overlay")]
    pub desktop_overlay_enabled: bool,
    #[serde(default)]
    pub obs_lan_broadcast: bool,
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
            audio_device_id: None,
            desktop_overlay_enabled: true,
            obs_lan_broadcast: false,
        }
    }
}
