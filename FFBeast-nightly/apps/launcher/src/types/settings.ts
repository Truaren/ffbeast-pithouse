export interface DefaultWheelSettings {
    // General Settings
    motion_range: number;              // 180-1440 degrees
    total_force: number;                // 0-100%

    // Spring & Dampening
    integrated_spring_strength: number; // 0-100%
    static_dampening_strength: number;  // 0-1000%
    dynamic_dampening_strength: number; // 0-1000%

    // Soft Stop
    soft_stop_strength: number;         // 0-100%
    soft_stop_range: number;            // 0-255°
    soft_stop_dampening: number;        // 0-1000%

    // DirectX Effects
    direct_x_constant: number;          // 0-100%
    direct_x_periodic: number;          // 0-100%
    direct_x_spring: number;            // 0-100%

    // Inversion
    invert_game_force: boolean;         // toggle

    // Legacy fields (backward compatibility)
    power_limit: number;
    braking_limit: number;
}

export interface GamepadAxisMapping {
    axis_x_enabled: boolean;
    axis_x_inverted: boolean;
    axis_y_enabled: boolean;
    axis_y_inverted: boolean;
    axis_z_enabled: boolean;
    axis_z_inverted: boolean;
    axis_rz_enabled: boolean;
    axis_rz_inverted: boolean;
    deadzone: number;
}

export interface KeyMapping {
    index: number;
    name: string;
    key_low: string;
    key_high: string;
    btn_low: string;
    btn_high: string;
    min: number;
    max: number;
    inverted: boolean;
}

export interface Profile {
    id: string;
    name: string;
    mappings: KeyMapping[];
}
