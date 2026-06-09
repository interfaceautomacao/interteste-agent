# InterTeste Agent v2.1.1

Agente local para comunicação com inversores de frequência e equipamentos industriais via **Modbus TCP**, **Modbus RTU Serial**, **CANopen** e **CAN Raw**.

Desenvolvido pela [Interface Automação](https://www.interfaceautomacao.com.br) para uso com a plataforma **InterTeste**.

---

## Novidades na v2.1.1

### Correções de Bugs

**Bug crítico corrigido: `ReferenceError: modbusClients is not defined`**
A variável `modbusClients` era utilizada em toda a lógica de comunicação Modbus RTU/Serial (USB/CAN) mas nunca havia sido declarada. Isso causava uma falha imediata ao tentar conectar inversores via porta serial. Corrigido com a declaração adequada `const modbusClients = new Map()`.

**Novo: Servidor HTTP na porta 7878 com endpoint `/health`**
O servidor em nuvem verifica a saúde do agente via `http://localhost:7878/health`. Nas versões anteriores, o agente só possuía WebSocket na porta 9090, causando falhas de verificação. Agora o endpoint `/health` retorna status, versão, portas seriais e capacidades.

### Como atualizar

1. Baixe o ZIP desta versão
2. Extraia substituindo a pasta `interteste-agent` existente
3. Execute o `start-agent.bat` como Administrador
4. Verifique em `http://localhost:7878/health`

---

## Novidades na v2.1.0

- Ciclo de teste automatizado com múltiplos registradores
- Suporte a multimedidor (leitura de potência, tensão, corrente)
- Melhorias no protocolo CANopen

---

## Novidades na v2.0.0

- Suporte a CANopen via USB-CAN (SocketCAN no Linux, SLCAN no Windows)
- Perfil Vacon NX (OPTC6) com 13 parâmetros via SDO
- Perfil Vacon 100 (OPT-E6) com 11 parâmetros via SDO
- Perfil CANopen DS402 genérico
- Detecção automática de interfaces CAN disponíveis
- Modo simulado para testes sem hardware

---

## Protocolos Suportados

- Modbus TCP (Ethernet)
- Modbus RTU Serial (RS485/RS232 via USB-Serial)
- CANopen via USB-CAN (PEAK PCAN-USB, CANable, Lawicel)
- CAN Raw

---

## Requisitos

- Windows 10/11 ou Linux (Ubuntu 20.04+)
- Node.js 18+ (apenas para modo portátil/manual)
- Para CAN no Linux: `sudo apt install can-utils`
- Para CAN no Windows: driver do adaptador USB-CAN

---

## Instalação

### Windows — Portátil (recomendado)

1. Baixe o arquivo `interteste-agent-v2.1.1.zip` na seção [Releases](https://github.com/interfaceautomacao/interteste-agent/releases)
2. Extraia em uma pasta de sua preferência (ex: `C:\interteste-agent`)
3. Execute `start-agent.bat` como **Administrador**
4. O agente estará disponível em:
   - WebSocket: `ws://localhost:9090`
   - Health check: `http://localhost:7878/health`

### Linux / Manual

```bash
npm install && node index.js
```

---

## Portas

| Porta | Protocolo | Uso |
|-------|-----------|-----|
| 9090  | WebSocket | Comunicação com a plataforma InterTeste |
| 7878  | HTTP      | Health check pelo servidor em nuvem |

---

© 2026 Interface Automação
