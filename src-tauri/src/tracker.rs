use crate::models::{Achievement, TrackerStatus};
use crate::obs::ObsServer;
use regex::Regex;
use serde_json::Value;
use std::collections::{HashMap, HashSet};
use std::path::{Path, PathBuf};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncReadExt, AsyncSeekExt, SeekFrom};
use tokio::sync::RwLock;

pub struct AchievementTracker {
    pub steam_path: Option<PathBuf>,
    pub steam_id: Arc<RwLock<Option<String>>>,
    pub api_key: Arc<RwLock<Option<String>>>,
    pub active_app_id: Arc<RwLock<Option<String>>>,
    pub active_game_name: Arc<RwLock<Option<String>>>,
    pub is_tracking: Arc<AtomicBool>,
    pub known_unlocked: Arc<RwLock<HashMap<String, HashSet<String>>>>,
    pub schema_cache: Arc<RwLock<HashMap<String, Value>>>,
    pub game_name_cache: Arc<RwLock<HashMap<String, String>>>,
    pub watched_files: Arc<RwLock<Vec<String>>>,
    pub client: reqwest::Client,
}

impl AchievementTracker {
    pub fn new() -> Self {
        let detected_path = Self::detect_steam_path();
        let detected_steam_id = detected_path
            .as_ref()
            .and_then(|p| Self::detect_active_steam_id(p));

        Self {
            steam_path: detected_path,
            steam_id: Arc::new(RwLock::new(detected_steam_id)),
            api_key: Arc::new(RwLock::new(None)),
            active_app_id: Arc::new(RwLock::new(None)),
            active_game_name: Arc::new(RwLock::new(None)),
            is_tracking: Arc::new(AtomicBool::new(false)),
            known_unlocked: Arc::new(RwLock::new(HashMap::new())),
            schema_cache: Arc::new(RwLock::new(HashMap::new())),
            game_name_cache: Arc::new(RwLock::new(HashMap::new())),
            watched_files: Arc::new(RwLock::new(Vec::new())),
            client: reqwest::Client::builder()
                .timeout(Duration::from_secs(8))
                .build()
                .unwrap_or_default(),
        }
    }

    pub fn detect_steam_path() -> Option<PathBuf> {
        if let Ok(env_path) = std::env::var("STEAM_PATH") {
            let p = PathBuf::from(env_path);
            if p.exists() {
                return Some(p);
            }
        }

        #[cfg(target_os = "windows")]
        {
            // Vérification dans la base de registre HKCU
            if let Ok(output) = std::process::Command::new("reg")
                .args(["query", "HKCU\\Software\\Valve\\Steam", "/v", "SteamPath"])
                .output()
            {
                let text = String::from_utf8_lossy(&output.stdout);
                if let Some(caps) = Regex::new(r"SteamPath\s+REG_SZ\s+(.+)")
                    .ok()
                    .and_then(|re| re.captures(&text))
                {
                    if let Some(m) = caps.get(1) {
                        let candidate = PathBuf::from(m.as_str().trim());
                        if candidate.exists() {
                            return Some(candidate);
                        }
                    }
                }
            }

            // Vérification dans la base de registre HKLM 64-bit
            if let Ok(output) = std::process::Command::new("reg")
                .args([
                    "query",
                    "HKLM\\Software\\WOW6432Node\\Valve\\Steam",
                    "/v",
                    "InstallPath",
                ])
                .output()
            {
                let text = String::from_utf8_lossy(&output.stdout);
                if let Some(caps) = Regex::new(r"InstallPath\s+REG_SZ\s+(.+)")
                    .ok()
                    .and_then(|re| re.captures(&text))
                {
                    if let Some(m) = caps.get(1) {
                        let candidate = PathBuf::from(m.as_str().trim());
                        if candidate.exists() {
                            return Some(candidate);
                        }
                    }
                }
            }

            let standard_paths = [
                r"C:\Program Files (x86)\Steam",
                r"C:\Program Files\Steam",
                r"D:\Steam",
                r"E:\Steam",
            ];
            for path in standard_paths {
                let p = PathBuf::from(path);
                if p.exists() {
                    return Some(p);
                }
            }
        }

        None
    }

