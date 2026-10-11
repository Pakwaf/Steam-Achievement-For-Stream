use crate::models::SteamUser;
use std::collections::HashMap;
use tauri::{Manager, WebviewUrl, WebviewWindowBuilder};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;

pub async fn authenticate(
    app: tauri::AppHandle,
    api_key: Option<String>,
) -> Result<SteamUser, String> {
    // 1. Démarre un serveur local temporaire sur un port aléatoire libre
    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .map_err(|e| format!("Impossible de lier le serveur local pour l'authentification: {e}"))?;

    let port = listener
        .local_addr()
        .map_err(|e| format!("Erreur adresse locale: {e}"))?
        .port();

    let return_to = format!("http://localhost:{port}/auth/steam/callback");
    let realm = format!("http://localhost:{port}/");

    // 2. Construction de l'URL Steam OpenID 2.0
    let auth_url = format!(
        "https://steamcommunity.com/openid/login?openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.mode=checkid_setup&openid.return_to={}&openid.realm={}&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select",
        urlencoding(&return_to),
        urlencoding(&realm)
    );

    // 3. Ouvre une popup de connexion dédiée
    if let Some(existing) = app.get_webview_window("steam_auth") {
        let _ = existing.close();
    }

    let parsed_url = auth_url
        .parse()
        .map_err(|e| format!("URL d'authentification invalide: {e}"))?;

    WebviewWindowBuilder::new(&app, "steam_auth", WebviewUrl::External(parsed_url))
        .title("Connexion Steam")
        .inner_size(820.0, 720.0)
        .build()
        .map_err(|e| format!("Erreur ouverture fenêtre de connexion Steam: {e}"))?;

    // 4. Attend la redirection de callback HTTP
    let (mut socket, _) = listener
        .accept()
        .await
        .map_err(|e| format!("Erreur attente callback: {e}"))?;

    let mut buf = [0u8; 4096];
    let n = socket
        .read(&mut buf)
        .await
        .map_err(|e| format!("Erreur lecture requête callback: {e}"))?;

    let request_str = String::from_utf8_lossy(&buf[..n]);

    // Ferme la fenêtre modale
    if let Some(w) = app.get_webview_window("steam_auth") {
        let _ = w.close();
    }

    // Réponse HTML pour l'utilisateur
    let html_body = r#"<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Steam Auth</title>
<style>
body { margin: 0; background: #171a21; color: #c7d5e0; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; }
.card { text-align: center; background: #1b2838; padding: 2rem 3rem; border-radius: 10px; border: 1px solid #2a475e; }
h1 { color: #66c0f4; margin: 0 0 0.5rem; }
p { color: #8f98a0; margin: 0; }
</style></head>
<body><div class="card"><h1>Connexion réussie !</h1><p>Retour vers l'application en cours...</p></div></body></html>"#;

    let response = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        html_body.len(),
        html_body
    );
    let _ = socket.write_all(response.as_bytes()).await;
    let _ = socket.flush().await;

    // 5. Parse les query parameters du callback
    let first_line = request_str.lines().next().unwrap_or_default();
    let query_string = first_line
        .split_whitespace()
        .nth(1)
        .and_then(|p| p.split_once('?'))
        .map(|(_, q)| q)
        .ok_or_else(|| "Paramètres d'authentification Steam manquants.".to_string())?;

    let params = parse_query_string(query_string);

    // 6. Valide la signature OpenID auprès de Valve
    validate_openid(&params).await?;

    // 7. Extrait le SteamID64
    let claimed_id = params
        .get("openid.claimed_id")
        .ok_or_else(|| "openid.claimed_id manquant.".to_string())?;

    let steam_id = extract_steam_id(claimed_id)?;

    // 8. Récupère le profil (Pseudo, Avatar)
    let user = fetch_user_profile(&steam_id, api_key.as_deref()).await;
    Ok(user)
}

fn urlencoding(input: &str) -> String {
    let mut encoded = String::new();
    for b in input.bytes() {
        match b {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(b as char)
            }
            _ => encoded.push_str(&format!("%{:02X}", b)),
        }
    }
    encoded
}

fn parse_query_string(qs: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    for part in qs.split('&') {
        if let Some((k, v)) = part.split_once('=') {
            let key = urldecode(k);
            let val = urldecode(v);
            map.insert(key, val);
        }
    }
    map
}

fn urldecode(input: &str) -> String {
    let mut res = Vec::new();
    let bytes = input.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(b) = u8::from_str_radix(&input[i + 1..i + 3], 16) {
                res.push(b);
                i += 3;
                continue;
            }
        } else if bytes[i] == b'+' {
            res.push(b' ');
            i += 1;
            continue;
        }
        res.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&res).to_string()
}

