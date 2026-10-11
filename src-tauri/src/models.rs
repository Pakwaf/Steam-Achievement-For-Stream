use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SteamUser {
    pub steam_id: String,
    pub persona_name: String,
    pub avatar: String,
    pub profile_url: String,
    pub online_state: String,
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
    pub connected_clients: usize,
    pub obs_url: String,
}
