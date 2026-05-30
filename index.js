#!/usr/bin/env node
/**
 * InterTeste Agent v2.0.0
 * Interface Automação - Agente Local para Comunicação com Inversores
 *
 * Suporta:
 *  - Modbus TCP (Ethernet)
 *  - Modbus RTU Serial (RS485/RS232 via USB-Serial)
 *  - CANopen via USB-CAN (socketcan, slcan, PCAN-USB, Kvaser)
 *  - CAN Raw via USB-CAN
 *
 * Perfis de equipamentos:
 *  - Vacon NX  (CANopen OPTC6)
 *  - Vacon 100 (CANopen OPT-E6)
 *  - CANopen DS402 genérico
 *  - WEG CFW-11 / CFW-700 / CFW-900 (Modbus RTU USB)
 */

const WebSocket = require('ws');
const ModbusRTU = require('modbus-serial');
const { SerialPort } = require('serialport');
const { execSync, spawn } = require('child_process');

const PORT = 9090;
const VERSION = '2.0.0';

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   InterTeste Agent v${VERSION}                            ║
║   Interface Automação - Agente Local                     ║
║   Modbus TCP | Modbus RTU | CANopen | CAN Raw            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

// ==================== CAN PROFILES ====================

const CAN_PROFILES = {
  canopen_vacon_nx: {
    name: 'Vacon NX (CANopen OPTC6)',
    nmt: true,
    registers: [
      { id: 'vacon_nx_freq_ref',  name: 'Referência de Frequência', unit: 'Hz',  type: 'sdo', index: 0x2100, subIndex: 0x01, scaleFactor: 0.01 },
      { id: 'vacon_nx_freq_out',  name: 'Frequência de Saída',      unit: 'Hz',  type: 'sdo', index: 0x2100, subIndex: 0x02, scaleFactor: 0.01 },
      { id: 'vacon_nx_speed',     name: 'Velocidade do Motor',      unit: 'rpm', type: 'sdo', index: 0x2100, subIndex: 0x03, scaleFactor: 1    },
      { id: 'vacon_nx_current',   name: 'Corrente do Motor',        unit: 'A',   type: 'sdo', index: 0x2100, subIndex: 0x04, scaleFactor: 0.1  },
      { id: 'vacon_nx_torque',    name: 'Torque do Motor',          unit: '%',   type: 'sdo', index: 0x2100, subIndex: 0x05, scaleFactor: 0.1  },
      { id: 'vacon_nx_power',     name: 'Potência do Motor',        unit: '%',   type: 'sdo', index: 0x2100, subIndex: 0x06, scaleFactor: 0.1  },
      { id: 'vacon_nx_volt_out',  name: 'Tensão de Saída',          unit: 'V',   type: 'sdo', index: 0x2100, subIndex: 0x07, scaleFactor: 1    },
      { id: 'vacon_nx_dc_bus',    name: 'Tensão Barramento CC',     unit: 'V',   type: 'sdo', index: 0x2100, subIndex: 0x08, scaleFactor: 1    },
      { id: 'vacon_nx_temp',      name: 'Temperatura do Drive',     unit: '°C',  type: 'sdo', index: 0x2100, subIndex: 0x09, scaleFactor: 1    },
      { id: 'vacon_nx_hours',     name: 'Horas de Operação',        unit: 'h',   type: 'sdo', index: 0x2100, subIndex: 0x0B, scaleFactor: 1    },
      { id: 'vacon_nx_kwh',       name: 'Contador kWh',             unit: 'kWh', type: 'sdo', index: 0x2100, subIndex: 0x0C, scaleFactor: 1    },
      { id: 'vacon_nx_fault',     name: 'Último Código de Falha',   unit: '',    type: 'sdo', index: 0x2100, subIndex: 0x0D, scaleFactor: 1    },
      { id: 'vacon_nx_status',    name: 'Palavra de Status',        unit: '',    type: 'sdo', index: 0x6041, subIndex: 0x00, scaleFactor: 1    },
    ]
  },
  canopen_vacon_100: {
    name: 'Vacon 100 (CANopen OPT-E6)',
    nmt: true,
    registers: [
      { id: 'vacon100_status',    name: 'Palavra de Status',        unit: '',    type: 'sdo', index: 0x6041, subIndex: 0x00, scaleFactor: 1    },
      { id: 'vacon100_freq_out',  name: 'Frequência de Saída',      unit: 'Hz',  type: 'sdo', index: 0x2001, subIndex: 0x02, scaleFactor: 0.01 },
      { id: 'vacon100_speed',     name: 'Velocidade do Motor',      unit: 'rpm', type: 'sdo', index: 0x2001, subIndex: 0x03, scaleFactor: 1    },
      { id: 'vacon100_current',   name: 'Corrente do Motor',        unit: 'A',   type: 'sdo', index: 0x2001, subIndex: 0x04, scaleFactor: 0.1  },
      { id: 'vacon100_torque',    name: 'Torque do Motor',          unit: '%',   type: 'sdo', index: 0x2001, subIndex: 0x05, scaleFactor: 0.1  },
      { id: 'vacon100_power',     name: 'Potência do Motor',        unit: 'kW',  type: 'sdo', index: 0x2001, subIndex: 0x06, scaleFactor: 0.1  },
      { id: 'vacon100_volt_out',  name: 'Tensão de Saída',          unit: 'V',   type: 'sdo', index: 0x2001, subIndex: 0x07, scaleFactor: 1    },
      { id: 'vacon100_dc_bus',    name: 'Tensão Barramento CC',     unit: 'V',   type: 'sdo', index: 0x2001, subIndex: 0x08, scaleFactor: 1    },
      { id: 'vacon100_temp',      name: 'Temperatura do Drive',     unit: '°C',  type: 'sdo', index: 0x2001, subIndex: 0x09, scaleFactor: 1    },
      { id: 'vacon100_hours',     name: 'Horas de Operação',        unit: 'h',   type: 'sdo', index: 0x2001, subIndex: 0x0B, scaleFactor: 1    },
      { id: 'vacon100_fault',     name: 'Último Código de Falha',   unit: '',    type: 'sdo', index: 0x2001, subIndex: 0x0D, scaleFactor: 1    },
    ]
  },
  canopen_ds402: {
    name: 'CANopen DS402 (Genérico)',
    nmt: true,
    registers: [
      { id: 'ds402_status',       name: 'Palavra de Status (6041h)',    unit: '',    type: 'sdo', index: 0x6041, subIndex: 0x00, scaleFactor: 1   },
      { id: 'ds402_control',      name: 'Palavra de Controle (6040h)',  unit: '',    type: 'sdo', index: 0x6040, subIndex: 0x00, scaleFactor: 1   },
      { id: 'ds402_vel_actual',   name: 'Velocidade Atual (606Ch)',      unit: 'rpm', type: 'sdo', index: 0x606C, subIndex: 0x00, scaleFactor: 1   },
      { id: 'ds402_vel_demand',   name: 'Velocidade Demandada (606Bh)', unit: 'rpm', type: 'sdo', index: 0x606B, subIndex: 0x00, scaleFactor: 1   },
      { id: 'ds402_current',      name: 'Corrente Atual (6078h)',        unit: 'A',   type: 'sdo', index: 0x6078, subIndex: 0x00, scaleFactor: 0.1 },
      { id: 'ds402_torque',       name: 'Torque Atual (6077h)',          unit: '%',   type: 'sdo', index: 0x6077, subIndex: 0x00, scaleFactor: 0.1 },
      { id: 'ds402_error',        name: 'Código de Erro (603Fh)',        unit: '',    type: 'sdo', index: 0x603F, subIndex: 0x00, scaleFactor: 1   },
    ]
  },
  can_raw: {
    name: 'CAN Raw (Frames Brutos)',
    nmt: false,
    registers: []
  }
};

