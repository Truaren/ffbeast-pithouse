use serde::{Deserialize, Serialize};

#[repr(C, packed)]
#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub struct EffectSettings {
    pub motion_range: u16,
    pub static_dampening_strength: u16,
    pub soft_stop_dampening_strength: u16,
    pub total_effect_strength: u8,
    pub integrated_spring_strength: u8,
    pub soft_stop_range: u8,
    pub soft_stop_strength: u8,
    pub direct_x_constant_direction: i8,
    pub direct_x_spring_strength: u8,
    pub direct_x_constant_strength: u8,
    pub direct_x_periodic_strength: u8,
    pub dynamic_dampening_strength: u16,
    #[serde(skip, default = "default_padding_48")]
    pub _padding: [u8; 48],
}

fn default_padding_48() -> [u8; 48] {
    [0u8; 48]
}

impl Default for EffectSettings {
    fn default() -> Self {
        unsafe { std::mem::zeroed() }
    }
}
