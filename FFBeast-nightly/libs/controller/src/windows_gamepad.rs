use crate::gamepad_reader::{GamepadReader, GamepadState};
use anyhow::{Result, anyhow};
use std::ffi::c_void;
use std::mem::size_of;
use windows::Win32::Devices::HumanInterfaceDevice::{
    DI8DEVCLASS_GAMECTRL, DIDATAFORMAT, DIDEVICEINSTANCEA, DIDFT_ANYINSTANCE, DIDFT_AXIS,
    DIDFT_BUTTON, DIDFT_POV, DIEDFL_ATTACHEDONLY, DIJOYSTATE, DIOBJECTDATAFORMAT, DIPROPHEADER,
    DIPROPRANGE, DISCL_BACKGROUND, DISCL_NONEXCLUSIVE, DirectInput8Create, GUID_POV, GUID_RxAxis,
    GUID_RyAxis, GUID_RzAxis, GUID_Slider, GUID_XAxis, GUID_YAxis, GUID_ZAxis, IDirectInput8A,
    IDirectInputDevice8A,
};
use windows::Win32::Foundation::{BOOL, HWND};
use windows::Win32::System::LibraryLoader::GetModuleHandleA;
use windows::core::{ComInterface, GUID};

// DirectInput Constants
const DIDFT_OPTIONAL: u32 = 0x80000000;
const DIPH_DEVICE: u32 = 0;
const DIPROP_RANGE: usize = 4;

pub struct WindowsNativeGamepadReader {
    #[allow(dead_code)]
    di8: IDirectInput8A,
    device: IDirectInputDevice8A,
    device_name: String,
    last_state: GamepadState,
    #[allow(dead_code)]
    format_objects: Vec<DIOBJECTDATAFORMAT>, // Keep alive
    read_count: u64,
}

unsafe impl Send for WindowsNativeGamepadReader {}

struct EnumContext {
    target_found: bool,
    found_guid: GUID,
    found_name: String,
}

unsafe extern "system" fn enum_callback(lpddi: *mut DIDEVICEINSTANCEA, pvref: *mut c_void) -> BOOL {
    unsafe {
        let ctx = &mut *(pvref as *mut EnumContext);
        let instance = &*lpddi;

        let name = String::from_utf8_lossy(std::slice::from_raw_parts(
            instance.tszInstanceName.as_ptr() as *const u8,
            260,
        ))
        .trim_matches('\0')
        .to_string();

        let product = String::from_utf8_lossy(std::slice::from_raw_parts(
            instance.tszProductName.as_ptr() as *const u8,
            260,
        ))
        .trim_matches('\0')
        .to_string();

        tracing::debug!("[DirectInput] Device discovered: '{}'", product);

        let name_lc = name.to_lowercase();
        let prod_lc = product.to_lowercase();

        let is_target = name_lc.contains("ffbeast")
            || prod_lc.contains("ffbeast")
            || prod_lc.contains("wheel")
            || prod_lc.contains("vjoy")
            || prod_lc.contains("simucube")
            || prod_lc.contains("driver")
            || prod_lc.contains("joystick");

        if is_target {
            ctx.target_found = true;
            ctx.found_guid = instance.guidInstance;
            ctx.found_name = product;
            return BOOL(0); // STOP_ENUM
        }
        BOOL(1) // CONTINUE_ENUM
    }
}

unsafe extern "system" fn fallback_enum_callback(
    lpddi: *mut DIDEVICEINSTANCEA,
    pvref: *mut c_void,
) -> BOOL {
    unsafe {
        let ctx = &mut *(pvref as *mut EnumContext);
        let instance = &*lpddi;
        ctx.target_found = true;
        ctx.found_guid = instance.guidInstance;
        ctx.found_name = String::from_utf8_lossy(std::slice::from_raw_parts(
            instance.tszProductName.as_ptr() as *const u8,
            260,
        ))
        .trim_matches('\0')
        .to_string();
        BOOL(0) // STOP_ENUM
    }
}