// ==================== CANopen CLIENT ====================

class CANopenClient {
  constructor(config) {
    this.nodeId = config.canNodeId || 1;
    this.bitrate = config.canBitrate || 500;
    this.canInterface = config.canInterface || 'can0';
    this.profile = config.canProfile || 'canopen_vacon_nx';
    this.timeout = config.modbusTimeout || 2000;
    this.isOpen = false;
    this.pendingSdo = new Map();
    this.platform = process.platform;
    this._simulationMode = false;
    this.candumpProcess = null;
    this.slcanPort = null;
  }

  async connect() {
    if (this.platform === 'linux') {
      return await this._connectLinux();
    } else if (this.platform === 'win32') {
      return await this._connectWindows();
    } else {
      // macOS or other: try simulation mode
      console.log('[CAN] Plataforma não suportada nativamente, usando modo simulado');
      this._simulationMode = true;
      this.isOpen = true;
      return true;
    }
  }

  async _connectLinux() {
    try {
      execSync(`ip link show ${this.canInterface} 2>/dev/null`, { stdio: 'pipe' });
    } catch (e) {
      // Interface not found - check if it's a serial SLCAN device
      if (this.canInterface.startsWith('/dev/tty')) {
        return await this._connectSLCAN();
      }
      throw new Error(`Interface CAN '${this.canInterface}' não encontrada. Verifique se o adaptador USB-CAN está conectado (ip link show).`);
    }
    try {
      execSync(`ip link set ${this.canInterface} down 2>/dev/null; ip link set ${this.canInterface} type can bitrate ${this.bitrate * 1000} 2>/dev/null; ip link set ${this.canInterface} up 2>/dev/null`, { stdio: 'pipe' });
    } catch (e) {
      console.log(`[CAN] Aviso ao configurar interface: ${e.message}`);
    }
    this.isOpen = true;
    this._startCandump();
    return true;
  }

