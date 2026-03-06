---
description: Comprehensive refactoring plan for Input Services and Modular UI Architecture
---
# Refactoring Plan: Input System & UI Architecture

This document describes the technical roadmap to refactor the Input Management system (Backend) and the User Interface (Frontend), prioritizing **Strict Modularization**, **Reusability**, and **Project Guidelines Compliance**.

---

## 1. Backend: Shared Architecture (`libs/input_manager`)

**Objective:** Centralize input handling logic to eliminate code duplication between `apps/configurator` and `apps/launcher`, ensuring consistent behavior.

*   **Library Name**: `libs/input_manager` (Crate: `sodevs-input-manager`)
*   **Architecture**:
    *   **Core Responsibilities**:
        *   **Device Abstraction**: Standardize input reading from `ffbeast-controller`.
        *   **Event Processing**: Unified `process_axis_event(axis_index, value)` logic.
        *   **Input Simulation**: Encapsulate `enigo` integration (Keyboard/Mouse simulation).
        *   **Persistence**: Manage loading/saving of `keyboard_profiles.json`.
    *   **API Surface**:
        *   `fn load_profile() -> Result<Profile>`
        *   `fn save_profile(profile: Profile) -> Result<()>`
        *   `fn simulate_axis(axis: u8, value: u16, config: &AxisConfig)`

---

## 2. Frontend: Component Architecture (Widgetization)

The current `InputsTab.vue` and `InputsSettings.vue` are monolithic. We will refactor them into granular, reusable widgets following a component-based architecture (Atomic/Molecule/Organism).

### 2.1 Shared UI Library (`libs/ui-kit` or `shared/components`)
These components should be moved to a shared location usable by both apps.

#### **Atoms (Basic Building Blocks)**
*   **`ThemedInput.vue`**: Standardized text input with theme styles (currently duplicated as `.base-input`, `.axis-name-input`).
*   **`ThemedSlider.vue`**: Replacement for `BaseSlider` and raw `<input type="range">`.
*   **`ThemedSelect.vue`**: Replacement for `BaseSelect`.
*   **`StatusBadge.vue`**: Visual indicator for active/inactive states.

#### **Molecules (Specific Functionality)**
*   **`AxisMonitor.vue`**:
    *   **Purpose**: Visualize an axis value (0-100% or raw 0-65535).
    *   **Props**: `value` (number), `orientation` ('horizontal'|'vertical'), `markers` (optional array of threshold points).
    *   **Usage**: Replaces `.monitor-mini` (Launcher) and `.deadzone-monitor` (Configurator).
*   **`DualThresholdSlider.vue`**:
    *   **Purpose**: A specific control for setting "Low" and "High" trigger points simultaneously.
    *   **Props**: `min` (v-model), `max` (v-model), `range` (0-32767).
    *   **Usage**: Replaces the two separate sliders in the Configurator's Deadzone modal.

#### **Organisms (Complex Widgets)**
*   **`AxisMappingRow.vue`**:
    *   **Purpose**: Represents a single axis row in the grid.
    *   **Components**: `AxisHeader` (Label + Input), `AxisMonitor` (Visualizer), `CalibrationControls` (Min/Max inputs).
    *   **Usage**: The main repetitive element in both apps.
*   **`MappingEditModal.vue`**:
    *   **Purpose**: The modal for assigning Keys/Buttons to an axis.
    *   **Components**: `TriggerConfiguration` (Logic for keys), `DeadzoneEditor` (Visualizer + Sliders).
    *   **Usage**: Extracted entirely from `InputsTab.vue`.

### 2.2 Proposed Directory Structure
```
src/
  components/
    shared/                # Or linked from libs/
      atoms/
        ThemedInput.vue
        ThemedSlider.vue
      molecules/
        AxisMonitor.vue    # Visualizer
        TriggerConfig.vue  # Deadzone Logic
    widgets/               # App-specific organisms
      AxisMappingRow.vue   # The "Card"
      MappingModal.vue     # The Editor
    tabs/
      InputsTab.vue        # NOW: Only orchestrates state -> widgets
```

---

## 3. Logic Extraction (Composables)

To adhere to **Strict Modularization**, business logic must be separated from UI components.

*   **`useAxisNormalization.ts`**:
    *   **Logic**: Calculating percentage based on Min/Max/Invert.
    *   **Current Location**: Hardcoded in `getAxisPercentage` in both files.
*   **`useHardwareStream.ts`**:
    *   **Logic**: Managing the Tauri Event Listener (`unlisten`, `listen`) and state.
    *   **Purpose**: Components just call `const { adc } = useHardwareStream()` without worrying about setup/teardown.
*   **`useMappingPersistence.ts`**:
    *   **Logic**: Loading/Saving to backend, handling defaults and migrations.

---

## 4. Guideline Compliance Audit & Technical Debt

Review based on `docs/project_guidelines.md`.

