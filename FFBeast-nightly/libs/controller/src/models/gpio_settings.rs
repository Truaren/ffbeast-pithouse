use serde::{Deserialize, Serialize};

#[repr(C, packed)]
#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub struct GpioSettings {
    pub extension_mode: u8,
    pub pin_mode: [u8; 10],
    pub button_mode: [u8; 32],
    pub spi_mode: u8,
    pub spi_latch_mode: u8,
    pub spi_latch_delay: u8,
    pub spi_clk_pulse_length: u8,
    #[serde(skip, default = "default_padding_17")]
    pub _padding: [u8; 17],
}

fn default_padding_17() -> [u8; 17] {
    [0; 17]
}

impl Default for GpioSettings {
    fn default() -> Self {
        Self {
            extension_mode: 0,
            pin_mode: [0; 10],
            button_mode: [0; 32],
            spi_mode: 0,
            spi_latch_mode: 0,
            spi_latch_delay: 0,
            spi_clk_pulse_length: 0,
            _padding: [0; 17],
        }
    }
}