    pub fn detect_active_steam_id(steam_path: &Path) -> Option<String> {
        let loginusers = steam_path.join("config").join("loginusers.vdf");
        if !loginusers.exists() {
            return None;
        }

        let content = std::fs::read_to_string(&loginusers).ok()?;
        let re_user = Regex::new(r#""(7656\d+)""#).ok()?;
        let re_ts = Regex::new(r#""Timestamp"\s*"(\d+)""#).ok()?;

        let mut auto_login = None;
        let mut most_recent = None;
        let mut best_id = None;
        let mut highest_ts: u64 = 0;

        for cap in re_user.captures_iter(&content) {
            let steam_id = cap[1].to_string();
            if let Some(pos) = content.find(&steam_id) {
                let slice = &content[pos..pos + std::cmp::min(500, content.len() - pos)];
                if slice.contains(r#""AutoLogin""#) && slice.contains(r#""1""#) {
                    auto_login = Some(steam_id.clone());
                }
                if slice.contains(r#""MostRecent""#) && slice.contains(r#""1""#) {
                    most_recent = Some(steam_id.clone());
                }
                if let Some(ts_match) = re_ts.captures(slice) {
                    if let Ok(ts) = ts_match[1].parse::<u64>() {
                        if ts > highest_ts {
                            highest_ts = ts;
                            best_id = Some(steam_id.clone());
                        }
                    }
                }
            }
        }

        auto_login.or(most_recent).or(best_id)
    }

    pub async fn get_status(&self) -> TrackerStatus {
        let is_tracking = self.is_tracking.load(Ordering::Relaxed);
        let active_app_id = self.active_app_id.read().await.clone();
        let active_game_name = self.active_game_name.read().await.clone();
        let steam_id = self.steam_id.read().await.clone();
        let has_api_key = self
            .api_key
            .read()
            .await
            .as_ref()
            .map(|k| !k.trim().is_empty())
            .unwrap_or(false);
        let watched_files = self.watched_files.read().await.clone();

        TrackerStatus {
            is_tracking,
            active_game_name,
            active_app_id,
            steam_path: self.steam_path.as_ref().map(|p| p.to_string_lossy().to_string()),
            steam_id,
            has_api_key,
            watched_files,
        }
    }

    pub async fn set_api_key(&self, key: String) {
        let mut k = self.api_key.write().await;
        *k = Some(key.trim().to_string());
    }

    pub async fn set_steam_id(&self, id: String) {
        let mut s = self.steam_id.write().await;
        *s = Some(id.trim().to_string());
    }

    pub async fn start(
        self: Arc<Self>,
        app: AppHandle,
        obs_server: Arc<ObsServer>,
    ) {
        if self.is_tracking.swap(true, Ordering::Relaxed) {
            return;
        }

        let tracker_clone = self.clone();
        let app_clone = app.clone();
        let obs_clone = obs_server.clone();

        // 1. Démarre la surveillance du fichier de log stats_log.txt
        if let Some(ref steam_path) = self.steam_path {
            let log_file = steam_path.join("logs").join("stats_log.txt");
            {
                let mut wf = self.watched_files.write().await;
                wf.push(log_file.to_string_lossy().to_string());
            }

            let log_tracker = self.clone();
            let log_app = app.clone();
            let log_obs = obs_server.clone();
            tokio::spawn(async move {
                log_tracker
                    .watch_log_file(log_file, log_app, log_obs)
                    .await;
            });
        }

        // 2. Boucle périodique de détection du jeu actif (toutes les 3.5 secondes)
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_millis(3500));
            while tracker_clone.is_tracking.load(Ordering::Relaxed) {
                interval.tick().await;
                tracker_clone.poll_active_game(&app_clone, &obs_clone).await;
            }
        });

