<div align="center">
  <img src="public/logo.png" alt="FFBeast Pit House Logo" width="120" />
  <h1>FFBeast Pit House</h1>
  <p><strong>Powerful configuration tool for racing simulators</strong></p>
</div>

<p align="center">
  <a href="https://github.com/Truaren/ffbeast-pithouse/releases/latest">
    <img src="https://img.shields.io/github/v/release/Truaren/ffbeast-pithouse?style=for-the-badge&color=success" alt="Latest Release" />
  </a>
  <img src="https://img.shields.io/badge/Platform-Windows-blue?style=for-the-badge&logo=windows" alt="Platform" />
  <img src="https://img.shields.io/badge/Tech-React_%7C_Electron-informational?style=for-the-badge" alt="Tech Stack" />
</p>

---

## 🏁 About

**FFBeast Pit House** is the ultimate companion software for your sim-racing hardware. Completely reimagined and rebuilt from the ground up, this sleek configuration hub allows you to seamlessly manage, tweak, and perfect your custom wheelbases and racing accessories.

## ✨ Key Features

- **Modern UI/UX:** A beautifully redesigned, dark-mode interface inspired by premium sim-racing ecosystem software.
- **Smart Auto-Profiles:** The app intelligently detects running games (`.exe` processes) and automatically switches to your pre-configured hardware profiles on the fly.
- **Persistent Local Settings:** All your tweaks, custom profiles, and system preferences are instantly saved locally and persist between restarts.
- **Real-time Telemetry:** Interactive dashboards, torque visualizers, and raw data monitors to tune your hardware to perfection.
- **Zero Bloat:** Lightweight, lightning-fast Electron standalone build.

## 🚀 Installation

1. Go to the [Releases page](https://github.com/Truaren/ffbeast-pithouse/releases/latest).
2. Download the latest `FFBeast Pit House X.X.X.exe` installer.
3. Run the installer and launch the app.
4. Enjoy!

## 🛠️ Development & Build

Want to build FFBeast Pit House from source or contribute?

### Prerequisites

- Node.js (Latest LTS recommended)
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Truaren/ffbeast-pithouse.git

# Navigate into the directory
cd ffbeast-pithouse

# Install dependencies
npm install

# Start local development server (with hot-reload)
npm run dev

# Build the Windows executable (.exe)
npm run build:win
```

## 💖 Support the Project

If you enjoy using FFBeast Pit House and want to support its continuous development, consider using the **Donate** button inside the app. Every contribution helps improve the project!

## 🗺️ Roadmap

Here is a glimpse of what's planned for the future of FFBeast Pit House:

- **Global User Preset Repository:** A centralized, cloud-based hub where users can share, rate, and download community-made game configurations and FFBeast profiles.
- **Third-party Accessory Support:** Native integration for standalone Logitech, Fanatec, Moza, and other popular USB pedals, shifters, and handbrakes.
- **DIY Hardware Integration:** Direct support for Arduino Nano and similar microcontrollers (via USB/DirectInput) to natively visualize and calibrate your custom DIY pedals and shifters right inside Pit House.
- **Advanced Telemetry Overlay:** In-game visual overlays for real-time wheelbase clipping and torque output monitoring.

## 🙏 Acknowledgements

FFBeast Pit House wouldn't be possible without the incredible work and foundation laid by the open-source sim-racing community. A massive thank you to:

- **[shubham0x13](https://github.com/shubham0x13)** for the amazing [ffbeast-wheel-webhid-api](https://github.com/shubham0x13/ffbeast-wheel-webhid-api) that makes WebHID communication possible.
- **[yaxraj-rajput](https://github.com/yaxraj-rajput)** for the original repository foundation and UI inspirations: [yaxraj-rajput repositories](https://github.com/yaxraj-rajput?tab=repositories).
- **[osnipezzini](https://github.com/osnipezzini)** for the FFBeast UI ecosystem: [FFBeast Project](https://github.com/osnipezzini/FFBeast).

---

<div align="center">
  <i>Created for the FFBeast community with ❤️</i>
</div>
