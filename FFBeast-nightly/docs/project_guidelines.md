# Project Guidelines & Standards

This document outlines the mandatory rules, technical standards, and visual identity for the **SODevs Game Launcher** project.

## 📌 Project Rules (Mandatory)

To maintain code quality and scalability, all developers must follow these strict rules:

- **Strict Modularization**: Each `struct`, `enum`, or `trait` must reside in its own file. Avoid monolithic files.
- **KISS Principle (Keep It Simple, Stupid)**: Classes, methods, and files must be simple and focused. Prioritize componentization over complexity.
- **Offline First Assets**: No external fonts, images, or icons (CDN). All assets must be bundled within the application.
- **Full Abstraction**: Use traits to separate hardware logic from data storage (persistence). This ensures the system can be tested and extended without hardware dependencies.
- **Test-Driven Development (TDD)**: Comprehensive tests for backends and the game runner must be maintained and updated with every change.
- **Code in English**: All code (variables, functions, classes), comments, and technical documentation must be strictly in English for international standardization.
- **Internationalization (i18n)**: The application must provide dynamic support for both **English (EN)** and **Portuguese (PT-BR)**.
- **Structured Logging**: Use structured logging (via `tracing` or similar) for all operations to facilitate debugging and monitoring.

---

## 🎨 Visual Identity & UI Standards

The SODevs Game Launcher aims for a premium, high-performance aesthetic.

### Core Visuals
- **Primary Theme**: Dark Mode by default.
- **Color Palette**: Deep purples, slate grays, and vibrant accent colors (neon violet/cyan).
- **Aesthetics**: Glassmorphism, subtle gradients, and clean borders.

### User Experience (UX)
- **Performance**: High-reactivity UI (60Hz target) for hardware monitoring.
- **Animations**: Fluid transitions and micro-animations for interactive elements (buttons, sliders, steering wheel visual).
- **Responsive Layout**: The interface must adapt seamlessly to different window sizes while maintaining the grid-based library view.

---

## 🛠️ Technical Stack

- **Backend**: Rust (Performance, Safety, Concurrency).
- **Frontend**: Tauri (HTML/JS/Vanilla CSS) for a lightweight, native-feeling experience.
- **Database**: SQLite for local persistence (Game library, profiles).
- **Configuration**: TOML for global application settings.

---

## 📁 Directory Structure

- `apps/configurator`: The main hardware configuration tool.
- `launcher`: The game library and launcher application.
- `libs/controller`: Core hardware abstraction and communication logic.
- `docs`: Technical specifications and project documentation.

---
*Last Updated: 2026-01-18*
