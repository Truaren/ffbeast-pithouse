use serde::{Deserialize, Serialize};

/// Default wheel settings that are applied globally
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DefaultWheelSettings {
    // General Settings
    pub motion_range: u16,              // 180-1440 degrees
    pub total_force: u8,                // 0-100%

    // Spring & Dampening
    pub integrated_spring_strength: u8, // 0-100%
    pub static_dampening_strength: u16, // 0-1000%
    pub dynamic_dampening_strength: u16,// 0-1000%

    // Soft Stop
    pub soft_stop_strength: u8,         // 0-100%
    pub soft_stop_range: u8,            // 0-255°
    pub soft_stop_dampening: u16,       // 0-1000%

    // DirectX Effects
    pub direct_x_constant: u8,          // 0-100%
    pub direct_x_periodic: u8,          // 0-100%
    pub direct_x_spring: u8,            // 0-100%
    
    // Inversion
    pub invert_game_force: bool,        // toggle

    // Legacy fields (backward compatibility)
    pub power_limit: u8,
    pub braking_limit: u8,
}

impl Default for DefaultWheelSettings {
    fn default() -> Self {
        Self {
            // General - FIX: 900 graus padrão (não 180!)
            motion_range: 900,
            total_force: 100,

            // Spring & Dampening
            integrated_spring_strength: 100,
            static_dampening_strength: 0,
            dynamic_dampening_strength: 0,

            // Soft Stop
            soft_stop_strength: 100,
            soft_stop_range: 10,
            soft_stop_dampening: 0,

            // DirectX Effects
            direct_x_constant: 100,
            direct_x_periodic: 100,
            direct_x_spring: 100,

            // Inversion
            invert_game_force: false,

            // Legacy
            power_limit: 100,
            braking_limit: 100,
        }
    }
}

/// Gamepad axis mapping
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GamepadAxisMapping {
    pub axis_x_enabled: bool,
    pub axis_x_inverted: bool,
    pub axis_y_enabled: bool,
    pub axis_y_inverted: bool,
    pub axis_z_enabled: bool,
    pub axis_z_inverted: bool,
    pub axis_rz_enabled: bool,
    pub axis_rz_inverted: bool,
    pub deadzone: f32,
}

impl Default for GamepadAxisMapping {
    fn default() -> Self {
        Self {
            axis_x_enabled: true,
            axis_x_inverted: false,
            axis_y_enabled: true,
            axis_y_inverted: false,
            axis_z_enabled: true,
            axis_z_inverted: false,
            axis_rz_enabled: true,
            axis_rz_inverted: false,
            deadzone: 0.1,
        }
    }
}
