use crate::models::{Game, WheelProfile};
use anyhow::Result;

pub trait StorageBackend {
    // Games
    fn list_games(&self) -> Result<Vec<Game>>;
    fn save_game(&self, game: Game) -> Result<()>;
    fn delete_game(&self, id: &str) -> Result<()>;
    fn get_game(&self, id: &str) -> Result<Option<Game>>;
    
    // Profiles
    fn list_profiles(&self) -> Result<Vec<WheelProfile>>;
    fn save_profile(&self, profile: WheelProfile) -> Result<()>;
    fn get_profile(&self, id: &str) -> Result<Option<WheelProfile>>;

    // Settings
    fn save_setting(&self, key: &str, value: &str) -> Result<()>;
    fn get_setting(&self, key: &str) -> Result<Option<String>>;

}
