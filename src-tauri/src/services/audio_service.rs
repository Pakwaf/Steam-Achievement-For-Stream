use crate::error::{AppError, AppResult};
use crate::obs::ObsServer;
use base64::Engine;
use std::path::PathBuf;
use std::sync::Arc;

#[derive(Clone)]
pub struct AudioService {
    obs: Arc<ObsServer>,
}

impl AudioService {
    pub fn new(obs: Arc<ObsServer>) -> Self {
        Self { obs }
    }

    pub async fn select_audio_file(&self) -> AppResult<Option<String>> {
        let file = rfd::AsyncFileDialog::new()
            .add_filter("Fichiers Audio", &["mp3", "wav", "ogg", "aac", "flac", "m4a"])
            .set_title("Sélectionner un fichier audio pour la notification")
            .pick_file()
            .await;

        Ok(file.map(|f| f.path().to_string_lossy().to_string()))
    }

    pub async fn get_audio_data(&self, file_path: Option<String>) -> AppResult<serde_json::Value> {
        let resolved_path = match file_path.filter(|p| !p.trim().is_empty()) {
            Some(p) => Some(p),
            None => {
                let cur = self.obs.current_theme.read().await;
                cur.get("audioPath")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string())
            }
        };

        if let Some(path_str) = resolved_path {
            let path = PathBuf::from(&path_str);
            let ext = path
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_lowercase();

            if !matches!(ext.as_str(), "mp3" | "wav" | "ogg" | "aac" | "flac" | "m4a") {
                eprintln!("[AudioService] 🚨 Extension non autorisée pour l'audio : {:?}", path);
                return Ok(serde_json::json!({
                    "hasAudio": false,
                    "dataUrl": null
                }));
            }

            if path.is_file() {
                let bytes = tokio::fs::read(&path)
                    .await
                    .map_err(AppError::Io)?;

                let mime = match ext.as_str() {
                    "wav" => "audio/wav",
                    "ogg" => "audio/ogg",
                    "aac" => "audio/aac",
                    "flac" => "audio/flac",
                    "m4a" => "audio/mp4",
                    _ => "audio/mpeg",
                };

                let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
                let data_url = format!("data:{};base64,{}", mime, b64);

                return Ok(serde_json::json!({
                    "hasAudio": true,
                    "dataUrl": data_url
                }));
            }
        }

        Ok(serde_json::json!({
            "hasAudio": false,
            "dataUrl": null
        }))
    }
}
