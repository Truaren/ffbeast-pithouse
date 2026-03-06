/// Cross-platform gamepad input reader
/// Simplified implementation that doesn't require Sync
use anyhow::{Result, anyhow};

#[derive(Debug, Clone, Default)]
pub struct GamepadState {
    /// Button states as a 32-bit bitmask (1 = pressed, 0 = released)
    pub buttons: u32,
    /// Analog axes values (0-4095 for 12-bit ADC compatibility)
    pub axes: [u16; 6],
}

/// Cross-platform gamepad input reader
/// Note: Removed Sync requirement because gilrs is not Sync on Windows
pub trait GamepadReader: Send {
    /// Read current gamepad state
    fn read_state(&mut self) -> Result<GamepadState>;

    /// Check if gamepad is connected
    fn is_connected(&self) -> bool;

    /// Get gamepad name/description
    fn name(&self) -> &str;
}

/// Gilrs-based gamepad reader (cross-platform)
pub struct GilrsGamepadReader {
    gilrs: gilrs::Gilrs,
    gamepad_id: Option<gilrs::GamepadId>,
    device_name: String,
    last_state: GamepadState,
}

impl GilrsGamepadReader {
    pub fn new() -> Result<Self> {
        tracing::info!("[GamepadReader] Initializing gilrs...");

        let gilrs =
            gilrs::Gilrs::new().map_err(|e| anyhow!("Failed to initialize gilrs: {}", e))?;

        // Find FFBeast controller or any connected gamepad
        let mut gamepad_id = None;
        let mut device_name = "No gamepad found".to_string();

        for (_id, gamepad) in gilrs.gamepads() {
            let name = gamepad.name();
            tracing::info!("[GamepadReader] Found gamepad: {} (ID: {:?})", name, _id);

            // Prefer FFBeast, but accept any gamepad
            tracing::info!(
                "[GamepadReader] Found device: {} (uuid: {:?})",
                name,
                gamepad.uuid()
            );

            // Prioritize FFBeast, but accept any stick/wheel if FFBeast is not explicitly named
            let is_likely_target = name.to_lowercase().contains("ffbeast")
                || name.to_lowercase().contains("wheel")
                || name.to_lowercase().contains("simucube")
                || name.to_lowercase().contains("vjoy");

            if is_likely_target || gamepad_id.is_none() {
                gamepad_id = Some(_id);
                device_name = name.to_string();

                if name.to_lowercase().contains("ffbeast") {
                    tracing::info!("[GamepadReader] Exact match found!");
                    break;
                }
            }
        }

        if let Some(id) = gamepad_id {
            tracing::info!(
                "[GamepadReader] Selected gamepad: {} (ID: {:?})",
                device_name,
                id
            );
        } else {
            tracing::warn!("[GamepadReader] No suitable gamepad found! Buttons will not work.");
        }

        Ok(Self {
            gilrs,
            gamepad_id,
            device_name,
            last_state: GamepadState::default(),
        })
    }

    /// Convert gilrs axis value (-1.0 to 1.0) to ADC value (0-4095)
    fn axis_to_adc(value: f32) -> u16 {
        let clamped = value.clamp(-1.0, 1.0);
        let normalized = (clamped + 1.0) / 2.0;
        (normalized * 4095.0) as u16
    }
}

