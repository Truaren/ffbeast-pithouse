use serde::{Deserialize, Serialize};

#[repr(C, packed)]
#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub struct FirmwareVersion {
    pub release_type: u8,
    pub major: u8,
    pub minor: u8,
    pub patch: u8,
}
