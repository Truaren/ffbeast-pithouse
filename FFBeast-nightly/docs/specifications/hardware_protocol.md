# Especificação de Hardware: Protocolo HID FFBeast

## 📌 Objetivo
Descrever o protocolo de comunicação via USB HID entre o SODevs Game Launcher e o controlador FFBeast.

## 🛠️ Identificação do Dispositivo
- **Vendor ID (VID)**: `0x045B` (1115)
- **Product ID (PID)**: `0x59D7` (22999)

## 📡 Estrutura de Relatórios (Reports)

### 1. Relatório de Estado (Status Report)
- **ID**: `0x01` (REPORT_JOYSTICK_INPUT)
- **Direção**: Dispositivo -> Host
- **Payload**:
  - `offset 1-4`: Firmware Version (Major.Minor.Patch)
  - `offset 5`: IsRegistered (bool)
  - `offset 6-7`: Position (i16, Little Endian)
  - `offset 8-9`: Torque (i16, Little Endian)

### 2. Configurações de Efeito (Effect Settings)
- **Feature Report ID**: `0x22` (REPORT_EFFECT_SETTINGS_FEATURE)
- **Campos**:
  - `Range`: Motion Range (u16)
  - `Total Strength`: (u8)
  - `Dampening`: Static & Dynamic (u16)

### 3. Configurações de Hardware (Hardware Settings)
- **Feature Report ID**: `0x21` (REPORT_HARDWARE_SETTINGS_FEATURE)
- **Campos**:
  - `Encoder CPR`: (u16)
  - `Power Limit`: (u8)
  - `Pole Pairs`: (u8)

## ⚡ Comandos de Controle (Generic I/O)
- **Report ID**: `0xA3` (REPORT_GENERIC_INPUT_OUTPUT)
- **Sub-comandos (Byte 1 do Buffer)**:
  - `0x01`: Reboot
  - `0x02`: Save Settings
  - `0x04`: Reset Center
  - `0x14`: Set Field Value (Usado para atualizar parâmetros individuais)

## 🧪 Estratégia de Teste
1. **Mocking**: Criar um `HardwareInterface` trait para permitir testes de UI sem hardware real.
2. **Fuzzing**: Testar envio de valores fora dos limites (ex: Range > 3600) para garantir que o launcher trate erros de validação antes do envio.
