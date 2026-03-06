# Especificação de Teste: Persistência (Storage Backend)

## 📌 Objetivo
Garantir que os dados de jogos e perfis de volante sejam lidos e gravados corretamente, independentemente do backend utilizado (TOML ou SQLite).

## 🧪 Casos de Teste

### 1. Ciclo de Vida do Jogo (CRUD)
- **Ação**: Criar um novo jogo, salvar no banco, ler de volta, atualizar um campo e deletar.
- **Resultado Esperado**: O objeto lido deve ser idêntico ao salvo. Após o delete, a lista de jogos deve estar vazia.

### 2. Integridade de Perfis (Default vs Custom)
- **Ação**: Tentar recuperar um perfil inexistente.
- **Resultado Esperado**: Deve retornar `None` (ou erro controlado) sem crashar.
- **Ação**: Salvar um perfil customizado e ler de volta.
- **Resultado Esperado**: Todos os campos numéricos (motion_range, etc) devem manter a precisão.

### 3. Persistência Física (TOML)
- **Ação**: Salvar um jogo e verificar se o arquivo físico foi criado no disco.
- **Resultado Esperado**: O arquivo deve conter o conteúdo serializado em formato legível TOML.

### 4. Concorrência (Thread Safety)
- **Ação**: Tentar ler e gravar simultaneamente de threads diferentes.
- **Resultado Esperado**: O sistema não deve causar Deadlocks ou corrupção de dados (Uso de RwLock deve garantir isso).

## 🛠️ Implementação dos Testes
Os testes devem ser implementados dentro do módulo `storage/toml_impl.rs` ou em um arquivo de teste de integração separado em `tests/`.
