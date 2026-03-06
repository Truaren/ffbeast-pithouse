pub mod models;
pub mod services;
pub mod storage;

use crate::models::WheelProfile;

use crate::storage::{SqliteStorage, StorageBackend};
use ffbeast_controller::{EffectSettings, HardwareService, HardwareSettings, WheelInterface};
use sodevs_input_manager::{InputManager, KeyMapping, Profile};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::Emitter as _;
use tauri::State;
use tracing::{info, instrument};
use tracing_subscriber::fmt::format::FmtSpan;

#[tauri::command]
#[instrument(skip(hardware), level = "debug")]
fn check_hardware(hardware: State<'_, Arc<HardwareService>>) -> bool {
    hardware.is_connected()
}

#[tauri::command]
#[instrument(skip(hardware), err)]
fn reset_center(hardware: State<'_, Arc<HardwareService>>) -> Result<(), String> {
    hardware.send_reset_center().map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument(skip(hardware), err)]
fn reboot_device(hardware: State<'_, Arc<HardwareService>>) -> Result<(), String> {
    hardware.reboot_device().map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument(skip(hardware), err)]
fn update_effect_settings(
    hardware: State<'_, Arc<HardwareService>>,
    settings: EffectSettings,
) -> Result<(), String> {
    hardware
        .send_effect_settings(settings)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument(skip(hardware), err)]
fn update_hardware_settings(
    hardware: State<'_, Arc<HardwareService>>,
    settings: HardwareSettings,
) -> Result<(), String> {
    hardware
        .send_hardware_settings(settings)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument(skip(handle), err)]
fn open_advanced_config(handle: tauri::AppHandle) -> Result<(), String> {
    let window = tauri::WebviewWindowBuilder::new(
        &handle,
        "advanced_config",
        tauri::WebviewUrl::App("advanced_config.html".into()),
    )
    .title("SODevs Launcher - Configuração Avançada")
    .inner_size(900.0, 700.0)
    .resizable(true)
    .center()
    .build()
    .map_err(|e| e.to_string())?;

    // Open DevTools in development mode
    #[cfg(debug_assertions)]
    {
        window.open_devtools();
    }

    Ok(())
}

#[tauri::command]
#[instrument(skip(hardware), err)]
fn save_settings_to_hardware(hardware: State<'_, Arc<HardwareService>>) -> Result<(), String> {
    hardware.save_settings().map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument(skip(hardware), err)]
fn get_effect_settings(
    hardware: State<'_, Arc<HardwareService>>,
) -> Result<EffectSettings, String> {
    hardware.read_effect_settings().map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument(skip(hardware), err)]
fn get_hardware_settings(
    hardware: State<'_, Arc<HardwareService>>,
) -> Result<HardwareSettings, String> {
    hardware.read_hardware_settings().map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument(skip(storage), level = "debug")]
fn get_games(storage: State<'_, Arc<SqliteStorage>>) -> Vec<crate::models::Game> {
    storage.list_games().unwrap_or_default()
}

#[tauri::command]
#[instrument(skip(storage), err)]
fn save_game(
    storage: State<'_, Arc<SqliteStorage>>,
    game: crate::models::Game,
) -> Result<(), String> {
    storage.save_game(game).map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument(skip(storage), err)]
fn get_game(
    storage: State<'_, Arc<SqliteStorage>>,
    id: String,
) -> Result<Option<crate::models::Game>, String> {
    storage.get_game(&id).map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument(skip(storage), err)]
fn delete_game(storage: State<'_, Arc<SqliteStorage>>, id: String) -> Result<(), String> {
    storage.delete_game(&id).map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument(skip(storage, hardware), fields(game_id = %id), err)]
async fn launch_game(
    id: String,
    storage: State<'_, Arc<SqliteStorage>>,
    hardware: State<'_, Arc<HardwareService>>,
) -> Result<(), String> {
    let games = storage.list_games().map_err(|e| e.to_string())?;

    // Try to find in storage first
    let game = match games.into_iter().find(|g| g.id == id) {
        Some(g) => g,
        None => {
            // If not in storage, check scanner
            let scanned = crate::services::game_scanner::GameScanner::scan();
            scanned
                .into_iter()
                .find(|g| g.id == id)
                .ok_or("Game not found in library or scanner")?
        }
    };

    // Convert WheelProfileSettings to WheelProfile if present
    let profile = game.wheel_profile.as_ref().map(|settings| {
        WheelProfile {
            id: String::new(),   // Not needed for runtime
            name: String::new(), // Not needed for runtime
            motion_range: settings.motion_range,
            total_force: settings.total_force,
            dynamic_dampening: 50, // Default values
            static_dampening: 50,
            power_limit: 100,
            braking_limit: 100,
        }
    });

    let default_profile = WheelProfile::default();

    let child =
        crate::services::GameRunner::run(&game, profile.as_ref()).map_err(|e| e.to_string())?;

    crate::services::ProfileWatcher::watch(
        child,
        profile,
        hardware.inner().clone(),
        default_profile,
    );

    Ok(())
}

