# Especificação de UI/UX: SODevs Game Launcher

## 📌 Visão Geral
Uma interface moderna, rápida e focada em "Game Mode", inspirada em ecossistemas de alta performance.

## 🎨 Design System (Atualizado)
- **Tema**: Roxo Profundo / Dark Space.
- **Base**: `Inter` font family.
- **Cores**:
  - Background (Dark): `#0f172a`
  - Cards: `#1e293b`
  - Primary: `#7c3aed` (Violet)
  - Accent: `#c084fc`

## 🗺️ Fluxo de Navegação

### 1. Dashboard (Home)
- **Visual**: Grid de jogos cadastrados em TOML/SQLite.
- **Ação**: Clicar em um jogo abre o detalhe ou lança o jogo diretamente.
- **Hardware Status**: Indicador flutuante ou no header mostrando se o volante FFBeast está conectado.

### 2. Configurações de Hardware (Wheel Settings)
- **Visual**: Sliders para:
  - Range (0-3600 graus)
  - FFB Gain (0-100%)
  - Dampening (Dynamic/Static)
- **Real-time Feedback**: Monitor visual da posição do volante (usando a POC de leitura HID).

### 3. Editor de Jogo
- **Campos**:
  - Path (Browser de arquivos)
  - Arguments
  - Environment Variables (Interface de chave-valor)
  - DLL Overrides (Dropdown de modos: Native, Built-in)

## 📱 Responsividade
- O launcher deve ser utilizável via Teclado/DPAD (Controle) para facilitar o uso em sistemas instalados em simuladores (Cockpits).
