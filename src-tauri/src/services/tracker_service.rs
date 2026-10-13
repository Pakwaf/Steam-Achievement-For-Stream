use crate::error::{AppError, AppResult};
use crate::models::{Achievement, TrackerStatus};
use crate::obs::ObsServer;
use crate::tracker::{self, AchievementTracker};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

#[derive(Clone)]
pub struct TrackerService {
    pub app: AppHandle,
    pub tracker: Arc<AchievementTracker>,
    pub obs: Arc<ObsServer>,
}

impl TrackerService {
    pub fn new(app: AppHandle, tracker: Arc<AchievementTracker>, obs: Arc<ObsServer>) -> Self {
        Self {
            app,
            tracker,
            obs,
        }
    }

    pub async fn get_status(&self) -> TrackerStatus {
        self.tracker.get_status().await
    }

    pub async fn simulate_achievement(
        &self,
        app_id: Option<String>,
        achievement_code: Option<String>,
    ) -> AppResult<Achievement> {
        let target_app = app_id.unwrap_or_else(|| "440".to_string());
        let target_code = achievement_code.unwrap_or_else(|| "TF_PLAY_GAME_EVERYCLASS".to_string());

        let ach = self
            .tracker
            .simulate_achievement(&target_app, &target_code, &self.app, &self.obs)
            .await;

        Ok(ach)
    }

    pub async fn broadcast_test_achievement(
        &self,
        mut achievement_data: serde_json::Value,
    ) -> AppResult<bool> {
        if achievement_data.get("unlockedAt").is_none()
            || achievement_data["unlockedAt"]
                .as_str()
                .map_or(true, |s| s.is_empty())
        {
            achievement_data["unlockedAt"] = serde_json::json!(tracker::chrono_like_now());
        }
        if achievement_data.get("appId").is_none() {
            achievement_data["appId"] = serde_json::json!("440");
        }
        if achievement_data.get("achievementCode").is_none() {
            achievement_data["achievementCode"] = serde_json::json!("TF_TEST_ACHIEVEMENT");
        }
        if achievement_data.get("displayName").is_none() {
            achievement_data["displayName"] = serde_json::json!("Succès Débloqué");
        }
        if achievement_data.get("tier").is_none() {
            achievement_data["tier"] = serde_json::json!("common");
        }

        self.app
            .emit("steam:achievement-unlocked", &achievement_data)
            .map_err(|e| AppError::Internal(format!("Échec émission événement: {e}")))?;

        let payload = serde_json::json!({
            "type": "ACHIEVEMENT_UNLOCKED",
            "data": &achievement_data
        });
        self.obs.broadcast_raw(payload.to_string());

        Ok(true)
    }

    pub async fn start(&self) {
        self.tracker.clone().start(self.app.clone(), self.obs.clone()).await;
    }
}