  async _connectWindows() {
    if (this.canInterface.match(/^COM\d+$/i) || this.canInterface.startsWith('/dev/tty')) {
      return await this._connectSLCAN();
    }
    throw new Error(`No Windows, use o formato SLCAN (ex: COM3). O adaptador USB-CAN aparece como porta COM no Gerenciador de Dispositivos.`);
  }

  async _connectSLCAN() {
    const bitrateMap = { 10: 0, 20: 1, 50: 2, 100: 3, 125: 4, 250: 5, 500: 6, 800: 7, 1000: 8 };
    const bitrateCode = bitrateMap[this.bitrate] !== undefined ? bitrateMap[this.bitrate] : 6;

    return new Promise((resolve, reject) => {
      const port = new SerialPort({ path: this.canInterface, baudRate: 115200, autoOpen: false });
      port.open((err) => {
        if (err) return reject(new Error(`Erro ao abrir porta SLCAN ${this.canInterface}: ${err.message}`));
        this.slcanPort = port;
        let buffer = '';
        port.on('data', (data) => {
          buffer += data.toString('ascii');
          const lines = buffer.split('\r');
          buffer = lines.pop();
          for (const line of lines) {
            if (line.length > 0) this._processSLCANFrame(line);
          }
        });
        const init = async () => {
          try {
            await this._slcanWrite('\r');
            await new Promise(r => setTimeout(r, 100));
            await this._slcanWrite(`S${bitrateCode}\r`);
            await new Promise(r => setTimeout(r, 100));
            await this._slcanWrite('O\r');
            await new Promise(r => setTimeout(r, 200));
            this.isOpen = true;
            resolve(true);
          } catch (e) { reject(e); }
        };
        init();
      });
    });
  }

  _slcanWrite(data) {
    return new Promise((resolve, reject) => {
      if (!this.slcanPort || !this.slcanPort.isOpen) return reject(new Error('Porta SLCAN não está aberta'));
      this.slcanPort.write(data, (err) => { if (err) reject(err); else resolve(); });
    });
  }

  _processSLCANFrame(line) {
    if (line[0] !== 't' && line[0] !== 'T') return;
    try {
      const isExtended = line[0] === 'T';
      const idLen = isExtended ? 8 : 3;
      const cobId = parseInt(line.substring(1, 1 + idLen), 16);
      const dlc = parseInt(line[1 + idLen], 16);
      const dataHex = line.substring(2 + idLen, 2 + idLen + dlc * 2);
      this._processCANFrame(cobId, Buffer.from(dataHex, 'hex'));
    } catch (e) {}
  }

