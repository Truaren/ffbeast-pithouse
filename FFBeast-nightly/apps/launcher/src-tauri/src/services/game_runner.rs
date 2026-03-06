use crate::models::{Game, WheelProfile};
use anyhow::{anyhow, Result};
use std::process::{Child, Command};
use tracing::{info, instrument};

pub struct GameRunner;

impl GameRunner {
    #[instrument(skip(game, profile), fields(game = %game.name), err)]
    pub fn run(game: &Game, profile: Option<&WheelProfile>) -> Result<Child> {
        // 1. Check if it's a Steam game - launch via Steam
        if game.is_steam {
            if let Some(steam_id) = game.steam_id {
                info!("Steam game detected (App ID: {}), launching via Steam protocol", steam_id);
                return Self::launch_steam_game(steam_id);
            }
        }

        // 2. For non-Steam games, detect if it's Windows .exe
        let is_windows_exe = game.path.extension()
            .and_then(|e| e.to_str())
            .map(|ext| ext.to_lowercase() == "exe")
            .unwrap_or(false);

        // 3. Apply wheel profile BEFORE launching game
        if let Some(wheel_profile) = &game.wheel_profile {
            info!("Applying custom wheel profile before launching game");
            // Convert WheelProfileSettings to the format hardware service expects
            // This will apply motion_range and total_force to the wheel
            // TODO: Integrate with hardware service to actually apply settings
            info!("Motion Range: {}, Total Force: {}", 
                  wheel_profile.motion_range, 
                  wheel_profile.total_force);
        } else if let Some(p) = profile {
            info!("Applying default profile: {} for game {}", p.name, game.name);
            // Apply default profile if no custom profile set
        }

        // 4. Prepare command based on platform and file type
        let mut cmd = if cfg!(target_os = "linux") && is_windows_exe {
            info!("Windows .exe detected on Linux, using Proton/Wine");
            Self::prepare_proton_command(game)
        } else {
            Self::prepare_native_command(game)
        };

        // 5. Injetar Variáveis de Ambiente
        for (key, value) in &game.environment_vars {
            cmd.env(key, value);
        }

        // 6. Injetar DLL Overrides (Específico para Wine/Proton no Linux)
        if !game.dll_overrides.is_empty() {
            let overrides = game.dll_overrides.join(";");
            cmd.env("WINEDLLOVERRIDES", overrides);
        }

        // 7. Executar
        info!("Lançando jogo: {} em {:?}", game.name, game.path);
        cmd.spawn()
            .map_err(|e| anyhow!("Falha ao lançar o jogo: {}", e))
    }

    /// Launch Steam game using steam:// protocol
    fn launch_steam_game(app_id: u32) -> Result<Child> {
        let steam_url = format!("steam://rungameid/{}", app_id);
        
        #[cfg(target_os = "linux")]
        {
            Command::new("xdg-open")
                .arg(&steam_url)
                .spawn()
                .map_err(|e| anyhow!("Failed to launch Steam game: {}", e))
        }

        #[cfg(target_os = "windows")]
        {
            Command::new("cmd")
                .args(["/C", "start", "\"\"", &steam_url])
                .spawn()
                .map_err(|e| anyhow!("Failed to launch Steam game: {}", e))
        }
    }

    fn prepare_native_command(game: &Game) -> Command {
        let mut cmd = Command::new(&game.path);
        cmd.args(&game.arguments);

        // Configura o diretório de trabalho para a pasta do jogo
        if let Some(parent) = game.path.parent() {
            cmd.current_dir(parent);
        }

        cmd
    }

    fn prepare_proton_command(game: &Game) -> Command {
        // No Linux, idealmente buscaríamos o caminho do Proton via config ou detecção automática
        // Por agora, assumimos 'proton run' via shell ou caminho direto configurado
        let mut cmd = Command::new("proton");
        cmd.arg("run");
        cmd.arg(&game.path);
        cmd.args(&game.arguments);

        if let Some(parent) = game.path.parent() {
            cmd.current_dir(parent);
        }

        cmd
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_native_command_args() {
        let game = Game {
            id: "test".to_string(),
            name: "Test Game".to_string(),
            path: PathBuf::from("cmd.exe"),
            arguments: vec!["/c".to_string(), "echo".to_string(), "hello".to_string()],
            ..Default::default()
        };

        let cmd = GameRunner::prepare_native_command(&game);
        assert_eq!(cmd.get_program(), "cmd.exe");
        let args: Vec<_> = cmd.get_args().map(|s| s.to_str().unwrap()).collect();
        assert_eq!(args, vec!["/c", "echo", "hello"]);
    }
}