        // 3. Boucle périodique rapide de vérification des succès en cours de jeu (toutes les 1.5 secondes)
        let check_tracker = self.clone();
        let check_app = app.clone();
        let check_obs = obs_server.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_millis(1500));
            while check_tracker.is_tracking.load(Ordering::Relaxed) {
                interval.tick().await;
                let active_app = check_tracker.active_app_id.read().await.clone();
                if let Some(app_id) = active_app {
                    check_tracker
                        .check_player_achievements(&app_id, false, &check_app, &check_obs)
                        .await;
                }
            }
        });
    }

    async fn watch_log_file(
        &self,
        log_path: PathBuf,
        app: AppHandle,
        obs: Arc<ObsServer>,
    ) {
        let mut offset = 0;
        if let Ok(meta) = tokio::fs::metadata(&log_path).await {
            offset = meta.len();
        }

        let mut remainder = String::new();

        loop {
            tokio::time::sleep(Duration::from_millis(300)).await;
            if !self.is_tracking.load(Ordering::Relaxed) {
                break;
            }

            if let Ok(meta) = tokio::fs::metadata(&log_path).await {
                let cur_size = meta.len();
                if cur_size < offset {
                    offset = 0;
                }
                if cur_size > offset {
                    if let Ok(mut file) = tokio::fs::File::open(&log_path).await {
                        if file.seek(SeekFrom::Start(offset)).await.is_ok() {
                            let mut buf = vec![0u8; (cur_size - offset) as usize];
                            if file.read_exact(&mut buf).await.is_ok() {
                                offset = cur_size;
                                let chunk = String::from_utf8_lossy(&buf);
                                let full_text = format!("{}{}", remainder, chunk);
                                let mut lines: Vec<&str> = full_text.split('\n').collect();
                                remainder = lines.pop().unwrap_or("").to_string();

                                for line in lines {
                                    let line_trim = line.trim();
                                    if !line_trim.is_empty() {
                                        self.process_log_line(line_trim, &app, &obs).await;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    async fn process_log_line(&self, line: &str, app: &AppHandle, obs: &Arc<ObsServer>) {
        if !line.contains("[AppID") {
            return;
        }

        if let Some(caps) = Regex::new(r"\[AppID\s+(\d+)\]").ok().and_then(|r| r.captures(line)) {
            if let Some(m) = caps.get(1) {
                let app_id = m.as_str().to_string();

                // Déclencheur immédiat lorsque Steam enregistre les statistiques du joueur
                if line.contains("CAPIJobStoreUserStats") || line.contains("CAPIJobRequestUserStats") {
                    self.check_player_achievements(&app_id, false, app, obs).await;
                }
            }
        }
    }

    async fn poll_active_game(&self, app: &AppHandle, obs: &Arc<ObsServer>) {
        let api_key = self.api_key.read().await.clone();
        let steam_id = self.steam_id.read().await.clone();

        let (key, sid) = match (api_key, steam_id) {
            (Some(k), Some(s)) if !k.trim().is_empty() && !s.trim().is_empty() => (k, s),
            _ => return,
        };

        let url = format!(
            "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={}&steamids={}",
            key, sid
        );

        if let Ok(res) = self.client.get(&url).send().await {
            if res.status().is_success() {
                if let Ok(data) = res.json::<Value>().await {
                    let player = data
                        .pointer("/response/players/0");

                    let game_id = player
                        .and_then(|p| p.get("gameid"))
                        .and_then(|v| v.as_str().map(|s| s.to_string()).or_else(|| v.as_i64().map(|n| n.to_string())));

                    let game_name = player
                        .and_then(|p| p.get("gameextrainfo"))
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string());

                    let mut cur_app = self.active_app_id.write().await;
                    let mut cur_name = self.active_game_name.write().await;

                    if let Some(gid) = game_id {
                        if cur_app.as_deref() != Some(&gid) {
                            *cur_app = Some(gid.clone());
                            *cur_name = game_name;
                            drop(cur_app);
                            drop(cur_name);

                            // Premier passage d'initialisation pour indexer les succès existants sans alerte
                            self.check_player_achievements(&gid, true, app, obs).await;
                        }
                    } else if cur_app.is_some() {
                        *cur_app = None;
                        *cur_name = None;
                    }
                }
            }
        }
    }

    pub async fn check_player_achievements(
        &self,
        app_id: &str,
        is_initial: bool,
        app: &AppHandle,
        obs: &Arc<ObsServer>,
    ) {
        let api_key = self.api_key.read().await.clone();
        let steam_id = self.steam_id.read().await.clone();

        let (key, sid) = match (api_key, steam_id) {
            (Some(k), Some(s)) if !k.trim().is_empty() && !s.trim().is_empty() => (k, s),
            _ => return,
        };

        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0);

        let url = format!(
            "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/?appid={}&key={}&steamid={}&l=french&_t={}",
            app_id, key, sid, ts
        );

        let res = match self.client.get(&url).send().await {
            Ok(r) if r.status().is_success() => r,
            _ => return,
        };

        let data: Value = match res.json().await {
            Ok(d) => d,
            _ => return,
        };

        let achievements = match data.pointer("/playerstats/achievements").and_then(|v| v.as_array()) {
            Some(arr) => arr,
            None => return,
        };

        let mut known_guard = self.known_unlocked.write().await;
        let entry = known_guard
            .entry(app_id.to_string())
            .or_insert_with(HashSet::new);

        if is_initial {
            for a in achievements {
                if a.get("achieved").and_then(|v| v.as_i64()).unwrap_or(0) == 1 {
                    if let Some(apiname) = a.get("apiname").and_then(|v| v.as_str()) {
                        entry.insert(apiname.to_lowercase());
                    }
                }
            }
            return;
        }

        let total_achievements = achievements.len();
        let achieved_count = achievements
            .iter()
            .filter(|a| a.get("achieved").and_then(|v| v.as_i64()).unwrap_or(0) == 1)
            .count();
        let is_master = total_achievements > 0 && achieved_count >= total_achievements;

        let mut master_playtime: Option<f32> = None;
        if is_master {
            master_playtime = self.fetch_game_playtime_hours(app_id, &key, &sid).await;
        }

        // Vérification des nouveaux succès débloqués
        for a in achievements {
            let achieved = a.get("achieved").and_then(|v| v.as_i64()).unwrap_or(0);
            if achieved == 1 {
                if let Some(apiname) = a.get("apiname").and_then(|v| v.as_str()) {
                    let code_lower = apiname.to_lowercase();
                    if !entry.contains(&code_lower) {
                        entry.insert(code_lower.clone());

                        let provided_name = a.get("name").and_then(|v| v.as_str());
                        let provided_desc = a.get("description").and_then(|v| v.as_str());

                        let mut meta = self
                            .resolve_achievement_metadata(
                                app_id,
                                apiname,
                                provided_name,
                                provided_desc,
                            )
                            .await;

                        if is_master {
                            meta.tier = Some("master".to_string());
                            meta.playtime_hours = master_playtime;
                        }

                        let _ = app.emit("steam:achievement-unlocked", &meta);
                        obs.broadcast_achievement(&meta);
                    }
                }
            }
        }
    }

    pub async fn resolve_achievement_metadata(
        &self,
        app_id: &str,
        achievement_code: &str,
        provided_name: Option<&str>,
        provided_desc: Option<&str>,
    ) -> Achievement {
        let fallback_icon = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg".to_string();

        let api_key = self.api_key.read().await.clone();
        let schema = self.get_or_fetch_schema(app_id, api_key.as_deref()).await;

        let game_name = self.resolve_game_name(app_id, schema.as_ref()).await;

        let mut display_name = provided_name.map(|s| s.to_string());
        let mut description = provided_desc.map(|s| s.to_string());
        let mut icon = fallback_icon.clone();

        if let Some(ref s) = schema {
            if let Some(arr) = s.pointer("/availableGameStats/achievements").and_then(|v| v.as_array()) {
                let code_clean = achievement_code.to_lowercase().replace('"', "");
                for item in arr {
                    if let Some(name) = item.get("name").and_then(|v| v.as_str()) {
                        if name.to_lowercase() == code_clean {
                            if display_name.is_none() {
                                display_name = item.get("displayName").and_then(|v| v.as_str()).map(|s| s.to_string());
                            }
                            if description.is_none() {
                                description = item.get("description").and_then(|v| v.as_str()).map(|s| s.to_string());
                            }
                            if let Some(ic) = item.get("icon").and_then(|v| v.as_str()) {
                                icon = ic.to_string();
                            }
                            break;
                        }
                    }
                }
            }
        }

        Achievement {
            app_id: app_id.to_string(),
            achievement_code: achievement_code.to_string(),
            api_name: Some(achievement_code.to_string()),
            display_name: display_name.unwrap_or_else(|| achievement_code.to_string()),
            description: description.unwrap_or_else(|| "Succès débloqué !".to_string()),
            icon,
            game_name,
            unlocked_at: chrono_like_now(),
            is_test: false,
            preview_theme: None,
            tier: Some("common".to_string()),
            rarity_percent: None,
            playtime_hours: None,
        }
    }

    pub async fn fetch_game_playtime_hours(
        &self,
        app_id: &str,
        api_key: &str,
        steam_id: &str,
    ) -> Option<f32> {
        // 1. Essai avec GetRecentlyPlayedGames
        let url_recent = format!(
            "https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key={}&steamid={}&count=10",
            api_key, steam_id
        );
        if let Ok(res) = self.client.get(&url_recent).send().await {
            if res.status().is_success() {
                if let Ok(data) = res.json::<Value>().await {
                    if let Some(games) = data.pointer("/response/games").and_then(|v| v.as_array()) {
                        for g in games {
                            let g_appid = g.get("appid").and_then(|v| v.as_i64()).map(|id| id.to_string());
                            if g_appid.as_deref() == Some(app_id) {
                                if let Some(minutes) = g.get("playtime_forever").and_then(|v| v.as_f64()) {
                                    let hours = ((minutes / 60.0) * 10.0).round() / 10.0;
                                    return Some(hours as f32);
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Fallback avec GetOwnedGames (inclut tous les jeux possédés / F2P joués)
        let url_owned = format!(
            "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key={}&steamid={}&include_played_free_games=1&appids_filter[0]={}",
            api_key, steam_id, app_id
        );
        if let Ok(res) = self.client.get(&url_owned).send().await {
            if res.status().is_success() {
                if let Ok(data) = res.json::<Value>().await {
                    if let Some(games) = data.pointer("/response/games").and_then(|v| v.as_array()) {
                        for g in games {
                            let g_appid = g.get("appid").and_then(|v| v.as_i64()).map(|id| id.to_string());
                            if g_appid.as_deref() == Some(app_id) {
                                if let Some(minutes) = g.get("playtime_forever").and_then(|v| v.as_f64()) {
                                    let hours = ((minutes / 60.0) * 10.0).round() / 10.0;
                                    return Some(hours as f32);
                                }
                            }
                        }
                    }
                }
            }
        }

        None
    }

    async fn get_or_fetch_schema(&self, app_id: &str, api_key: Option<&str>) -> Option<Value> {
        {
            let cache = self.schema_cache.read().await;
            if let Some(val) = cache.get(app_id) {
                return Some(val.clone());
            }
        }

        let key = api_key?;
        let url = format!(
            "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key={}&appid={}&l=french",
            key, app_id
        );

        if let Ok(res) = self.client.get(&url).send().await {
            if res.status().is_success() {
                if let Ok(data) = res.json::<Value>().await {
                    if let Some(game) = data.get("game") {
                        let mut cache = self.schema_cache.write().await;
                        cache.insert(app_id.to_string(), game.clone());
                        return Some(game.clone());
                    }
                }
            }
        }

        None
    }

    async fn resolve_game_name(&self, app_id: &str, schema: Option<&Value>) -> String {
        if let Some(s) = schema {
            if let Some(n) = s.get("gameName").and_then(|v| v.as_str()) {
                if !n.trim().is_empty() {
                    return n.trim().to_string();
                }
            }
        }

        {
            let cache = self.game_name_cache.read().await;
            if let Some(n) = cache.get(app_id) {
                return n.clone();
            }
        }

        let url = format!("https://store.steampowered.com/api/appdetails?appids={}", app_id);
        if let Ok(res) = self.client.get(&url).send().await {
            if res.status().is_success() {
                if let Ok(data) = res.json::<Value>().await {
                    if let Some(name) = data.pointer(&format!("/{}/data/name", app_id)).and_then(|v| v.as_str()) {
                        let mut cache = self.game_name_cache.write().await;
                        cache.insert(app_id.to_string(), name.to_string());
                        return name.to_string();
                    }
                }
            }
        }

        format!("Jeu #{}", app_id)
    }

    pub async fn simulate_achievement(
        &self,
        app_id: &str,
        achievement_code: &str,
        app: &AppHandle,
        obs: &Arc<ObsServer>,
    ) -> Achievement {
        let mut ach = self
            .resolve_achievement_metadata(app_id, achievement_code, None, None)
            .await;
        ach.is_test = true;

        let code_upper = achievement_code.to_uppercase();
        if code_upper.contains("MASTER") || achievement_code == "100_PERCENT_MASTER" {
            ach.tier = Some("master".to_string());
            ach.playtime_hours = Some(142.5);
            ach.rarity_percent = Some(1.2);
        } else if code_upper.contains("RARE") {
            ach.tier = Some("rare".to_string());
            ach.rarity_percent = Some(4.8);
        }

        let _ = app.emit("steam:achievement-unlocked", &ach);
        obs.broadcast_achievement(&ach);

        ach
    }
}

pub fn chrono_like_now() -> String {
    // Format ISO 8601 simple sans dépendance chrono
    let dur = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = dur.as_secs();
    let millis = dur.subsec_millis();
    format!("{}.{:03}Z", secs, millis)
}