fn get_standard_joystick_format() -> (DIDATAFORMAT, Vec<DIOBJECTDATAFORMAT>) {
    let mut objects = Vec::with_capacity(44); // 6 axes + 2 sliders + 4 POV + 32 buttons

    // Map 6 Standard Axes
    objects.push(DIOBJECTDATAFORMAT {
        pguid: &GUID_XAxis,
        dwOfs: 0,
        dwType: DIDFT_AXIS | DIDFT_ANYINSTANCE | DIDFT_OPTIONAL,
        dwFlags: 0,
    });
    objects.push(DIOBJECTDATAFORMAT {
        pguid: &GUID_YAxis,
        dwOfs: 4,
        dwType: DIDFT_AXIS | DIDFT_ANYINSTANCE | DIDFT_OPTIONAL,
        dwFlags: 0,
    });
    objects.push(DIOBJECTDATAFORMAT {
        pguid: &GUID_ZAxis,
        dwOfs: 8,
        dwType: DIDFT_AXIS | DIDFT_ANYINSTANCE | DIDFT_OPTIONAL,
        dwFlags: 0,
    });
    objects.push(DIOBJECTDATAFORMAT {
        pguid: &GUID_RxAxis,
        dwOfs: 12,
        dwType: DIDFT_AXIS | DIDFT_ANYINSTANCE | DIDFT_OPTIONAL,
        dwFlags: 0,
    });
    objects.push(DIOBJECTDATAFORMAT {
        pguid: &GUID_RyAxis,
        dwOfs: 16,
        dwType: DIDFT_AXIS | DIDFT_ANYINSTANCE | DIDFT_OPTIONAL,
        dwFlags: 0,
    });
    objects.push(DIOBJECTDATAFORMAT {
        pguid: &GUID_RzAxis,
        dwOfs: 20,
        dwType: DIDFT_AXIS | DIDFT_ANYINSTANCE | DIDFT_OPTIONAL,
        dwFlags: 0,
    });

    // Map 2 Sliders
    objects.push(DIOBJECTDATAFORMAT {
        pguid: &GUID_Slider,
        dwOfs: 24,
        dwType: DIDFT_AXIS | DIDFT_ANYINSTANCE | DIDFT_OPTIONAL,
        dwFlags: 0,
    });
    objects.push(DIOBJECTDATAFORMAT {
        pguid: &GUID_Slider,
        dwOfs: 28,
        dwType: DIDFT_AXIS | DIDFT_ANYINSTANCE | DIDFT_OPTIONAL,
        dwFlags: 0,
    });

    // Map 4 POV Hats
    for i in 0..4 {
        objects.push(DIOBJECTDATAFORMAT {
            pguid: &GUID_POV,
            dwOfs: 32 + (i * 4),
            dwType: DIDFT_POV | DIDFT_ANYINSTANCE | DIDFT_OPTIONAL,
            dwFlags: 0,
        });
    }

    // Map 32 Buttons
    for i in 0..32 {
        objects.push(DIOBJECTDATAFORMAT {
            pguid: std::ptr::null(),
            dwOfs: 48 + i,
            dwType: DIDFT_BUTTON | DIDFT_ANYINSTANCE | DIDFT_OPTIONAL,
            dwFlags: 0,
        });
    }

    let format = DIDATAFORMAT {
        dwSize: size_of::<DIDATAFORMAT>() as u32,
        dwObjSize: size_of::<DIOBJECTDATAFORMAT>() as u32,
        dwFlags: 1,     // DIDF_ABSAXIS
        dwDataSize: 80, // Size of DIJOYSTATE
        dwNumObjs: objects.len() as u32,
        rgodf: objects.as_mut_ptr(),
    };

    (format, objects)
}

