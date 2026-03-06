use crate::models::WheelProfile;
use ffbeast_controller::{HardwareService, WheelInterface};
use std::process::Child;
use std::sync::Arc;
use std::thread;
use tracing::{info, instrument};

pub struct ProfileWatcher;

impl ProfileWatcher {
    #[instrument(skip(child, profile, hardware, default_profile), fields(profile_name = ?profile.as_ref().map(|p| &p.name)))]
    pub fn watch(
        mut child: Child,
        profile: Option<WheelProfile>,
        hardware: Arc<HardwareService>,
        default_profile: WheelProfile,
    ) {
        // Aplica o perfil do jogo
        if let Some(p) = profile {
            info!("Watcher: Applying game profile: {}", p.name);
            let _ = hardware.send_effect_settings(p.to_effect_settings());
            let _ = hardware.send_hardware_settings(p.to_hardware_settings());
        }

        thread::spawn(move || {
            info!("Watcher: Monitoring game process...");
            let _ = child.wait(); // Wait for game to exit

            info!("Watcher: Game closed. Restoring default profile...");
            let _ = hardware.send_effect_settings(default_profile.to_effect_settings());
            let _ = hardware.send_hardware_settings(default_profile.to_hardware_settings());
        });
    }
}
