use crate::models::{AdcSettings, EffectSettings, GpioSettings, HardwareSettings, WheelStatus};
use anyhow::Result;

pub trait WheelInterface: Send + Sync {
    fn connect(&self) -> Result<()>;
    fn is_connected(&self) -> bool;

    fn read_status(&self) -> Result<WheelStatus>;
    fn read_effect_settings(&self) -> Result<EffectSettings>;
    fn read_hardware_settings(&self) -> Result<HardwareSettings>;
    fn read_gpio_settings(&self) -> Result<GpioSettings>;
    fn read_adc_settings(&self) -> Result<AdcSettings>;

    fn send_effect_settings(&self, settings: EffectSettings) -> Result<()>;
    fn send_hardware_settings(&self, settings: HardwareSettings) -> Result<()>;
    fn send_gpio_settings(&self, settings: GpioSettings) -> Result<()>;
    fn send_adc_settings(&self, settings: AdcSettings) -> Result<()>;

    fn send_reset_center(&self) -> Result<()>;
    fn save_settings(&self) -> Result<()>;
    fn reboot_device(&self) -> Result<()>;
    fn switch_to_dfu(&self) -> Result<()>;
    fn send_direct_control(&self, force_type: u8, value: i16) -> Result<()>;
}
