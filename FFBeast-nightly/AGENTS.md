# AGENTS.md

## Build & Dev Commands
- **Configurator dev**: `cd apps/configurator && npm run tauri dev`
- **Launcher dev**: `cd apps/launcher && npm run tauri dev`
- **Build release**: `npm run tauri build` (from app directory)
- **Type check**: `vue-tsc -b` | **Rust check**: `cargo check`
- **Run single Rust test**: `cargo test <test_name> -- --nocapture`

## Architecture
- **Tauri monorepo**: Rust backend + Vue 3 frontend
- **apps/configurator**: FFBeast wheel configurator (PID tuning, effects mapping)
- **apps/launcher**: Game launcher application
- **libs/controller**: Rust HID/USB driver for FFBeast hardware
- **libs/enigo**: Input automation library (git submodule)

## Code Style
- **Frontend**: Vue 3 Composition API + TypeScript, Pinia for state, vue-i18n for i18n
- **Backend**: Rust 2024 edition, use `anyhow` for errors, `tracing` for logs
- **Naming**: camelCase (TS), snake_case (Rust), PascalCase (Vue components)
- **Imports**: Group by external → internal, use path aliases (@/)
- **i18n**: Support EN and PT-BR, use translation keys not hardcoded strings
- **Strict Modularization**: Each `struct`, `enum`, or `trait` must reside in its own file. Avoid monolithic files.
- **KISS Principle (Keep It Simple, Stupid)**: Classes, methods, and files must be simple and focused. Prioritize componentization over complexity.
- **Offline First Assets**: No external fonts, images, or icons (CDN). All assets must be bundled within the application.
- **Full Abstraction**: Use traits to separate hardware logic from data storage (persistence). This ensures the system can be tested and extended without hardware dependencies.
- **Test-Driven Development (TDD)**: Comprehensive tests for backends and the game runner must be maintained and updated with every change.
- **Code in English**: All code (variables, functions, classes), comments, and technical documentation must be strictly in English for international standardization.
- **Internationalization (i18n)**: The application must provide dynamic support for both **English (EN)** and **Portuguese (PT-BR)**.
- **Structured Logging**: Use structured logging (via `tracing` or similar) for all operations to facilitate debugging and monitoring.
- **Type Safety**: Use strong typing to ensure type safety and prevent runtime errors.
- **Atomic Design**: Use atomic design principles to structure the application. This ensures that the application is easy to maintain and scale.
- **Componentization**: Each component should have a single responsibility and be reusable. This promotes code reuse and reduces complexity.
- **Single Responsibility Principle (SRP)**: Each component should have a single responsibility and be reusable. This promotes code reuse and reduces complexity.
