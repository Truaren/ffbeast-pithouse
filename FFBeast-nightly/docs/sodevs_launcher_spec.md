# Especificação Geral: SODevs Launcher

O **SODevs Launcher** é uma aplicação planejada para gerenciamento centralizado de jogos de simulação (SimRacing) e perfis de hardware. Ele atuará como o hub principal para o ecossistema SODevs, integrando o hardware FFBeast com os simuladores.

## Visão Geral

- **Plataforma**: Tauri v2 (Rust + Frontend Web).
- **Público Alvo**: Entusiastas de SimRacing usuários do hardware SODevs/FFBeast.

## Funcionalidades Previstas

### 1. Gerenciamento de Jogos (Library)
- Detecção automática de simuladores instalados (Assetto Corsa, iRacing, Automobilista 2, etc.).
- Lançamento rápido de jogos (Launch).
- Exibição de arte/capas dos jogos.

### 2. Perfis de Force Feedback (FFB) Automáticos
- **Associação Perfil-Jogo**: Ao iniciar um jogo, o Launcher aplica automaticamente as configurações de FFB ideais para aquele título no volante FFBeast.
- Criação e edição de perfis personalizados por jogo.
- Cloud Sync (Futuro): Compartilhamento de perfis entre usuários.

### 3. Integração com Content Manager (Assetto Corsa)
- Suporte a lançamento via protocolos customizados (ex: `acmanager:`).
- Gerenciamento de mods (potencialmente).

### 4. Telemetria e Dashboard
- Exibição de dados de telemetria em segunda tela (RPM, Velocidade, Gear).
- Logs de sessão.

### 5. Atualização de Ecossistema
- Atualização do próprio Launcher e do Firmware do volante.
- Notificações de novidades da SODevs.

## Estado Atual (WIP)

Atualmente o projeto encontra-se em estágio inicial de estruturação (`apps/launcher`), compartilhando bibliotecas base com o Configurator (`libs/controller`, `libs/database`).

```
apps/launcher
├── src-tauri/      # Core Rust (Gestão de processos, injeção)
├── src/            # Interface de seleção de jogos
└── ...
```