impl GamepadReader for GilrsGamepadReader {
    fn read_state(&mut self) -> Result<GamepadState> {
        // Process events to update gamepad state
        while let Some(_event) = self.gilrs.next_event() {
            // Events are processed automatically by gilrs
        }

        let Some(gamepad_id) = self.gamepad_id else {
            return Ok(self.last_state.clone());
        };

        let gamepad = self.gilrs.gamepad(gamepad_id);
        let mut state = GamepadState::default();

        // Iterate over all buttons and map their raw codes to bits 0..31
        // This ensures compatibility with devices having >16 buttons or non-standard mappings,
        // mirroring the fix applied to the Linux Evdev reader.
        for (code, btn_data) in gamepad.state().buttons() {
            if btn_data.is_pressed() {
                // Determine the raw code value
                // Note: gilrs::Code implementation details may vary, but typically it wraps an integer.
                // We attempt to use into_u32() which is common for such wrappers.
                let raw_val: u32 = code.into_u32();

                if raw_val < 32 {
                    state.buttons |= 1 << raw_val;
                }
            }
        }

        // Read axes using axis_data()
        use gilrs::Axis;
        if let Some(axis) = gamepad.axis_data(Axis::LeftStickX) {
            state.axes[0] = Self::axis_to_adc(axis.value());
        }
        if let Some(axis) = gamepad.axis_data(Axis::LeftStickY) {
            state.axes[1] = Self::axis_to_adc(axis.value());
        }
        if let Some(axis) = gamepad.axis_data(Axis::RightStickX) {
            state.axes[2] = Self::axis_to_adc(axis.value());
        }
        if let Some(axis) = gamepad.axis_data(Axis::RightStickY) {
            state.axes[3] = Self::axis_to_adc(axis.value());
        }
        if let Some(axis) = gamepad.axis_data(Axis::LeftZ) {
            state.axes[4] = Self::axis_to_adc(axis.value());
        }
        if let Some(axis) = gamepad.axis_data(Axis::RightZ) {
            state.axes[5] = Self::axis_to_adc(axis.value());
        }

        // DEBUG: Trace inputs to identify mapping issues on Linux
        static mut LOG_SKIP: usize = 0;
        unsafe {
            if LOG_SKIP % 60 == 0 {
                // Log ~1Hz
                // Check all axes
                let active_axes: Vec<_> = (0..6)
                    .filter(|&i| state.axes[i] > 10 && state.axes[i] < 4085)
                    .collect();

                // Check all buttons
                let mut active_btns = Vec::new();
                for (code, btn_data) in gamepad.state().buttons() {
                    if btn_data.is_pressed() {
                        active_btns.push(format!("{:?}", code));
                    }
                }

                if !active_axes.is_empty() || !active_btns.is_empty() {
                    tracing::info!(
                        "[GamepadReader] Active Inputs - Axes: {:?} (indices), Buttons: {:?}",
                        active_axes,
                        active_btns
                    );
                }
            }
            LOG_SKIP += 1;
        }

        self.last_state = state.clone();
        Ok(state)
    }

    fn is_connected(&self) -> bool {
        self.gamepad_id.is_some()
    }

    fn name(&self) -> &str {
        &self.device_name
    }
}

#[cfg(target_os = "linux")]
pub struct EvdevGamepadReader {
    device: evdev::Device,
    state: GamepadState,
    name: String,
}

#[cfg(target_os = "linux")]
use std::os::unix::io::AsRawFd;

#[cfg(target_os = "linux")]
impl EvdevGamepadReader {
    pub fn new() -> Result<Self> {
        tracing::info!("[EvdevReader] Enumerating devices...");

        // Find device containing "ffbeast" or related keywords
        let (_, device) = evdev::enumerate()
            .find(|(_, dev)| {
                let name = dev.name().unwrap_or("").to_lowercase();
                // tracing::debug!("Checking device: {}", name);
                name.contains("ffbeast") || name.contains("wheel")
            })
            .ok_or_else(|| anyhow!("FFBeast device not found via evdev"))?;

        let name = device.name().unwrap_or("Unknown").to_string();
        tracing::info!("[EvdevReader] Selected device: {}", name);

        // Log supported keys for debugging mapping
        if let Some(keys) = device.supported_keys() {
            tracing::info!("[EvdevReader] Supported Keys: {:?}", keys);
        }

        if let Some(axes) = device.supported_absolute_axes() {
            tracing::info!("[EvdevReader] Supported Absolute Axes: {:?}", axes);
        }

        // IMPORTANT: Set non-blocking mode to avoid freezing the polling thread
        // which holds the HardwareService lock, causing UI freeze (deadlock on RPC)
        let fd = device.as_raw_fd();
        unsafe {
            let flags = libc::fcntl(fd, libc::F_GETFL);
            if flags < 0 {
                tracing::warn!("[EvdevReader] Failed to get device flags");
            } else {
                let res = libc::fcntl(fd, libc::F_SETFL, flags | libc::O_NONBLOCK);
                if res < 0 {
                    tracing::warn!("[EvdevReader] Failed to set non-blocking mode");
                } else {
                    tracing::info!("[EvdevReader] Non-blocking mode enabled");
                }
            }
        }

        Ok(Self {
            device,
            state: GamepadState::default(),
            name,
        })
    }
}

