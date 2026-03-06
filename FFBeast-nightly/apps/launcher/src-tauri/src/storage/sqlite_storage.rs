use crate::models::{Game, WheelProfile};
use crate::storage::backend::StorageBackend;
use anyhow::{Context, Result};
use rusqlite::{params, Connection};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub struct SqliteStorage {
    conn: Arc<Mutex<Connection>>,
}

impl SqliteStorage {
    pub fn new(path: PathBuf) -> Result<Self> {
        let conn = Connection::open(path).context("Failed to open SQLite database")?;

        // Initialize tables
        conn.execute(
            "CREATE TABLE IF NOT EXISTS games (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                arguments TEXT,
                environment_vars TEXT,
                dll_overrides TEXT,
                wheel_profile TEXT,
                use_compat_layer INTEGER,
                icon_path TEXT,
                cover_path TEXT,
                is_steam INTEGER DEFAULT 0,
                steam_id INTEGER
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                motion_range INTEGER,
                total_force INTEGER,
                dynamic_dampening INTEGER,
                static_dampening INTEGER,
                power_limit INTEGER,
                braking_limit INTEGER
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
            [],
        )?;

        // Simple migration for dev
        let _ = conn.execute("ALTER TABLE games ADD COLUMN icon_path TEXT", []);
        let _ = conn.execute("ALTER TABLE games ADD COLUMN cover_path TEXT", []);
        let _ = conn.execute("ALTER TABLE games ADD COLUMN is_steam INTEGER DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE games ADD COLUMN steam_id INTEGER", []);

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
        })
    }
}

impl StorageBackend for SqliteStorage {
    fn list_games(&self) -> Result<Vec<Game>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, path, arguments, environment_vars, dll_overrides, wheel_profile, use_compat_layer, icon_path, cover_path, is_steam, steam_id FROM games")?;

        let game_iter = stmt.query_map([], |row| {
            let env_str: String = row.get(4)?;
            let dll_str: String = row.get(5)?;
            let env_vars: std::collections::HashMap<String, String> =
                serde_json::from_str(&env_str).unwrap_or_default();
            let dll_overrides: Vec<String> = serde_json::from_str(&dll_str).unwrap_or_default();
            let args_str: String = row.get(3)?;
            let arguments: Vec<String> = serde_json::from_str(&args_str).unwrap_or_default();
            let wheel_profile_str: String = row.get(6)?;
            let wheel_profile = if wheel_profile_str.is_empty() {
                None
            } else {
                serde_json::from_str(&wheel_profile_str).ok()
            };

            Ok(Game {
                id: row.get(0)?,
                name: row.get(1)?,
                path: PathBuf::from(row.get::<_, String>(2)?),
                arguments,
                environment_vars: env_vars,
                dll_overrides,
                wheel_profile,
                use_compat_layer: row.get::<_, i32>(7)? != 0,
                icon_path: row.get(8)?,
                cover_path: row.get(9)?,
                is_steam: row.get::<_, i32>(10)? != 0,
                steam_id: row.get(11)?,
            })
        })?;

