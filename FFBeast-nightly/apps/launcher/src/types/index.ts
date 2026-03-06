export interface WheelProfile {
    id: string;
    name: string;
    motion_range: number;
    total_force: number;
    dynamic_dampening: number;
    static_dampening: number;
    power_limit: number;
    braking_limit: number;
}

export interface WheelProfileSettings {
    motion_range: number;
    total_force: number;
    spring_strenth: number; // Mola
    invert_force: boolean; // Inverter axis
}

export interface Game {
    id: string;
    name: string;
    path: string;
    is_steam: boolean; // New field
    steam_id?: number; // New field
    arguments: string[];
    environment_vars: Record<string, string>; // Enabled
    dll_overrides: string[]; // Enabled
    wheel_profile?: WheelProfileSettings;
    use_compat_layer: boolean;
    icon_path?: string;
    cover_path?: string;
}

export interface HardwareStatus {
    position: number;
    torque: number;
}
