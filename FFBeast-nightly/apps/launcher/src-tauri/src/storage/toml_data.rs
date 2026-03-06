use serde::{Deserialize, Serialize};
use crate::models::{Game, WheelProfile};

#[derive(Serialize, Deserialize, Default)]
pub struct TomlData {
    pub games: Vec<Game>,
    pub profiles: Vec<WheelProfile>,
    #[serde(default)]
    pub settings: std::collections::HashMap<String, String>,
}