        let mut games = Vec::new();
        for game in game_iter {
            games.push(game?);
        }
        Ok(games)
    }

    fn save_game(&self, game: Game) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let env_vars = serde_json::to_string(&game.environment_vars)?;
        let dll_overrides = serde_json::to_string(&game.dll_overrides)?;
        let arguments = serde_json::to_string(&game.arguments)?;
        let wheel_profile = if let Some(profile) = &game.wheel_profile {
            serde_json::to_string(profile)?
        } else {
            String::new()
        };

        conn.execute(
            "INSERT OR REPLACE INTO games (id, name, path, arguments, environment_vars, dll_overrides, wheel_profile, use_compat_layer, icon_path, cover_path, is_steam, steam_id) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                game.id,
                game.name,
                game.path.to_string_lossy(),
                arguments,
                env_vars,
                dll_overrides,
                wheel_profile,
                if game.use_compat_layer { 1 } else { 0 },
                game.icon_path,
                game.cover_path,
                if game.is_steam { 1 } else { 0 },
                game.steam_id
            ],
        )?;
        Ok(())
    }

    fn delete_game(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM games WHERE id = ?1", params![id])?;
        Ok(())
    }

    fn get_game(&self, id: &str) -> Result<Option<Game>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, path, arguments, environment_vars, dll_overrides, wheel_profile, use_compat_layer, icon_path, cover_path, is_steam, steam_id FROM games WHERE id = ?1")?;

        let mut game_iter = stmt.query_map(params![id], |row| {
            let env_str: String = row.get(4)?;
            let dll_str: String = row.get(5)?;
            let env_vars: std::collections::HashMap<String, String> =
                serde_json::from_str(&env_str).unwrap_or_default();
            let dll_overrides: Vec<String> = serde_json::from_str(&dll_str).unwrap_or_default();
            let args_str: String = row.get(3)?;
            let arguments: Vec<String> = serde_json::from_str(&args_str).unwrap_or_default();
            let wheel_profile_str: String = row.get(6)?;
            let wheel_profile = if wheel_profile_str.is_empty() {
                None
            } else {
                serde_json::from_str(&wheel_profile_str).ok()
            };

            Ok(Game {
                id: row.get(0)?,
                name: row.get(1)?,
                path: PathBuf::from(row.get::<_, String>(2)?),
                arguments,
                environment_vars: env_vars,
                dll_overrides,
                wheel_profile,
                use_compat_layer: row.get::<_, i32>(7)? != 0,
                icon_path: row.get(8)?,
                cover_path: row.get(9)?,
                is_steam: row.get::<_, i32>(10)? != 0,
                steam_id: row.get(11)?,
            })
        })?;

        if let Some(game) = game_iter.next() {
            Ok(Some(game?))
        } else {
            Ok(None)
        }
    }


    fn list_profiles(&self) -> Result<Vec<WheelProfile>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, motion_range, total_force, dynamic_dampening, static_dampening, power_limit, braking_limit FROM profiles")?;

        let profile_iter = stmt.query_map([], |row| {
            Ok(WheelProfile {
                id: row.get(0)?,
                name: row.get(1)?,
                motion_range: row.get(2)?,
                total_force: row.get(3)?,
                dynamic_dampening: row.get(4)?,
                static_dampening: row.get(5)?,
                power_limit: row.get(6)?,
                braking_limit: row.get(7)?,
            })
        })?;

        let mut profiles = Vec::new();
        for profile in profile_iter {
            profiles.push(profile?);
        }
        Ok(profiles)
    }

    fn save_profile(&self, profile: WheelProfile) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO profiles (id, name, motion_range, total_force, dynamic_dampening, static_dampening, power_limit, braking_limit) 
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                profile.id,
                profile.name,
                profile.motion_range,
                profile.total_force,
                profile.dynamic_dampening,
                profile.static_dampening,
                profile.power_limit,
                profile.braking_limit
            ],
        )?;
        Ok(())
    }

    fn get_profile(&self, id: &str) -> Result<Option<WheelProfile>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, motion_range, total_force, dynamic_dampening, static_dampening, power_limit, braking_limit FROM profiles WHERE id = ?1")?;

        let mut profile_iter = stmt.query_map(params![id], |row| {
            Ok(WheelProfile {
                id: row.get(0)?,
                name: row.get(1)?,
                motion_range: row.get(2)?,
                total_force: row.get(3)?,
                dynamic_dampening: row.get(4)?,
                static_dampening: row.get(5)?,
                power_limit: row.get(6)?,
                braking_limit: row.get(7)?,
            })
        })?;

        if let Some(profile) = profile_iter.next() {
            Ok(Some(profile?))
        } else {
            Ok(None)
        }
    }

    fn save_setting(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    }

    fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
        
        let mut iter = stmt.query_map(params![key], |row| row.get(0))?;
        
        if let Some(result) = iter.next() {
            Ok(Some(result?))
        } else {
            Ok(None)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_sqlite_lifecycle() {
        let mut temp_path = env::temp_dir();
        temp_path.push("test_ffbeast_lifecycle.db");

        if temp_path.exists() {
            let _ = std::fs::remove_file(&temp_path);
        }

        {
            let storage = SqliteStorage::new(temp_path.clone()).unwrap();

            let mut game = Game::default();
            game.id = "test-sql-1".to_string();
            game.name = "SQL Test Game".to_string();

            storage.save_game(game).unwrap();

            let games = storage.list_games().unwrap();
            assert_eq!(games.len(), 1);
            assert_eq!(games[0].name, "SQL Test Game");
        }

        let _ = std::fs::remove_file(temp_path);
    }
}
