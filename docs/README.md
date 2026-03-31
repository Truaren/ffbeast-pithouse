<p align="center">
  <img src="../public/logo.png" width="80" alt="FFBeast Pit House" />
</p>

<h1 align="center">FFBeast Pit House</h1>

<p align="center">
  <strong>Desktop configurator for FFBeast direct-drive wheel bases &amp; pedals</strong><br/>
  Built with Electron · React · WebHID · Zustand
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-4.1.0-red?style=flat-square" alt="version" />
  <img src="https://img.shields.io/badge/platform-Windows-blue?style=flat-square" alt="platform" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="license" />
</p>

---

## Screenshots

<details open>
<summary><strong>Dashboard</strong></summary>

![Dashboard](screenshots/dashboard.png)

Live steering angle, wheel rotation preview, torque output, FFB intensity control, pedal bindings — all on one screen.

</details>

<details>
<summary><strong>Base Settings</strong></summary>

![Base Settings](screenshots/base_settings.png)

Motor tuning: Encoder CPR, Pole Pairs, PID gains, Power Limit, Calibration, Braking Resistor. PRO-only smoothing and buffer controls.

</details>

<details>
<summary><strong>Pedals</strong></summary>

![Pedals](screenshots/pedals.png)

Custom response curves (Linear, S-Curve, Exp, Log), deadzones, calibration, reverse — per pedal. Multi-pedal plugin support.

</details>

<details>
<summary><strong>Force Effects</strong></summary>

![Force Effects](screenshots/effects.png)

Motion Range, Total Strength, Spring, Dampening, Soft Stop — plus DirectX force scaling (Constant, Periodic, Spring).

</details>

<details>
<summary><strong>Game Compatibility</strong></summary>

![Compatibility](screenshots/compatibility.png)

Community-driven database. See which games work, which need tweaks, and leave your own reviews.

</details>

<details>
<summary><strong>Live Monitoring</strong></summary>

![Monitoring](screenshots/monitoring.png)

Real-time analog inputs, digital button states, and torque output graph with Nm estimation.

</details>

<details>
<summary><strong>Auto Profiles</strong></summary>

![Auto Profiles](screenshots/autoprofiles.png)

Bind `.exe` files to profiles — the app auto-switches when a game launches.

</details>

<details>
<summary><strong>Settings &amp; Themes</strong></summary>

![Settings](screenshots/settings.png)

15+ themes, keybinds, sidebar customization, performance tweaks, minimize-to-tray, auto-updates.

</details>

---

## Features

| Category          | What's Included                                                               |
| ----------------- | ----------------------------------------------------------------------------- |
| **Dashboard**     | Steering gauge, wheel preview with rotation, torque meter, pedal binding      |
| **Base Settings** | PID tuning, Encoder CPR, Motor Pole Pairs, Power Limit, Calibration           |
| **Pedals**        | Curve editor (5 presets), deadzones, calibration wizard, multi-device plugins |
| **Force Effects** | Motion Range, Dampening, Spring, Soft Stop, DirectX force overrides           |
| **Compatibility** | Community game database with reviews, search, and user submissions            |
| **Monitoring**    | Live axes, buttons grid, torque waveform canvas                               |
| **Protocol Info** | Raw device data viewer                                                        |
| **Pin Mapping**   | GPIO pin configuration for DIY builds                                         |
| **Button Mapper** | 32 buttons × 4 modes (None, Normal, Inverted, Pulse)                          |
| **Axis Setup**    | 3 analog axes with deadzones, smoothing, invert, button triggers              |
| **Auto Profiles** | Game-exe → profile auto-switching                                             |
| **Profiles**      | Save/load/switch entire device configurations                                 |
| **Themes**        | 15+ built-in dark/light themes                                                |
| **PRO Features**  | Advanced smoothing, soft stops, DirectX scaling (license activation)          |

---

## Quick Start

```bash
# Install dependencies
npm install

# Run in browser (dev)
npm run dev

# Run as Electron app
npm run electron:dev

# Build for Windows
npm run build:win
```

> Requires **Node.js 18+** and a Chromium-based browser (for WebHID support).

---

## Tech Stack

- **React 19** + **TypeScript** — UI
- **Zustand** — state management with persistence
- **Electron 33** — desktop shell, tray, auto-start
- **WebHID API** — direct hardware communication
- **Vite 7** — build tooling
- **SCSS** — styling with 15+ theme system
- **Cloudflare Workers** — game compatibility backend

---

## License

MIT — see [LICENSE](../LICENSE) for details.

<p align="center">
  Made with ❤️ by <a href="https://github.com/truaren">@truaren</a>
</p>