async fn validate_openid(params: &HashMap<String, String>) -> Result<(), String> {
    let mut verify_params = Vec::new();
    for (k, v) in params {
        if k == "openid.mode" {
            verify_params.push(("openid.mode".to_string(), "check_authentication".to_string()));
        } else {
            verify_params.push((k.clone(), v.clone()));
        }
    }

    let client = reqwest::Client::new();
    let res = client
        .post("https://steamcommunity.com/openid/login")
        .form(&verify_params)
        .send()
        .await
        .map_err(|e| format!("Erreur contact Steam OpenID: {e}"))?;

    let text = res
        .text()
        .await
        .map_err(|e| format!("Erreur lecture réponse validation: {e}"))?;

    if text.contains("is_valid:true") {
        Ok(())
    } else {
        Err("Validation OpenID échouée : signature rejetée par Steam.".to_string())
    }
}

fn extract_steam_id(claimed_id: &str) -> Result<String, String> {
    if let Some(pos) = claimed_id.rfind("/id/") {
        let id_part = &claimed_id[pos + 4..];
        let trimmed = id_part.trim_matches('/');
        if !trimmed.is_empty() && trimmed.chars().all(|c| c.is_ascii_digit()) {
            return Ok(trimmed.to_string());
        }
    }
    Err(format!(
        "Format SteamID non reconnu dans : {claimed_id}"
    ))
}

pub async fn fetch_user_profile(steam_id: &str, api_key: Option<&str>) -> SteamUser {
    let client = reqwest::Client::new();

    // 1. Essai Steam Web API officielle
    if let Some(key) = api_key {
        let trimmed_key = key.trim();
        if !trimmed_key.is_empty() {
            let api_url = format!(
                "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={trimmed_key}&steamids={steam_id}"
            );
            if let Ok(res) = client.get(&api_url).send().await {
                if let Ok(json) = res.json::<serde_json::Value>().await {
                    if let Some(player) = json["response"]["players"].as_array().and_then(|p| p.first()) {
                        let persona_name = player["personaname"].as_str().unwrap_or(steam_id).to_string();
                        let avatar = player["avatarfull"]
                            .as_str()
                            .or_else(|| player["avatarmedium"].as_str())
                            .or_else(|| player["avatar"].as_str())
                            .unwrap_or("https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg")
                            .to_string();
                        let profile_url = player["profileurl"]
                            .as_str()
                            .unwrap_or(&format!("https://steamcommunity.com/profiles/{steam_id}"))
                            .to_string();
                        let online_state = if player["personastate"].as_i64().unwrap_or(0) != 0 {
                            "En ligne".to_string()
                        } else {
                            "Hors ligne".to_string()
                        };

                        return SteamUser {
                            steam_id: steam_id.to_string(),
                            persona_name,
                            avatar,
                            profile_url,
                            online_state,
                            authenticated_at: chrono_like_now(),
                        };
                    }
                }
            }
        }
    }

    // 2. Fallback XML public
    let xml_url = format!("https://steamcommunity.com/profiles/{steam_id}/?xml=1");
    if let Ok(res) = client.get(&xml_url).send().await {
        if let Ok(xml) = res.text().await {
            let persona_name = extract_tag(&xml, "steamID").unwrap_or_else(|| format!("Joueur ({steam_id})"));
            let avatar = extract_tag(&xml, "avatarFull")
                .unwrap_or_else(|| "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg".to_string());
            let online_state = if extract_tag(&xml, "onlineState").as_deref() == Some("online") {
                "En ligne".to_string()
            } else {
                "Hors ligne".to_string()
            };

            return SteamUser {
                steam_id: steam_id.to_string(),
                persona_name,
                avatar,
                profile_url: format!("https://steamcommunity.com/profiles/{steam_id}"),
                online_state,
                authenticated_at: chrono_like_now(),
            };
        }
    }

    // 3. Fallback profil privé
    SteamUser {
        steam_id: steam_id.to_string(),
        persona_name: format!("Joueur Steam #{}", &steam_id[steam_id.len().saturating_sub(4)..]),
        avatar: "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg".to_string(),
        profile_url: format!("https://steamcommunity.com/profiles/{steam_id}"),
        online_state: "Inconnu".to_string(),
        authenticated_at: chrono_like_now(),
    }
}

fn extract_tag(xml: &str, tag: &str) -> Option<String> {
    let open_tag = format!("<{tag}>");
    let close_tag = format!("</{tag}>");
    if let Some(start) = xml.find(&open_tag) {
        let content_start = start + open_tag.len();
        if let Some(end) = xml[content_start..].find(&close_tag) {
            let raw = &xml[content_start..content_start + end];
            // Retire d'éventuels CDATA
            let cleaned = if raw.starts_with("<![CDATA[") && raw.ends_with("]]>") {
                &raw[9..raw.len() - 3]
            } else {
                raw
            };
            return Some(cleaned.trim().to_string());
        }
    }
    None
}

fn chrono_like_now() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default();
    format!("{}", now.as_secs())
}
