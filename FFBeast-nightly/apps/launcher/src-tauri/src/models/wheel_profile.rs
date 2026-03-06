use ffbeast_controller::{EffectSettings, HardwareSettings};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WheelProfile {
    pub id: String,
    pub name: String,

    // Configurações de Efeito
    pub motion_range: u16,
    pub total_force: u8,
    pub dynamic_dampening: u16,
    pub static_dampening: u16,

    // Configurações de Hardware
    pub power_limit: u8,
    pub braking_limit: u8,
}

impl WheelProfile {
    pub fn to_effect_settings(&self) -> EffectSettings {
        let mut settings = EffectSettings::default();
        settings.motion_range = self.motion_range;
        settings.total_effect_strength = self.total_force;
        settings.dynamic_dampening_strength = self.dynamic_dampening;
        settings.static_dampening_strength = self.static_dampening;
        settings
    }

    pub fn to_hardware_settings(&self) -> HardwareSettings {
        let mut settings = HardwareSettings::default();
        settings.power_limit = self.power_limit;
        settings.braking_limit = self.braking_limit;
        settings
    }
}

impl Default for WheelProfile {
    fn default() -> Self {
        Self {
            id: "default".to_string(),
            name: "Default Profile".to_string(),
            motion_range: 900,
            total_force: 100,
            dynamic_dampening: 0,
            static_dampening: 0,
            power_limit: 100,
            braking_limit: 100,
        }
    }
}
