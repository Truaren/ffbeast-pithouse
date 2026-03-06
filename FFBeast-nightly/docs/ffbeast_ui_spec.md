# Especificação Geral: FFBeast UI (Configurator)

O **FFBeast UI** é a aplicação de configuração e monitoramento para o hardware de Force Feedback "FFBeast". Desenvolvido sobre a plataforma **Tauri v2**, utiliza **Vue 3**, **TypeScript** e **Vite** para uma interface moderna, reativa e tipada.

![Logo](../img/logo_app.png)

## Arquitetura

- **Frontend**: Single Page Application (SPA) reativa.
  - **Framework**: Vue 3 (Composition API).
  - **Linguagem**: TypeScript (Strict Mode).
  - **Estado**: Pinia (Store Centralizada `hardware.ts`).
  - **Componentes**: SFC (Single File Components) modulares e reutilizáveis.
  - **Estilização**: CSS Nativo seguindo o design system do projeto.
  - **Internacionalização**: Vue I18n com suporte a EN e PT-BR.
  - **Comunicação**: IPC via Tauri Commands.

- **Backend (Tauri/Rust)**: 
  - Gerencia a janela nativa e a comunicação HID direto com o hardware.
  - Expõe comandos como `connect`, `get_hardware_settings`, `save_settings`.

## Funcionalidades Principais

### 1. Monitoramento (Dashboard)
- Visualização em tempo real da posição do volante (Animação SVG 60FPS).
- Barra de Torque/Force Feedback ao vivo.
- Status do Firmware e Conexão.
- Status de Botões em grade visual.
- Monitoramento de Eixos Analógicos (ADC).

### 2. Configuração de Hardware
- **Motor e Encoder**: Definição de CPR, Limite de Potência, Polos.
- **Calibração**: Reset de Centro, Calibração de ADC (Min/Max/Invert).
- **PID Tuning**: Ajuste de ganhos P e I para o controle de posição/força.

### 3. Efeitos de Força (FFB)
- Ajuste de ganhos globais e efeitos específicos (Spring, Damper, Friction, Inertia).
- Configuração de "Motion Range" (Graus de rotação).
- Inversão de força (Force Reversal).

### 4. Entradas e GPIO
- Mapeamento de pinos para botões e eixos.
- Configuração de matriz de botões.
- Seleção de protocolos de expansão (DirectHID, CAN-Bus, etc).

### 5. Ferramentas e Sistema
- **FFB Test**: Testes manuais de efeitos (Constant Force, Sine, etc).
- **Logs**: Console interno para depuração de comandos.
- **Configurações**: Customização da UI (Accent color, idioma).
- **Licença**: Sistema de ativação e ID de hardware.

## Estrutura de Pastas (src)

```
apps/configurator/src
├── assets/          # Assets estáticos
├── components/      # Componentes Vue SFC
│   ├── common/      # UI Base (BaseCard, BaseSlider, etc)
│   ├── monitor/     # Widgets de monitoramento
│   └── tabs/        # Abas principais da aplicação
├── locales/         # Traduções (en.json, pt-BR.json)
├── models/          # Interfaces e Types TypeScript (1 por arquivo)
├── services/        # Abstração de comandos Tauri
├── stores/          # Estado reativo (Pinia)
└── styles/          # Variáveis CSS e estilos globais
```