#[cfg(target_os = "linux")]
impl GamepadReader for EvdevGamepadReader {
    fn read_state(&mut self) -> Result<GamepadState> {
        // Process pending events
        match self.device.fetch_events() {
            Ok(events) => {
                for event in events {
                    match event.kind() {
                        evdev::InputEventKind::Key(key) => {
                            let code = key.code();
                            let val = event.value(); // 0=release, 1=press, 2=repeat

                            if val == 2 {
                                continue;
                            } // Ignore repeats

                            // Force mapping based on observation (FFBeast usages)
                            // Range 1: BTN_0 (0x100 / 256) -> Buttons 0..31
                            // Range 2: BTN_JOYSTICK/TRIGGER (0x120 / 288) -> Buttons 0..31

                            let final_bit = if code >= 256 && code < 256 + 32 {
                                Some((code - 256) as u32)
                            } else if code >= 288 && code < 288 + 32 {
                                Some((code - 288) as u32)
                            } else {
                                None
                            };

                            if let Some(b) = final_bit {
                                if val > 0 {
                                    self.state.buttons |= 1 << b;
                                } else {
                                    self.state.buttons &= !(1 << b);
                                }
                            }
                        }
                        evdev::InputEventKind::AbsAxis(axis) => {
                            let code = axis.0;
                            let value = event.value();

                            // Map Linux ABS Codes to HardwareService Axes indices (0..5)
                            // Direct mapping: hardware reports ABS_X for A3, ABS_RX for A0, etc.
                            let index = match code {
                                0x00 => Some(0), // ABS_X
                                0x01 => Some(1), // ABS_Y
                                0x02 => Some(2), // ABS_Z
                                0x03 => Some(3), // ABS_RX
                                0x04 => Some(4), // ABS_RY
                                0x05 => Some(5), // ABS_RZ
                                _ => None,
                            };

                            if let Some(idx) = index {
                                // Simple normalization for now, assuming 16-bit input
                                // TODO: Implement proper calibration reading once Evdev API is clarified
                                let raw = value as f32;
                                let normalized = if raw.abs() > 4096.0 {
                                    // Likely 16-bit range (-32768..32767 or 0..65535)
                                    // Map to 0..4095
                                    ((raw + 32768.0) / 65535.0 * 4095.0).clamp(0.0, 4095.0) as u16
                                } else {
                                    // Likely already low resolution or 0..4095
                                    raw.clamp(0.0, 4095.0) as u16
                                };

                                self.state.axes[idx] = normalized;
                            }
                        }
                        _ => {}
                    }
                }
            }
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                // No events, OK
            }
            Err(e) => {
                tracing::warn!("[EvdevReader] Error reading events: {}", e);
                // Don't return error to keep polling alive, but maybe should reconnect?
            }
        }

        Ok(self.state.clone())
    }

    fn is_connected(&self) -> bool {
        true
    }
    fn name(&self) -> &str {
        &self.name
    }
}

/// Factory function to create platform-specific gamepad reader
pub fn create_gamepad_reader() -> Result<Box<dyn GamepadReader>> {
    #[cfg(target_os = "linux")]
    {
        // Try direct Evdev first
        match EvdevGamepadReader::new() {
            Ok(reader) => {
                tracing::info!("[create_gamepad_reader] Successfully initialized EvdevReader");
                return Ok(Box::new(reader));
            }
            Err(e) => {
                tracing::warn!(
                    "[create_gamepad_reader] EvdevReader failed: {}. Falling back to Gilrs.",
                    e
                );
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        use crate::windows_gamepad::WindowsNativeGamepadReader;
        // Use our custom Windows Native Input reader
        match WindowsNativeGamepadReader::new() {
            Ok(reader) => {
                tracing::info!(
                    "[create_gamepad_reader] Successfully initialized WindowsNativeGamepadReader"
                );
                return Ok(Box::new(reader));
            }
            Err(e) => {
                tracing::warn!(
                    "[create_gamepad_reader] WindowsNativeGamepadReader failed: {}. Falling back to Gilrs.",
                    e
                );
            }
        }
    }

    GilrsGamepadReader::new().map(|r| Box::new(r) as Box<dyn GamepadReader>)
}