impl WindowsNativeGamepadReader {
    pub fn new() -> Result<Self> {
        tracing::info!("[DirectInput] Initializing Windows Native Gamepad Reader...");

        unsafe {
            let hinst = GetModuleHandleA(None).map_err(|e| {
                tracing::error!("[DirectInput] Failed to get module handle: {:?}", e);
                anyhow!("GetModuleHandle failed: {:?}", e)
            })?;

            let mut di8: Option<IDirectInput8A> = None;
            DirectInput8Create(
                hinst,
                0x0800,
                &IDirectInput8A::IID,
                &mut di8 as *mut _ as *mut _,
                None,
            )
            .map_err(|e| {
                tracing::error!(
                    "[DirectInput] Failed to create DirectInput8 object: {:?}",
                    e
                );
                anyhow!("DirectInput8Create failed: {:?}", e)
            })?;

            let di8 = di8.ok_or_else(|| anyhow!("DirectInput8 interface is null"))?;

            let mut ctx = EnumContext {
                target_found: false,
                found_guid: GUID::zeroed(),
                found_name: String::new(),
            };

            // Priority enumeration
            di8.EnumDevices(
                DI8DEVCLASS_GAMECTRL,
                Some(enum_callback),
                &mut ctx as *mut _ as *mut c_void,
                DIEDFL_ATTACHEDONLY,
            )
            .ok();

            // Broad fallback if nothing matching our filters was found
            if !ctx.target_found {
                tracing::warn!(
                    "[DirectInput] No prioritized controller found, trying broad fallback..."
                );
                let _ = di8.EnumDevices(
                    DI8DEVCLASS_GAMECTRL,
                    Some(fallback_enum_callback),
                    &mut ctx as *mut _ as *mut c_void,
                    DIEDFL_ATTACHEDONLY,
                );
            }

            if !ctx.target_found {
                tracing::error!("[DirectInput] No game controllers detected on this system.");
                return Err(anyhow!("No DirectInput game device found"));
            }

            tracing::info!("[DirectInput] Selected Controller: {}", ctx.found_name);

            let mut device: Option<IDirectInputDevice8A> = None;
            di8.CreateDevice(&ctx.found_guid, &mut device as *mut _ as *mut _, None)
                .map_err(|e| {
                    tracing::error!("[DirectInput] Failed to create device instance: {:?}", e);
                    anyhow!("CreateDevice failed: {:?}", e)
                })?;

            let device = device.ok_or_else(|| anyhow!("Device interface is null"))?;

            let (mut format, format_objects) = get_standard_joystick_format();

            device
                .SetDataFormat(&mut format as *mut DIDATAFORMAT)
                .map_err(|e| {
                    tracing::error!("[DirectInput] Failed to set data format: {:?}", e);
                    anyhow!("SetDataFormat failed: {:?}", e)
                })?;

            // Set Axis Range to 0-65535 for predictable normalization
            let mut range = DIPROPRANGE {
                diph: DIPROPHEADER {
                    dwSize: size_of::<DIPROPRANGE>() as u32,
                    dwHeaderSize: size_of::<DIPROPHEADER>() as u32,
                    dwObj: 0,
                    dwHow: DIPH_DEVICE,
                },
                lMin: 0,
                lMax: 65535,
            };

            if let Err(e) = device.SetProperty(DIPROP_RANGE as *const GUID, &mut range.diph) {
                tracing::warn!("[DirectInput] Failed to set axis range property: {:?}", e);
            }

            // Set to background / non-exclusive to avoid interference with other apps
            if let Err(e) =
                device.SetCooperativeLevel(HWND(0), DISCL_BACKGROUND | DISCL_NONEXCLUSIVE)
            {
                tracing::warn!("[DirectInput] Failed to set cooperative level: {:?}", e);
            }

            if let Err(e) = device.Acquire() {
                tracing::warn!("[DirectInput] Initial Acquire failed (will retry): {:?}", e);
            }

            Ok(Self {
                di8,
                device,
                device_name: ctx.found_name,
                last_state: GamepadState::default(),
                format_objects,
                read_count: 0,
            })
        }
    }
}

impl GamepadReader for WindowsNativeGamepadReader {
    fn read_state(&mut self) -> Result<GamepadState> {
        self.read_count += 1;
        unsafe {
            let _ = self.device.Poll();

            let mut state: DIJOYSTATE = std::mem::zeroed();
            let res = self.device.GetDeviceState(
                size_of::<DIJOYSTATE>() as u32,
                &mut state as *mut _ as *mut c_void,
            );

            if res.is_err() {
                // If device is lost, attempt to re-acquire
                let _ = self.device.Acquire();
                return Ok(self.last_state.clone());
            }

            // High-frequency debug logging (approx once per second at 60Hz)
            if self.read_count % 60 == 0 {
                tracing::trace!(
                    "[DirectInput Raw] X:{} Y:{} Z:{} Rx:{} Ry:{} Rz:{} Buttons:{:08x}",
                    state.lX,
                    state.lY,
                    state.lZ,
                    state.lRx,
                    state.lRy,
                    state.lRz,
                    state
                        .rgbButtons
                        .iter()
                        .take(4)
                        .fold(0u32, |acc, &b| (acc << 8) | b as u32)
                );
            }

            let mut gp = GamepadState::default();

            // Map Buttons (0x80 bit indicates pressed)
            for i in 0..32 {
                if state.rgbButtons[i] & 0x80 != 0 {
                    gp.buttons |= 1 << i;
                }
            }

            // Local normalization helper (0..65535 -> 0..4095)
            fn normalize_axis(val: i32) -> u16 {
                let v = val.max(0).min(65535) as f32;
                ((v / 65535.0) * 4095.0) as u16
            }

            gp.axes[0] = normalize_axis(state.lX);
            gp.axes[1] = normalize_axis(state.lY);
            gp.axes[2] = normalize_axis(state.lZ);
            gp.axes[3] = normalize_axis(state.lRx);
            gp.axes[4] = normalize_axis(state.lRy);
            gp.axes[5] = normalize_axis(state.lRz);

            self.last_state = gp.clone();
            Ok(gp)
        }
    }

    fn is_connected(&self) -> bool {
        true
    }
    fn name(&self) -> &str {
        &self.device_name
    }
}

impl Drop for WindowsNativeGamepadReader {
    fn drop(&mut self) {
        unsafe {
            tracing::info!("[DirectInput] Releasing device resources...");
            let _ = self.device.Unacquire();
        }
    }
}