| Category | Violation ID | Description | Remediation Action |
| :--- | :--- | :--- | :--- |
| **Language** | `LANG-01` | **Portuguese Strings in Code**: Fallbacks like `'Mapear'`, `'Botão'`, and comments `// Mapeamento...`. | **Strict Enforcement**: All code strings must be English. Portuguese only in `locales/pt.json`. |
| **Modularization** | `MOD-01` | **Monolithic Files**: `InputsTab.vue` handles UI, Data, and Event Logic. | Refactor into `AxisMappingRow` and `MappingEditModal` as described in Section 2. |
| **Abstraction** | `ABS-01` | **Direct Store Access**: Components access `store.status.adc[i]`. | Refactor to use `useHardwareStream` which returns a typed, safe signal. |
| **UX/UI** | `UI-01` | **Inconsistent Visuals**: Configurator uses Horizontal visualizer, Launcher uses Vertical. | Use shared `AxisMonitor.vue` component with `orientation` prop. |
| **Architecture** | `ARCH-01` | **Service Duplication**: `KeyboardService` exists in both backends. | Move to `libs/input_manager` (Rust). |

---

## 5. Implementation Roadmap

1.  **Refactor Phase 1: Clean Up** (Immediate)
    *   Fix `LANG-01` (English Standardization) in all files.
2.  **Refactor Phase 2: Widgetize**
    *   Create `AxisMonitor.vue` and `AxisMappingRow.vue`.
    *   Extract `MappingEditModal.vue` from Configurator.
3.  **Refactor Phase 3: Backend Unification**
    *   Initialize `libs/input_manager`.
    *   Migrate Rust logic from both apps.

---

## 6. Audit Findings: `apps/configurator`

Status check performed on 2026-01-21.

### 6.1 Strict TypeScript Violations (`any`)
The following files utilize `any`, disabling type safety and violating Project Rules:
*   `src/i18n.ts`: `i18nInstance: any`
*   `src/stores/hardware.ts`: `updateKeyboardMapping(mappings: any[])`
*   `src/services/hardware_service.ts`: `mappings: any[]`
*   `src/components/tabs/InputsTab.vue`: `JSON.parse(savedMappings).map((m: any) => ...)`
*   `src/components/tabs/ToolsTab.vue`: `keyMappings: any[]`
*   `src/components/common/BaseSelect.vue`: `value: any`

**Action**: Define proper TypeScript interfaces (e.g., `DropdownOption`, `KeyMappingPayload`, `LocaleInstance`) and remove `any` completely.

### 6.2 Architecture Violations
*   **Bypass of State Management**: `InputsTab.vue` dynamically imports `HardwareService` to call `setKeyboardMapping`, effectively bypassing the `hardware` store which is designed to manage this state.
    *   **Fix**: Update to call `store.updateKeyboardMapping(mappings)`, ensuring state consistency and decoupling.
*   **Monolithic Files**: The following components violate Single Responsibility Principle by size and mixed scope:
    *   `InputsTab.vue` (**602 lines**): Contains Grid, Modal, Validation, Persistence, and Hardware Monitoring. **Critical Priority**.
    *   `ToolsTab.vue` (**331 lines**): Contains mixed logic for unrelated features ("Friction Test", "System Info").
    *   `SettingsTab.vue` (**328 lines**): Mixed Settings/Theme logic.

### 6.3 Code Quality & Standards
*   **Direct DOM Interactions**: Usage of `localStorage` directly in `InputsTab.vue` (lines 270+) instead of a Persistence Service or Store.
*   **Inconsistent Import Styles**: Dynamic imports (`await import(...)`) used unnecessarily when static imports or Store actions would suffice.

## 7. Execution Checklist

### Phase 1: Cleanup & Standards (Immediate)
- [x] Fix `any` types in `apps/configurator/src/i18n.ts`
- [x] Fix `any` types in `apps/configurator/src/stores/hardware.ts`
- [x] Fix `any` types in `apps/configurator/src/services/hardware_service.ts`
- [x] Fix `any` types in `apps/configurator/src/components/tabs/InputsTab.vue`
- [x] Fix `any` types in `apps/configurator/src/components/tabs/ToolsTab.vue`
- [x] Fix `any` types in `apps/configurator/src/components/common/BaseSelect.vue`
- [x] Fix LANG-01: Portuguese Strings in Code (Start with comments/logs, then checking strings)
- [x] Refactor `apps/configurator/src/locales/pt-BR.json` to use nested structure (matching `apps/launcher/src/locales/pt.json`)

### Phase 2: Logic Extraction & State Management
- [x] Create `useHardwareStream` composable to manage event listeners
- [x] Refactor `InputsTab.vue` to use `useHardwareStream` instead of direct store access
- [x] Refactor `InputsTab.vue` to use `store.updateKeyboardMapping` instead of bypassing store
- [x] Extract `localStorage` logic to a Persistence Service/Composable
- [ ] Create `useAxisNormalization` composable

### Phase 3: Component Widgetization (UI Kit)
- [x] Create `ThemedInput.vue` (Atom)
- [x] Create `ThemedSlider.vue` (Atom)
- [x] Create `ThemedSelect.vue` (Atom)
- [x] Create `StatusBadge.vue` (Atom)
- [x] Create `AxisMonitor.vue` (Molecule)
- [x] Create `DualThresholdSlider.vue` (Molecule)
- [x] Create `AxisMappingRow.vue` (Organism)
- [x] Create `MappingEditModal.vue` (Organism)

### Phase 4: Refactoring InputsTab
- [x] Refactor `InputsTab.vue` to use new components
- [x] Verify functionality of Refactored InputsTab

