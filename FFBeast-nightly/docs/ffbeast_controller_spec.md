# Especificação Geral: FFBeast Controller (Backend Library)

A biblioteca **FFBeast Controller** (`libs/controller`) é o núcleo lógico escrito em **Rust** responsável por toda a interação de baixo nível com o hardware do volante. Ela abstrai a complexidade do protocolo USB/HID e fornece uma API segura para a camada de aplicação (UI ou Launcher).

## Objetivos
- Garantir comunicação estável e thread-safe com o dispositivo HID.
- Processar relatórios de entrada (Input Reports) em alta frequência (>1kHz desejável).
- Gerenciar estado persistente e configurações do dispositivo.
- Prover abstração "Trait-based" para suportar diferentes backends de hardware no futuro.

## Funcionalidades Principais

### 1. Comunicação HID
- **Protocolo**: Human Interface Device (USB HID).
- **Vendor ID**: `0x045E` (Exemplo/Placeholder) ou Configurado.
- **Product ID**: Específico do FFBeast.
- Uso da biblioteca `hidapi` para acesso multiplataforma (Windows/Linux).

### 2. Leitura de Sensores
- **Loop de Leitura**: Thread dedicada para polling de HID Reports.
- **Dados Processados**:
  - Posição do Encoder (16-bit ou 32-bit).
  - Torque Atual (Feedback do motor).
  - Estado de Botões (até 32/64 botões).
  - Entradas Analógicas (ADC) - Pedais, Freio de Mão.

### 3. Integração Cross-Platform (Gamepad)
- Uso da crate `gilrs` para ler inputs de controles genéricos como fallback ou complementação.
- Unificação de eventos de controle (Botões de volante real + Gamepad virtual).

### 4. Gestão de Configurações
Estruturas de dados serializáveis (intercambiáveis com o Frontend):
- `HardwareSettings`: Limites físicos e elétricos.
- `EffectSettings`: Parâmetros de efeitos FFB.
- `GpioSettings`: Mapeamento de pinos.
- `AdcSettings`: Calibração de eixos.

O backend envia e recebe esses dados via **Feature Reports** do HID.

### 5. Controle de Força (Force Feedback)
- Envio de comandos de força direta (`DirectX Spring`, `Constant`, etc.) para o Firmware.
- Suporte a atualização dinâmica de parâmetros de ganho.

### 6. Sistema de Licenciamento
- Leitura segura de ID do processador (Unique ID via Feature Report).
- Validação de chave de ativação criptografada.
- Armazenamento seguro de estado de ativação.

## Estrutura de Código

```
libs/controller/src
├── lib.rs              # Exports
├── hardware_service.rs # Implementação principal (HardwareService struct)
├── key_map.rs          # Mapeamento de teclas vJoy/Keyboard
├── gamepad_reader.rs   # Integração com Gilrs
├── models/             # Structs de dados (Settings, Status)
└── wheel_interface.rs  # Trait WheelInterface (Contrato de API)
```

## Logs e Debug
- Uso da crate `tracing` para logs estruturados.
- Monitoramento de pacotes HID (bytes brutos) para diagnósticos.
