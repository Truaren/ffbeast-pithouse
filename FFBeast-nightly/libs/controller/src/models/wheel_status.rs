use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, Copy, Default)]
pub struct FirmwareVersion {
    pub release_type: u8,
    pub major: u8,
    pub minor: u8,
    pub patch: u8,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy, Default)]
pub struct WheelStatus {
    pub position: i16,
    pub torque: i16,
    pub buttons: u32,
    pub adc: [u16; 6],
    pub is_connected: bool,
    pub firmware: FirmwareVersion,
    pub is_registered: bool,
    pub device_id: Option<[u32; 3]>,
    pub serial_key: Option<[u32; 3]>,
}
