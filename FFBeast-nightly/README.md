# SODevs Game Launcher & FFBeast Configurator

## Overview

This project is a centralized workspace for the **SODevs Game Launcher** and the **FFBeast Steering Wheel Configurator**. It combines a Rust-based backend with a modern, dynamic frontend (Tauri/Web) to manage game libraries and configure advanced Force Feedback hardware.

## Project Structure

The workspace is organized as follows:

- **`apps/`**: Contains the user-facing applications.
  - **`configurator/`**: A Tauri-based application for configuring the FFBeast Direct Drive Wheel. Includes PID tuning, effects mapping, and hardware monitoring.
- **`launcher/`**: The main game launcher application (Tauri/Rust).
- **`libs/`**: Shared Rust libraries.
  - **`controller/`**: A driver library for communicating with the FFBeast hardware via HID/USB.
- **`docs/`**: Project documentation, migration plans, and known issues.

## Prerequisites

- **Rust**: Latest stable version.
- **Node.js**: LTS version (v18+).
- **Tauri CLI**: `cargo install tauri-cli`

## Setup & Build

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Configurator in Dev Mode**:
    ```bash
    cd apps/configurator
    npm run tauri dev
    ```

3.  **Build Release**:
    ```bash
    npm run tauri build
    ```

## Features

- **Cross-Platform**: Built on Rust and web technologies for Windows (primary) and Linux support.
- **Modular Architecture**: separate services for Hardware, Effects, and UI rendering.
- **Internationalization**: Full support for EN and PT-BR.
- **Real-time Monitoring**: High-frequency telemetry for wheel position, torque, and IO states.
