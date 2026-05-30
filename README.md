# InterTeste Agent v2.0.0

Agente local para comunicação com inversores de frequência e equipamentos industriais via **Modbus TCP**, **Modbus RTU Serial**, **CANopen** e **CAN Raw**.

Desenvolvido pela [Interface Automação](https://www.interfaceautomacao.com.br) para uso com a plataforma **InterTeste**.

## Novidades na v2.0.0

- Suporte a CANopen via USB-CAN (SocketCAN no Linux, SLCAN no Windows)
- Perfil Vacon NX (OPTC6) com 13 parâmetros via SDO
- Perfil Vacon 100 (OPT-E6) com 11 parâmetros via SDO
- Perfil CANopen DS402 genérico
- Detecção automática de interfaces CAN disponíveis
- Modo simulado para testes sem hardware

## Protocolos Suportados

- Modbus TCP (Ethernet)
- Modbus RTU Serial (RS485/RS232 via USB-Serial)
- CANopen via USB-CAN (PEAK PCAN-USB, CANable, Lawicel)
- CAN Raw

## Requisitos

- Windows 10/11 ou Linux (Ubuntu 20.04+)
- Node.js 18+
- Para CAN no Linux: sudo apt install can-utils
- Para CAN no Windows: driver do adaptador USB-CAN

## Instalação

### Windows
Baixe o instalador .exe na seção Releases e execute.

### Linux / Manual
npm install && node index.js

## Configuração CAN no Linux

sudo ip link set can0 up type can bitrate 500000

Interface para usar na plataforma: can0

## Configuração CAN no Windows

O adaptador USB-CAN aparece como COM3, COM4, etc. no Gerenciador de Dispositivos.
Interface para usar na plataforma: COM3 (ou a porta detectada)

## Porta WebSocket

O agente escuta na porta 9090. A plataforma InterTeste conecta automaticamente.

(c) 2026 Interface Automacao
