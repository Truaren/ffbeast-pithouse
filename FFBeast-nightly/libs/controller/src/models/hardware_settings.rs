use serde::{Deserialize, Serialize};

#[repr(C, packed)]
#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub struct HardwareSettings {
    pub encoder_cpr: u16,
    pub integral_gain: u16,
    pub proportional_gain: u8,
    pub force_enabled: u8,
    pub debug_torque: u8,
    pub amplifier_gain: u8,
    pub calibration_magnitude: u8,
    pub calibration_speed: u8,
    pub power_limit: u8,
    pub braking_limit: u8,
    pub position_smoothing: u8,
    pub speed_buffer_size: u8,
    pub encoder_direction: i8,
    pub force_direction: i8,
    pub pole_pairs: u8,
    #[serde(skip, default = "default_padding_47")]
    pub _padding: [u8; 47],
}

fn default_padding_47() -> [u8; 47] {
    [0u8; 47]
}

impl Default for HardwareSettings {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}