  _startCandump() {
    this.candumpProcess = spawn('candump', [this.canInterface, '-t', 'z'], { stdio: ['ignore', 'pipe', 'ignore'] });
    let buffer = '';
    this.candumpProcess.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) this._parseCandumpLine(line);
    });
    this.candumpProcess.on('error', (err) => {
      console.log(`[CAN] candump não disponível: ${err.message}. Usando modo simulado.`);
      this._simulationMode = true;
    });
  }

  _parseCandumpLine(line) {
    const match = line.match(/\s+(\w+)\s+([0-9A-Fa-f]+)#([0-9A-Fa-f]*)/);
    if (!match) return;
    const cobId = parseInt(match[2], 16);
    const dataHex = match[3];
    const data = dataHex.length > 0 ? Buffer.from(dataHex, 'hex') : Buffer.alloc(0);
    this._processCANFrame(cobId, data);
  }

  _processCANFrame(cobId, data) {
    const sdoRespCobId = 0x580 + this.nodeId;
    if (cobId === sdoRespCobId && data.length >= 4) {
      const cs = (data[0] >> 5) & 0x07;
      const index = data[1] | (data[2] << 8);
      const subIndex = data[3];
      const key = `${index}_${subIndex}`;
      if (this.pendingSdo.has(key)) {
        const { resolve, reject, timer } = this.pendingSdo.get(key);
        clearTimeout(timer);
        this.pendingSdo.delete(key);
        if (cs === 2) {
          const e = (data[0] >> 1) & 0x01;
          const s = data[0] & 0x01;
          let value = 0;
          if (e && s) {
            const n = (data[0] >> 2) & 0x03;
            const byteCount = 4 - n;
            for (let i = 0; i < byteCount; i++) value |= (data[4 + i] << (i * 8));
          } else {
            value = data[4] | (data[5] << 8) | (data[6] << 16) | (data[7] << 24);
          }
          resolve(value);
        } else if (cs === 4) {
          const abortCode = data[4] | (data[5] << 8) | (data[6] << 16) | (data[7] << 24);
          reject(new Error(`SDO Abort 0x${abortCode.toString(16).toUpperCase()} (idx=0x${index.toString(16)}, sub=${subIndex})`));
        }
      }
    }
  }

  async sendFrame(cobId, data) {
    if (this._simulationMode) {
      // Simulation: fake SDO response after short delay
      setTimeout(() => {
        const sdoRespCobId = 0x580 + this.nodeId;
        if (cobId === (0x600 + this.nodeId) && data[0] === 0x40) {
          const fakeValue = Math.floor(Math.random() * 1000);
          const resp = Buffer.alloc(8);
          resp[0] = 0x4B; resp[1] = data[1]; resp[2] = data[2]; resp[3] = data[3];
          resp[4] = fakeValue & 0xFF; resp[5] = (fakeValue >> 8) & 0xFF;
          this._processCANFrame(sdoRespCobId, resp);
        }
      }, 50 + Math.random() * 100);
      return;
    }
    if (this.slcanPort) {
      const idHex = cobId.toString(16).padStart(3, '0');
      const dataHex = data.toString('hex').toUpperCase();
      await this._slcanWrite(`t${idHex}${data.length}${dataHex}\r`);
    } else if (this.platform === 'linux') {
      const dataHex = data.toString('hex').toUpperCase();
      execSync(`cansend ${this.canInterface} ${cobId.toString(16).padStart(3, '0')}#${dataHex}`, { stdio: 'pipe' });
    }
  }

  async readSDO(index, subIndex) {
    if (!this.isOpen) throw new Error('CAN não está conectado');
    const key = `${index}_${subIndex}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingSdo.delete(key);
        reject(new Error(`Timeout SDO (idx=0x${index.toString(16)}, sub=${subIndex}, nodeId=${this.nodeId})`));
      }, this.timeout);
      this.pendingSdo.set(key, { resolve, reject, timer });
      const req = Buffer.alloc(8, 0);
      req[0] = 0x40;
      req[1] = index & 0xFF; req[2] = (index >> 8) & 0xFF; req[3] = subIndex;
      this.sendFrame(0x600 + this.nodeId, req).catch(reject);
    });
  }

  async sendNMT(command) {
    await this.sendFrame(0x000, Buffer.from([command, this.nodeId]));
    await new Promise(r => setTimeout(r, 200));
  }

  async readProfile() {
    const profileDef = CAN_PROFILES[this.profile];
    if (!profileDef) throw new Error(`Perfil CAN desconhecido: ${this.profile}`);
    const results = [];
    for (const reg of profileDef.registers) {
      try {
        const rawValue = await this.readSDO(reg.index, reg.subIndex);
        const value = reg.scaleFactor ? rawValue * reg.scaleFactor : rawValue;
        results.push({ id: reg.id, name: reg.name, unit: reg.unit, rawValue, value: Math.round(value * 100) / 100, isError: false, error: null });
      } catch (e) {
        results.push({ id: reg.id, name: reg.name, unit: reg.unit, rawValue: null, value: null, isError: true, error: e.message });
      }
    }
    return results;
  }

  close() {
    this.isOpen = false;
    this.pendingSdo.clear();
    if (this.candumpProcess) { this.candumpProcess.kill(); this.candumpProcess = null; }
    if (this.slcanPort && this.slcanPort.isOpen) {
      this._slcanWrite('C\r').catch(() => {});
      setTimeout(() => this.slcanPort.close(), 200);
    }
    if (this.platform === 'linux' && !this._simulationMode && !this.slcanPort) {
      try { execSync(`ip link set ${this.canInterface} down 2>/dev/null`, { stdio: 'pipe' }); } catch (e) {}
    }
  }
}

// ==================== WEBSOCKET SERVER ====================

const wss = new WebSocket.Server({ port: PORT });
console.log(`✓ Servidor WebSocket iniciado na porta ${PORT}`);
console.log(`✓ Aguardando conexões do InterTeste...\n`);

const modbusClients = new Map();
const canClients = new Map();
const pollingIntervals = new Map();

wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substring(7);
  console.log(`[${new Date().toISOString()}] Cliente conectado: ${clientId}`);
  const modbusClient = new ModbusRTU();
  modbusClients.set(clientId, modbusClient);

  ws.send(JSON.stringify({
    type: 'welcome', version: VERSION,
    updateUrl: 'https://www.interfaceautomacao.com.br/admin/interteste/ajuda',
    capabilities: ['modbus_tcp', 'modbus_rtu', 'canopen', 'can_raw'],
    timestamp: Date.now()
  }));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`[${clientId}] Comando: ${data.type}`);
      const mbClient = modbusClients.get(clientId);
      const isCanType = data.config && (data.config.commType === 'canopen' || data.config.commType === 'can_raw');

      switch (data.type) {
        case 'ping': ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() })); break;
        case 'listSerialPorts': await handleListSerialPorts(ws); break;
        case 'listCanInterfaces': await handleListCanInterfaces(ws); break;
        case 'testConnection':
          if (isCanType) await handleTestCanConnection(ws, clientId, data.config);
          else await handleTestConnection(ws, mbClient, data.config);
          break;
        case 'readRegisters': await handleReadRegisters(ws, mbClient, data.params); break;
        case 'writeRegister': await handleWriteRegister(ws, mbClient, data.params); break;
        case 'startPolling':
          if (isCanType) await handleStartCanPolling(ws, clientId, data.config);
          else await handleStartPolling(ws, mbClient, clientId, data.config, data.registers);
          break;
        case 'stopPolling':
          handleStopPolling(clientId);
          ws.send(JSON.stringify({ type: 'pollingStopped', success: true }));
          break;
        case 'getCanProfile': handleGetCanProfile(ws, data.profile); break;
        case 'disconnect':
          handleStopPolling(clientId);
          if (mbClient.isOpen) mbClient.close(() => {});
          const cc = canClients.get(clientId);
          if (cc) { cc.close(); canClients.delete(clientId); }
          ws.send(JSON.stringify({ type: 'disconnected', success: true }));
          break;
        default:
          ws.send(JSON.stringify({ type: 'error', message: `Comando desconhecido: ${data.type}` }));
      }
    } catch (err) {
      console.error(`[${clientId}] Erro:`, err);
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
    }
  });

  ws.on('close', () => {
    console.log(`[${new Date().toISOString()}] Cliente desconectado: ${clientId}`);
    handleStopPolling(clientId);
    const mb = modbusClients.get(clientId);
    if (mb && mb.isOpen) mb.close(() => {});
    modbusClients.delete(clientId);
    const cc = canClients.get(clientId);
    if (cc) { cc.close(); canClients.delete(clientId); }
  });

  ws.on('error', (err) => console.error(`[${clientId}] Erro WS:`, err.message));
});

// ==================== HANDLERS ====================

async function handleListSerialPorts(ws) {
  try {
    const ports = await SerialPort.list();
    ws.send(JSON.stringify({
      type: 'serialPorts',
      ports: ports.map(p => ({
        path: p.path, manufacturer: p.manufacturer, serialNumber: p.serialNumber,
        pnpId: p.pnpId, vendorId: p.vendorId, productId: p.productId,
        isLikelyCan: !!(p.manufacturer && (
          p.manufacturer.toLowerCase().includes('peak') ||
          p.manufacturer.toLowerCase().includes('kvaser') ||
          p.manufacturer.toLowerCase().includes('lawicel') ||
          p.manufacturer.toLowerCase().includes('canable')
        ))
      })),
      timestamp: Date.now()
    }));
  } catch (err) {
    ws.send(JSON.stringify({ type: 'error', message: `Erro ao listar portas: ${err.message}` }));
  }
}

async function handleListCanInterfaces(ws) {
  const interfaces = [];
  if (process.platform === 'linux') {
    try {
      const output = execSync('ip link show type can 2>/dev/null || ls /sys/class/net/ 2>/dev/null', { stdio: 'pipe' }).toString();
      const matches = output.match(/\b(can\d+|vcan\d+|slcan\d+)\b/g);
      if (matches) for (const iface of [...new Set(matches)])
        interfaces.push({ name: iface, type: iface.startsWith('vcan') ? 'virtual' : 'hardware' });
    } catch (e) {}
  }
  try {
    const ports = await SerialPort.list();
    for (const p of ports)
      if (p.manufacturer && (p.manufacturer.toLowerCase().includes('peak') || p.manufacturer.toLowerCase().includes('lawicel') || p.manufacturer.toLowerCase().includes('canable')))
        interfaces.push({ name: p.path, type: 'slcan', manufacturer: p.manufacturer });
  } catch (e) {}
  ws.send(JSON.stringify({ type: 'canInterfaces', interfaces, platform: process.platform, timestamp: Date.now() }));
}

async function handleTestConnection(ws, client, config) {
  const params = config || {};
  const startTime = Date.now();
  let connected = false, readOk = false, readValue = null, connectTime = null;
  try {
    if (client.isOpen) { client.close(() => {}); await new Promise(r => setTimeout(r, 100)); }
    if (params.commType === 'modbus_tcp') {
      const t = Date.now();
      await client.connectTCP(params.tcpHost, { port: params.tcpPort || 502 });
      connectTime = Date.now() - t; connected = true;
    } else if (params.commType === 'modbus_rtu' || params.commType === 'modbus_rtu_serial') {
      const t = Date.now();
      await client.connectRTUBuffered(params.serialPort, { baudRate: params.serialBaudRate || 9600, dataBits: params.serialDataBits || 8, stopBits: params.serialStopBits || 1, parity: params.serialParity || 'none' });
      connectTime = Date.now() - t; connected = true;
    }
    client.setTimeout(params.modbusTimeout || 1000);
    client.setID(params.modbusAddress || 1);
    const data = await client.readHoldingRegisters(0, 1);
    readOk = true; readValue = data.data[0];
    ws.send(JSON.stringify({
      type: 'testConnectionResult', success: true, latencyMs: Date.now() - startTime,
      connected: true, readOk: true, message: `Comunicação estabelecida! Registrador 0 = ${readValue}`,
      connectTimeMs: connectTime, totalTimeMs: Date.now() - startTime, readValue,
      details: { commType: params.commType, target: params.commType === 'modbus_tcp' ? `${params.tcpHost}:${params.tcpPort || 502}` : `${params.serialPort} @ ${params.serialBaudRate || 9600}bps`, unitId: params.modbusAddress || 1, register: 0, registerType: 'holding' },
      timestamp: Date.now()
    }));
  } catch (err) {
    ws.send(JSON.stringify({
      type: 'testConnectionResult', success: false, latencyMs: Date.now() - startTime,
      error: err.message, connected, readOk: false, message: connected ? `Conectado, mas falha na leitura: ${err.message}` : `Falha na conexão: ${err.message}`,
      connectTimeMs: connectTime, totalTimeMs: Date.now() - startTime, readValue: null,
      details: { commType: params.commType, target: params.commType === 'modbus_tcp' ? `${params.tcpHost}:${params.tcpPort || 502}` : `${params.serialPort} @ ${params.serialBaudRate || 9600}bps`, unitId: params.modbusAddress || 1 },
      timestamp: Date.now()
    }));
  }
}

async function handleTestCanConnection(ws, clientId, config) {
  const startTime = Date.now();
  const existing = canClients.get(clientId);
  if (existing) { existing.close(); canClients.delete(clientId); }
  const canClient = new CANopenClient(config);
  try {
    await canClient.connect();
    canClients.set(clientId, canClient);
    const profileDef = CAN_PROFILES[config.canProfile || 'canopen_vacon_nx'];
    let testResult = null, testError = null;
    if (profileDef && profileDef.registers.length > 0) {
      const firstReg = profileDef.registers[0];
      try {
        if (profileDef.nmt) await canClient.sendNMT(0x01);
        const rawValue = await canClient.readSDO(firstReg.index, firstReg.subIndex);
        const value = firstReg.scaleFactor ? rawValue * firstReg.scaleFactor : rawValue;
        testResult = { name: firstReg.name, value: Math.round(value * 100) / 100, unit: firstReg.unit };
      } catch (e) { testError = e.message; }
    }
    ws.send(JSON.stringify({
      type: 'testConnectionResult', success: !testError, latencyMs: Date.now() - startTime,
      connected: true, readOk: !testError,
      message: testError ? `CAN conectado, mas falha SDO: ${testError}` : `CAN conectado! ${testResult ? `${testResult.name} = ${testResult.value} ${testResult.unit}` : 'Interface OK'}`,
      connectTimeMs: Date.now() - startTime, totalTimeMs: Date.now() - startTime, readValue: testResult ? testResult.value : null,
      details: { commType: config.commType, target: `${config.canInterface} @ ${config.canBitrate || 500}kbps`, unitId: config.canNodeId || 1, profile: profileDef ? profileDef.name : config.canProfile, platform: process.platform, simulationMode: canClient._simulationMode },
      timestamp: Date.now()
    }));
  } catch (err) {
    ws.send(JSON.stringify({
      type: 'testConnectionResult', success: false, latencyMs: Date.now() - startTime,
      error: err.message, connected: false, readOk: false, message: `Falha na conexão CAN: ${err.message}`,
      connectTimeMs: null, totalTimeMs: Date.now() - startTime, readValue: null,
      details: { commType: config.commType, target: `${config.canInterface} @ ${config.canBitrate || 500}kbps`, platform: process.platform, hint: process.platform === 'win32' ? 'Use o formato SLCAN (ex: COM3). Instale os drivers do adaptador USB-CAN.' : 'Verifique se o adaptador USB-CAN está conectado (ip link show).' },
      timestamp: Date.now()
    }));
  }
}

async function handleReadRegisters(ws, client, params) {
  try {
    if (!client.isOpen) throw new Error('Cliente Modbus não está conectado');
    client.setID(params.unitId || 1); client.setTimeout(params.timeout || 1000);
    let data;
    switch (params.registerType || 'holding') {
      case 'holding': data = await client.readHoldingRegisters(params.address, params.count || 1); break;
      case 'input': data = await client.readInputRegisters(params.address, params.count || 1); break;
      case 'coil': data = await client.readCoils(params.address, params.count || 1); break;
      case 'discrete': data = await client.readDiscreteInputs(params.address, params.count || 1); break;
      default: throw new Error(`Tipo inválido: ${params.registerType}`);
    }
    ws.send(JSON.stringify({ type: 'readResult', success: true, values: data.data, timestamp: Date.now() }));
  } catch (err) {
    ws.send(JSON.stringify({ type: 'readResult', success: false, error: err.message, timestamp: Date.now() }));
  }
}

async function handleWriteRegister(ws, client, params) {
  try {
    if (!client.isOpen) throw new Error('Cliente Modbus não está conectado');
    client.setID(params.unitId || 1); client.setTimeout(params.timeout || 1000);
    if (params.registerType === 'holding') await client.writeRegister(params.address, params.value);
    else if (params.registerType === 'coil') await client.writeCoil(params.address, params.value);
    else throw new Error(`Tipo não suporta escrita: ${params.registerType}`);
    ws.send(JSON.stringify({ type: 'writeResult', success: true, timestamp: Date.now() }));
  } catch (err) {
    ws.send(JSON.stringify({ type: 'writeResult', success: false, error: err.message, timestamp: Date.now() }));
  }
}

async function handleStartPolling(ws, client, clientId, config, registers) {
  try {
    handleStopPolling(clientId);
    if (client.isOpen) { client.close(() => {}); await new Promise(r => setTimeout(r, 100)); }
    if (config.commType === 'modbus_tcp') {
      await client.connectTCP(config.tcpHost, { port: config.tcpPort || 502 });
    } else if (config.commType === 'modbus_rtu' || config.commType === 'modbus_rtu_serial') {
      await client.connectRTUBuffered(config.serialPort, { baudRate: config.serialBaudRate || 9600, dataBits: config.serialDataBits || 8, stopBits: config.serialStopBits || 1, parity: config.serialParity || 'none' });
    }
    client.setTimeout(config.modbusTimeout || 1000);
    client.setID(config.modbusAddress || 1);
    const interval = setInterval(async () => {
      try {
        const readings = [];
        for (const reg of registers) {
          try {
            let data;
            switch (reg.registerType || 'holding') {
              case 'holding': data = await client.readHoldingRegisters(reg.address, 1); break;
              case 'input': data = await client.readInputRegisters(reg.address, 1); break;
              case 'coil': data = await client.readCoils(reg.address, 1); break;
              case 'discrete': data = await client.readDiscreteInputs(reg.address, 1); break;
              default: throw new Error(`Tipo inválido: ${reg.registerType}`);
            }
            const rawValue = data.data[0];
            const value = reg.multiplier && reg.multiplier !== 1 ? rawValue * reg.multiplier : rawValue;
            readings.push({ registerId: reg.id, address: reg.address, registerType: reg.registerType || 'holding', rawValue, value, isError: false, error: null });
          } catch (regErr) {
            readings.push({ registerId: reg.id, address: reg.address, registerType: reg.registerType || 'holding', rawValue: null, value: null, isError: true, error: regErr.message });
          }
        }
        ws.send(JSON.stringify({ type: 'pollingData', readings, timestamp: Date.now() }));
      } catch (err) {
        ws.send(JSON.stringify({ type: 'pollingError', error: err.message, timestamp: Date.now() }));
      }
    }, config.pollingInterval || 1000);
    pollingIntervals.set(clientId, interval);
    ws.send(JSON.stringify({ type: 'pollingStarted', success: true, registerCount: registers.length, interval: config.pollingInterval || 1000, timestamp: Date.now() }));
  } catch (err) {
    ws.send(JSON.stringify({ type: 'pollingStarted', success: false, error: err.message, timestamp: Date.now() }));
  }
}

async function handleStartCanPolling(ws, clientId, config) {
  try {
    handleStopPolling(clientId);
    let canClient = canClients.get(clientId);
    if (!canClient || !canClient.isOpen) {
      canClient = new CANopenClient(config);
      await canClient.connect();
      canClients.set(clientId, canClient);
    }
    const profileDef = CAN_PROFILES[config.canProfile || 'canopen_vacon_nx'];
    if (!profileDef) throw new Error(`Perfil CAN desconhecido: ${config.canProfile}`);
    if (profileDef.nmt) await canClient.sendNMT(0x01);
    const interval = setInterval(async () => {
      try {
        const readings = await canClient.readProfile();
        const formattedReadings = readings.map((r, i) => ({
          registerId: r.id, address: i, registerType: 'can_sdo',
          rawValue: r.rawValue, value: r.value, name: r.name, unit: r.unit,
          isError: r.isError, error: r.error
        }));
        ws.send(JSON.stringify({ type: 'pollingData', readings: formattedReadings, canProfile: config.canProfile, timestamp: Date.now() }));
      } catch (err) {
        ws.send(JSON.stringify({ type: 'pollingError', error: err.message, timestamp: Date.now() }));
      }
    }, config.pollingInterval || 2000);
    pollingIntervals.set(clientId, interval);
    ws.send(JSON.stringify({
      type: 'pollingStarted', success: true, registerCount: profileDef.registers.length,
      interval: config.pollingInterval || 2000, profile: profileDef.name,
      registers: profileDef.registers.map(r => ({ id: r.id, name: r.name, unit: r.unit })),
      timestamp: Date.now()
    }));
  } catch (err) {
    ws.send(JSON.stringify({ type: 'pollingStarted', success: false, error: err.message, timestamp: Date.now() }));
  }
}

function handleGetCanProfile(ws, profileName) {
  const profileDef = CAN_PROFILES[profileName];
  if (!profileDef) { ws.send(JSON.stringify({ type: 'canProfile', success: false, error: `Perfil desconhecido: ${profileName}` })); return; }
  ws.send(JSON.stringify({ type: 'canProfile', success: true, profile: profileName, name: profileDef.name, registers: profileDef.registers.map(r => ({ id: r.id, name: r.name, unit: r.unit })), timestamp: Date.now() }));
}

function handleStopPolling(clientId) {
  const interval = pollingIntervals.get(clientId);
  if (interval) { clearInterval(interval); pollingIntervals.delete(clientId); console.log(`[${clientId}] Polling parado`); }
}

process.on('uncaughtException', (err) => console.error('Erro não capturado:', err));
process.on('unhandledRejection', (reason) => console.error('Promise rejeitada:', reason));

console.log('✓ Agente pronto para receber comandos');
console.log('✓ Suporte: Modbus TCP | Modbus RTU Serial | CANopen | CAN Raw\n');
