use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct WheelProfileSettings {
    pub motion_range: u16,
    pub total_force: u8,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Game {
    pub id: String,
    pub name: String,
    pub path: PathBuf,
    pub arguments: Vec<String>,
    pub environment_vars: HashMap<String, String>,
    pub dll_overrides: Vec<String>,
    pub wheel_profile: Option<WheelProfileSettings>,
    pub use_compat_layer: bool,
    pub icon_path: Option<String>,
    pub cover_path: Option<String>,
    pub is_steam: bool,
    pub steam_id: Option<u32>,
}
