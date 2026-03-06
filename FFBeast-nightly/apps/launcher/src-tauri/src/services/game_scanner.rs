use crate::models::Game;
use serde::Deserialize;
use std::path::PathBuf;
use tracing::{info, error};

#[derive(Debug, Deserialize)]
struct GameConfig {
    id: String,
    name: String,
    paths: Vec<String>,
    #[serde(default, rename = "steamId")]
    steam_id: Option<u32>,
    #[serde(default, rename = "useCompatLayer")]
    use_compat_layer: bool,
}

pub struct GameScanner;

impl GameScanner {
    pub fn scan() -> Vec<Game> {
        let mut games = Vec::new();
        let library_paths = Self::get_library_paths();

        // Load Game Definitions from embedded JSON
        let game_configs: Vec<GameConfig> = match serde_json::from_str(include_str!("../data/games.json")) {
            Ok(configs) => configs,
            Err(e) => {
                error!("Failed to parse games.json: {}", e);
                return vec![];
            }
        };

        info!("Scanning for games in: {:?}", library_paths);

        for library_path in &library_paths {
            if !library_path.exists() {
                continue;
            }

            for config in &game_configs {
                for relative_path in &config.paths {
                    let full_path = library_path.join(relative_path);
                    if full_path.exists() {
                        info!("Found {} at {:?}", config.name, full_path);
                        
                        // Avoid duplicates
                        if games.iter().any(|g: &Game| g.id == config.id) {
                            continue;
                        }

                        // Compatibility layer is typically a Linux requirement (Proton/Wine)
                        let use_compat = if cfg!(target_os = "linux") {
                            config.use_compat_layer
                        } else {
                            false
                        };

                        games.push(Game {
                            id: config.id.clone(),
                            name: config.name.clone(),
                            path: full_path,
                            arguments: vec![],
                            environment_vars: Default::default(),
                            dll_overrides: vec![],
                            wheel_profile: None,
                            use_compat_layer: use_compat,
                            icon_path: None,
                            cover_path: None,
                            is_steam: false,
                            steam_id: None,
                        });
                        
                        break; 
                    }
                }
            }
        }
        
        games
    }

    #[cfg(target_os = "linux")]
    fn get_library_paths() -> Vec<PathBuf> {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        vec![
            PathBuf::from(&home).join(".steam/steam/steamapps/common"),
            PathBuf::from(&home).join(".local/share/Steam/steamapps/common"),
        ]
    }

    #[cfg(target_os = "windows")]
    fn get_library_paths() -> Vec<PathBuf> {
        vec![
            PathBuf::from(r"C:\Program Files (x86)\Steam\steamapps\common"),
            PathBuf::from(r"C:\Program Files\Steam\steamapps\common"),
            // TODO: Retrieve additional library folders from registry or libraryfolders.vdf
        ]
    }

    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    fn get_library_paths() -> Vec<PathBuf> {
        vec![]
    }
}