#[tauri::command]
#[instrument]
async fn scan_steam_library() -> Result<Vec<crate::services::steam_library::SteamGame>, String> {
    crate::services::steam_library::scan_steam_games()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument]
async fn search_games(query: String) -> Result<Vec<(u32, String)>, String> {
    crate::services::game_metadata::search_steam_games(&query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument]
async fn fetch_game_metadata(
    app_id: u32,
) -> Result<crate::services::game_metadata::GameMetadata, String> {
    crate::services::game_metadata::fetch_steam_metadata(app_id)
        .await
        .map_err(|e| e.to_string())
}

// ===== Settings Commands =====

#[tauri::command]
#[instrument(skip(storage))]
fn get_default_wheel_settings(
    storage: State<'_, Arc<SqliteStorage>>,
) -> Result<crate::models::DefaultWheelSettings, String> {
    if let Ok(Some(json)) = storage.get_setting("default_wheel_settings") {
        if let Ok(settings) = serde_json::from_str(&json) {
            return Ok(settings);
        }
    }
    Ok(crate::models::DefaultWheelSettings::default())
}

#[tauri::command]
#[instrument(skip(storage), err)]
fn save_default_wheel_settings(
    storage: State<'_, Arc<SqliteStorage>>,
    settings: crate::models::DefaultWheelSettings,
) -> Result<(), String> {
    let json = serde_json::to_string(&settings).map_err(|e| e.to_string())?;
    storage
        .save_setting("default_wheel_settings", &json)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument(skip(storage))]
fn get_gamepad_mapping(
    storage: State<'_, Arc<SqliteStorage>>,
) -> Result<crate::models::GamepadAxisMapping, String> {
    if let Ok(Some(json)) = storage.get_setting("gamepad_mapping") {
        if let Ok(mapping) = serde_json::from_str(&json) {
            return Ok(mapping);
        }
    }
    Ok(crate::models::GamepadAxisMapping::default())
}

#[tauri::command]
#[instrument(skip(storage), err)]
fn save_gamepad_mapping(
    storage: State<'_, Arc<SqliteStorage>>,
    mapping: crate::models::GamepadAxisMapping,
) -> Result<(), String> {
    let json = serde_json::to_string(&mapping).map_err(|e| e.to_string())?;
    storage
        .save_setting("gamepad_mapping", &json)
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[instrument(skip(_hardware), err)]
fn apply_wheel_settings_to_hardware(
    settings: crate::models::DefaultWheelSettings,
    _hardware: State<'_, Arc<HardwareService>>,
) -> Result<(), String> {
    info!("Apply settings request received: {:?}", settings);

    // Read current effect settings
    let mut current_effects = _hardware
        .read_effect_settings()
        .map_err(|e| e.to_string())?;

    // Update effect fields
    current_effects.motion_range = settings.motion_range;
    current_effects.total_effect_strength = settings.total_force;
    current_effects.integrated_spring_strength = settings.integrated_spring_strength;
    current_effects.static_dampening_strength = settings.static_dampening_strength;
    current_effects.dynamic_dampening_strength = settings.dynamic_dampening_strength;
    current_effects.soft_stop_strength = settings.soft_stop_strength;
    current_effects.soft_stop_range = settings.soft_stop_range;
    current_effects.soft_stop_dampening_strength = settings.soft_stop_dampening;

    // DirectX
    current_effects.direct_x_constant_strength = settings.direct_x_constant;
    current_effects.direct_x_periodic_strength = settings.direct_x_periodic;
    current_effects.direct_x_spring_strength = settings.direct_x_spring;

    // Send updated effects
    _hardware
        .send_effect_settings(current_effects)
        .map_err(|e| e.to_string())?;

    // Read and update hardware settings
    let mut current_hw = _hardware
        .read_hardware_settings()
        .map_err(|e| e.to_string())?;
    current_hw.power_limit = settings.power_limit;
    current_hw.braking_limit = settings.braking_limit;
    current_hw.force_direction = if settings.invert_game_force { 1 } else { 0 };

    _hardware
        .send_hardware_settings(current_hw)
        .map_err(|e| e.to_string())?;

    // Persist to flash
    _hardware.save_settings().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[instrument]
fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to SODevs Game Launcher!", name)
}

// ===== Keyboard Service Wrappers =====

#[tauri::command]
fn keyboard_service_start(state: State<'_, Arc<InputManager>>) -> Result<(), String> {
    state.set_active(true);
    Ok(())
}

#[tauri::command]
fn keyboard_service_stop(state: State<'_, Arc<InputManager>>) -> Result<(), String> {
    state.set_active(false);
    Ok(())
}

#[tauri::command]
fn keyboard_service_restart(state: State<'_, Arc<InputManager>>) -> Result<(), String> {
    state.set_active(false);
    std::thread::sleep(std::time::Duration::from_millis(100));
    state.set_active(true);
    Ok(())
}

#[tauri::command]
fn keyboard_service_is_active(state: State<'_, Arc<InputManager>>) -> Result<bool, String> {
    Ok(state.is_active())
}

#[tauri::command]
fn set_keyboard_mapping(
    state: State<'_, Arc<InputManager>>,
    mappings: Vec<KeyMapping>,
) -> Result<(), String> {
    state.update_active_mappings(mappings);
    Ok(())
}

#[tauri::command]
fn get_keyboard_mapping(state: State<'_, Arc<InputManager>>) -> Result<Vec<KeyMapping>, String> {
    Ok(state.get_active_mappings())
}

#[tauri::command]
fn list_profiles(state: State<'_, Arc<InputManager>>) -> Result<Vec<Profile>, String> {
    Ok(state.list_profiles())
}

#[tauri::command]
fn create_profile(state: State<'_, Arc<InputManager>>, name: String) -> Result<String, String> {
    Ok(state.create_profile(name))
}

#[tauri::command]
fn delete_profile(state: State<'_, Arc<InputManager>>, id: String) -> Result<(), String> {
    state.delete_profile(id);
    Ok(())
}

#[tauri::command]
fn set_active_profile(state: State<'_, Arc<InputManager>>, id: String) -> Result<(), String> {
    state.set_active_profile(id)
}

#[tauri::command]
fn get_active_profile_id(state: State<'_, Arc<InputManager>>) -> Result<Option<String>, String> {
    Ok(state.get_active_profile_id())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .with_span_events(FmtSpan::CLOSE)
        .init();

    info!("Starting SODevs Launcher");

    // Fix for Linux WebKit rendering issue (Blank screen)
    #[cfg(target_os = "linux")]
    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

    let hardware = Arc::new(HardwareService::new());
    let hardware_clone = hardware.clone();

    let storage = Arc::new(SqliteStorage::new(PathBuf::from("launcher_games.db")).unwrap());

    // Initialize InputManager (formerly KeyboardService)
    let keyboard_service = Arc::new(InputManager::new());
    let keyboard_service_clone = keyboard_service.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(hardware)
        .manage(storage)
        .manage(keyboard_service)
        .setup(move |app| {
            let handle = app.handle().clone();

            std::thread::spawn(move || {
                loop {
                    if !hardware_clone.is_connected() {
                        let _ = hardware_clone.connect();
                    }

                    if let Ok(status) = hardware_clone.read_status() {
                        let _ = handle.emit("wheel-status", status.clone());
                        // Process keyboard mapping logic separately
                        keyboard_service_clone.process(&status);
                    }

                    std::thread::sleep(std::time::Duration::from_millis(16));
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            check_hardware,
            get_games,
            save_game,
            get_game,
            delete_game,
            reset_center,
            reboot_device,
            update_effect_settings,
            update_hardware_settings,
            get_effect_settings,
            get_hardware_settings,
            save_settings_to_hardware,
            open_advanced_config,
            launch_game,
            scan_steam_library,
            search_games,
            fetch_game_metadata,
            get_default_wheel_settings,
            save_default_wheel_settings,
            get_gamepad_mapping,
            save_gamepad_mapping,
            apply_wheel_settings_to_hardware,
            // Integrated InputManager Commands
            keyboard_service_start,
            keyboard_service_stop,
            keyboard_service_restart,
            keyboard_service_is_active,
            set_keyboard_mapping,
            get_keyboard_mapping,
            list_profiles,
            create_profile,
            delete_profile,
            set_active_profile,
            get_active_profile_id,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
