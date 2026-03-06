use serde::{Deserialize, Serialize};

#[repr(C, packed)]
#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub struct AdcSettings {
    pub raxis_min: [u16; 3],
    pub raxis_max: [u16; 3],
    pub raxis_smoothing: [u8; 3],
    pub raxis_to_button_low: [u8; 3],
    pub raxis_to_button_high: [u8; 3],
    pub raxis_invert: [u8; 3],
    #[serde(skip, default = "default_padding_40")]
    pub _padding: [u8; 40],
}

fn default_padding_40() -> [u8; 40] {
    [0; 40]
}

impl Default for AdcSettings {
    fn default() -> Self {
        Self {
            raxis_min: [0; 3],
            raxis_max: [1023; 3],
            raxis_smoothing: [0; 3],
            raxis_to_button_low: [0; 3],
            raxis_to_button_high: [0; 3],
            raxis_invert: [0; 3],
            _padding: [0; 40],
        }
    }
}
