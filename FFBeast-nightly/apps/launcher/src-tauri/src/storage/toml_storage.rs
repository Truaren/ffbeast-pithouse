use crate::models::{Game, WheelProfile};
use crate::storage::backend::StorageBackend;
use crate::storage::toml_data::TomlData;
use anyhow::{Context, Result};
use std::fs;
use std::path::PathBuf;
use std::sync::RwLock;
use tracing::instrument;

pub struct TomlStorage {
    file_path: PathBuf,
    cache: RwLock<TomlData>,
}

impl TomlStorage {
    #[instrument(skip(file_path), fields(path = %file_path.display()), err)]
    pub fn new(file_path: PathBuf) -> Result<Self> {
        let data = if file_path.exists() {
            let content = fs::read_to_string(&file_path)?;
            toml::from_str(&content).context("Failed to parse TOML")?
        } else {
            TomlData::default()
        };

        Ok(Self {
            file_path,
            cache: RwLock::new(data),
        })
    }

    #[instrument(skip(self, data), err)]
    fn save_to_disk(&self, data: &TomlData) -> Result<()> {
        let content = toml::to_string_pretty(data)?;
        fs::write(&self.file_path, content)?;
        Ok(())
    }
}

impl StorageBackend for TomlStorage {
    #[instrument(skip(self), err)]
    fn list_games(&self) -> Result<Vec<Game>> {
        let cache = self.cache.read().unwrap();
        Ok(cache.games.clone())
    }

    #[instrument(skip(self, game), fields(game_id = %game.id), err)]
    fn save_game(&self, game: Game) -> Result<()> {
        let mut cache = self.cache.write().unwrap();
        if let Some(pos) = cache.games.iter().position(|g| g.id == game.id) {
            cache.games[pos] = game;
        } else {
            cache.games.push(game);
        }
        self.save_to_disk(&cache)
    }

    #[instrument(skip(self), err)]
    fn delete_game(&self, id: &str) -> Result<()> {
        let mut cache = self.cache.write().unwrap();
        cache.games.retain(|g| g.id != id);
        self.save_to_disk(&cache)
    }

    #[instrument(skip(self), err)]
    fn get_game(&self, id: &str) -> Result<Option<Game>> {
        let cache = self.cache.read().unwrap();
        Ok(cache.games.iter().find(|g| g.id == id).cloned())
    }

    #[instrument(skip(self), err)]
    fn list_profiles(&self) -> Result<Vec<WheelProfile>> {
        let cache = self.cache.read().unwrap();
        Ok(cache.profiles.clone())
    }

    #[instrument(skip(self, profile), fields(profile_id = %profile.id), err)]
    fn save_profile(&self, profile: WheelProfile) -> Result<()> {
        let mut cache = self.cache.write().unwrap();
        if let Some(pos) = cache.profiles.iter().position(|p| p.id == profile.id) {
            cache.profiles[pos] = profile;
        } else {
            cache.profiles.push(profile);
        }
        self.save_to_disk(&cache)
    }

    #[instrument(skip(self), err)]
    fn get_profile(&self, id: &str) -> Result<Option<WheelProfile>> {
        let cache = self.cache.read().unwrap();
        Ok(cache.profiles.iter().find(|p| p.id == id).cloned())
    }

    #[instrument(skip(self), err)]
    fn save_setting(&self, key: &str, value: &str) -> Result<()> {
        let mut cache = self.cache.write().unwrap();
        cache.settings.insert(key.to_string(), value.to_string());
        self.save_to_disk(&cache)
    }

    #[instrument(skip(self), err)]
    fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let cache = self.cache.read().unwrap();
        Ok(cache.settings.get(key).cloned())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_toml_lifecycle() {
        let mut temp_path = env::temp_dir();
        temp_path.push("test_ffbeast.toml");

        if temp_path.exists() {
            fs::remove_file(&temp_path).unwrap();
        }

        let storage = TomlStorage::new(temp_path.clone()).unwrap();

        let mut game = Game::default();
        game.id = "test-1".to_string();
        game.name = "Test Game".to_string();

        storage.save_game(game).unwrap();

        let games = storage.list_games().unwrap();
        assert_eq!(games.len(), 1);
        assert_eq!(games[0].name, "Test Game");

        fs::remove_file(temp_path).unwrap();
    }
}
