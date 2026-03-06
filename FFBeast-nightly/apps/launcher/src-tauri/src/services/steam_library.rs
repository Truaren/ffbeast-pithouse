use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use tracing::{info, warn};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SteamGame {
    pub app_id: u32,
    pub name: String,
    pub install_dir: String,
    pub executable: Option<String>,
    pub library_path: PathBuf,
}

/// Reads Steam library folders from libraryfolders.vdf
pub fn get_steam_library_paths() -> Result<Vec<PathBuf>> {
    let home = std::env::var("HOME").map_err(|_| anyhow!("HOME not set"))?;
    
    // Common Steam paths on Linux
    let possible_paths = vec![
        PathBuf::from(format!("{}/.steam/steam", home)),
        PathBuf::from(format!("{}/.local/share/Steam", home)),
    ];

    let mut steam_root = None;
    for path in possible_paths {
        if path.exists() {
            steam_root = Some(path);
            break;
        }
    }

    let steam_root = steam_root.ok_or_else(|| anyhow!("Steam installation not found"))?;
    let library_file = steam_root.join("steamapps/libraryfolders.vdf");

    if !library_file.exists() {
        return Err(anyhow!("libraryfolders.vdf not found"));
    }

    let content = fs::read_to_string(&library_file)?;
    let mut libraries = vec![steam_root.clone()];

    // Parse simple VDF format - look for "path" entries
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("\"path\"") {
            if let Some(path_start) = trimmed.find("\"path\"") {
                let after_key = &trimmed[path_start + 6..].trim();
                if let Some(value) = after_key.strip_prefix('"') {
                    if let Some(end) = value.find('"') {
                        let path = PathBuf::from(&value[..end]);
                        if path.exists() {
                            libraries.push(path);
                        }
                    }
                }
            }
        }
    }

    info!("Found {} Steam library paths", libraries.len());
    Ok(libraries)
}

/// Parses an ACF file (Steam app manifest)
fn parse_acf_file(path: &Path) -> Result<HashMap<String, String>> {
    let content = fs::read_to_string(path)?;
    let mut data = HashMap::new();
    
    for line in content.lines() {
        let trimmed = line.trim();
        
        // Skip lines that don't contain key-value pairs
        if !trimmed.starts_with('"') || !trimmed.contains('"') {
            continue;
        }
        
        // Parse "key" "value" or "key"\t\t"value" format
        let parts: Vec<&str> = trimmed.split('"').collect();
        if parts.len() >= 4 {
            let key = parts[1].trim();
            let value = parts[3].trim();
            if !key.is_empty() && !value.is_empty() {
                data.insert(key.to_string(), value.to_string());
            }
        }
    }
    
    Ok(data)
}

/// Checks if an app_id is actually a game via Steam Store API
async fn is_game_via_store_api(app_id: u32) -> bool {
    let url = format!("https://store.steampowered.com/api/appdetails?appids={}", app_id);
    
    if let Ok(response) = reqwest::get(&url).await {
        if let Ok(json) = response.json::<serde_json::Value>().await {
            if let Some(app_data) = json.get(&app_id.to_string()) {
                if let Some(success) = app_data.get("success").and_then(|v| v.as_bool()) {
                    if success {
                        if let Some(data) = app_data.get("data") {
                            if let Some(app_type) = data.get("type").and_then(|v| v.as_str()) {
                                return app_type == "game";
                            }
                        }
                    }
                }
            }
        }
    }
    false
}

/// Scans all Steam libraries and returns installed games
pub async fn scan_steam_games() -> Result<Vec<SteamGame>> {
    let libraries = get_steam_library_paths()?;
    let mut games = Vec::new();

    // Try to initialize Steam API for more accurate detection
    // This will only work if Steam is running
    let steam_client = steamworks::Client::init();
    let use_steam_api = steam_client.is_ok();
    
    if use_steam_api {
        info!("Using Steam API for game detection");
    } else {
        info!("Steam API unavailable, using local detection");
    }

    for library in libraries {
        let steamapps = library.join("steamapps");
        if !steamapps.exists() {
            continue;
        }

        // Read all .acf files
        let entries = fs::read_dir(&steamapps)?;
        for entry in entries {
            let entry = entry?;
            let path = entry.path();
            
            if path.extension().and_then(|s| s.to_str()) != Some("acf") {
                continue;
            }

            match parse_acf_file(&path) {
                Ok(data) => {
                    if let (Some(app_id), Some(name), Some(install_dir)) = (
                        data.get("appid").and_then(|s| s.parse::<u32>().ok()),
                        data.get("name"),
                        data.get("installdir"),
                    ) {
                        // First check if it's installed via Steam API (fast)
                        let is_installed = if use_steam_api {
                            if let Ok(client) = &steam_client {
                                client.apps().is_app_installed(steamworks::AppId(app_id))
                            } else {
                                true // fallback to yes
                            }
                        } else {
                            true
                        };
                        
                        if !is_installed {
                            continue;
                        }
                        
                        // Then validate type via Store API (accurate but slower)
                        // This ensures we only get actual games, not tools/DLCs
                        let is_game = is_game_via_store_api(app_id).await;
                        
                        if !is_game {
                            continue;
                        }
                        
                        let game_path = steamapps.join("common").join(install_dir);
                        
                        games.push(SteamGame {
                            app_id,
                            name: name.clone(),
                            install_dir: install_dir.clone(),
                            executable: find_executable(&game_path),
                            library_path: library.clone(),
                        });
                    }
                }
                Err(e) => {
                    warn!("Failed to parse {:?}: {}", path, e);
                }
            }
        }
    }

    info!("Found {} installed Steam games", games.len());
    Ok(games)
}

/// Tries to find the main executable for a game
fn find_executable(game_path: &Path) -> Option<String> {
    if !game_path.exists() {
        return None;
    }

    // Common patterns for executables
    let _patterns = vec![
        "*.exe", // Windows exe (for Proton)
        "*.x86_64",
        "*.x86",
    ];

    // Try to find executable files
    if let Ok(entries) = fs::read_dir(game_path) {
        for entry in entries.flatten() {
            if let Some(_name) = entry.file_name().to_str() {
                // Check if executable
                if let Ok(metadata) = entry.metadata() {
                    #[cfg(unix)]
                    {
                        use std::os::unix::fs::PermissionsExt;
                        if metadata.permissions().mode() & 0o111 != 0 {
                            return Some(entry.path().to_string_lossy().to_string());
                        }
                    }
                }
            }
        }
    }

    None
}
