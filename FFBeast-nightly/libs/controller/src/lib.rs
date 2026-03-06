pub mod gamepad_reader;
#[cfg(target_os = "windows")]
pub mod windows_gamepad;
pub mod hardware_service;
pub mod models;
pub mod wheel_interface;

pub use gamepad_reader::{GamepadReader, GamepadState, create_gamepad_reader};
pub use hardware_service::HardwareService;
pub use models::{AdcSettings, EffectSettings, GpioSettings, HardwareSettings, WheelStatus};
pub use wheel_interface::WheelInterface;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
