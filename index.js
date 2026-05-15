#!/usr/bin/env node

const WebSocket = require('ws');
const ModbusRTU = require('modbus-serial');
const { SerialPort } = require('serialport');

const PORT = 9090;
const VERSION = '1.0.0';

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   InterTeste Agent v${VERSION}                              ║
║   Interface Automação - Agente Local Modbus              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

// WebSocket Server
const wss = new WebSocket.Server({ port: PORT });
console.log(`✓ Servidor WebSocket iniciado na porta ${PORT}`);
console.log(`✓ Aguardando conexões do InterTeste...\n`);

// Active Modbus clients (one per connection)
const modbusClients = new Map();

wss.on('connection', (ws) => {
  const clientId = Math.random().toString(36).substring(7);
  console.log(`[${new Date().toISOString()}] Cliente conectado: ${clientId}`);
  
  // Create Modbus client for this connection
  const client = new ModbusRTU();
  modbusClients.set(clientId, client);

  // Send welcome message with version
  ws.send(JSON.stringify({ 
    type: 'welcome', 
    version: VERSION,
    updateUrl: 'https://3000-ibqrsgqxkc8m2kyrnrcvn-8ab2c96c.us2.manus.computer/admin/interteste/ajuda',
    timestamp: Date.now()
  }));

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`[${clientId}] Comando recebido:`, data.type);

      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;

        case 'listSerialPorts':
          await handleListSerialPorts(ws);
          break;

        case 'testConnection':
          await handleTestConnection(ws, client, data.config);
          break;

        case 'readRegisters':
          await handleReadRegisters(ws, client, data.params);
          break;

        case 'writeRegister':
          await handleWriteRegister(ws, client, data.params);
          break;

        case 'startPolling':
          await handleStartPolling(ws, client, clientId, data.config, data.registers);
          break;

        case 'stopPolling':
          handleStopPolling(clientId);
          ws.send(JSON.stringify({ type: 'pollingStopped', success: true }));
          break;

        case 'disconnect':
          handleStopPolling(clientId);
          if (client.isOpen) {
            client.close(() => {});
          }
          ws.send(JSON.stringify({ type: 'disconnected', success: true }));
          break;

        default:
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: `Comando desconhecido: ${data.type}` 
          }));
      }
    } catch (err) {
      console.error(`[${clientId}] Erro ao processar mensagem:`, err);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: err.message 
      }));
    }
  });

  ws.on('close', () => {
    console.log(`[${new Date().toISOString()}] Cliente desconectado: ${clientId}`);
    const client = modbusClients.get(clientId);
    if (client && client.isOpen) {
      client.close(() => {});
    }
    modbusClients.delete(clientId);
  });

  ws.on('error', (err) => {
    console.error(`[${clientId}] Erro WebSocket:`, err.message);
  });
});

// ==================== HANDLERS ====================

async function handleListSerialPorts(ws) {
  try {
    const ports = await SerialPort.list();
    const portList = ports.map(p => ({
      path: p.path,
      manufacturer: p.manufacturer,
      serialNumber: p.serialNumber,
      pnpId: p.pnpId,
      vendorId: p.vendorId,
      productId: p.productId
    }));
    
    ws.send(JSON.stringify({
      type: 'serialPorts',
      ports: portList,
      timestamp: Date.now()
    }));
  } catch (err) {
    ws.send(JSON.stringify({
      type: 'error',
      message: `Erro ao listar portas seriais: ${err.message}`
    }));
  }
}

async function handleTestConnection(ws, client, config) {
  const params = config || {};
  const startTime = Date.now();
  let connectTime = null;
  let readTime = null;
  let connected = false;
  let readOk = false;
  let readValue = null;
  let errorMessage = null;

  try {
    // Close previous connection if exists
    if (client.isOpen) {
      client.close(() => {});
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Connect based on type
    if (params.commType === 'modbus_tcp') {
      const connectStart = Date.now();
      await client.connectTCP(params.tcpHost, { port: params.tcpPort || 502 });
      connectTime = Date.now() - connectStart;
      connected = true;
      console.log(`✓ Conectado via TCP: ${params.tcpHost}:${params.tcpPort || 502}`);
    } 
    else if (params.commType === 'modbus_rtu' || params.commType === 'modbus_rtu_serial') {
      const connectStart = Date.now();
      await client.connectRTUBuffered(params.serialPort, {
        baudRate: params.serialBaudRate || 9600,
        dataBits: params.serialDataBits || 8,
        stopBits: params.serialStopBits || 1,
        parity: params.serialParity || 'none'
      });
      connectTime = Date.now() - connectStart;
      connected = true;
      console.log(`✓ Conectado via Serial: ${params.serialPort} @ ${params.serialBaudRate || 9600}bps`);
    }

    // Set timeout and unit ID
    client.setTimeout(params.modbusTimeout || 1000);
    client.setID(params.modbusAddress || 1);

    // Try to read holding register 0 as test
    const readStart = Date.now();
    const data = await client.readHoldingRegisters(0, 1);
    readTime = Date.now() - readStart;
    readOk = true;
    readValue = data.data[0];
    console.log(`✓ Leitura OK: registrador 0 = ${readValue}`);

    const totalTime = Date.now() - startTime;

    ws.send(JSON.stringify({
      type: 'testConnectionResult',
      success: true,
      latencyMs: totalTime,
      connected: true,
      readOk: true,
      message: `Comunicação estabelecida com sucesso! Registrador 0 = ${readValue}`,
      connectTimeMs: connectTime,
      readTimeMs: readTime,
      totalTimeMs: totalTime,
      readValue: readValue,
      details: {
        commType: params.commType,
        target: params.commType === 'modbus_tcp' 
          ? `${params.tcpHost}:${params.tcpPort || 502}` 
          : `${params.serialPort} @ ${params.serialBaudRate || 9600}bps`,
        unitId: params.modbusAddress || 1,
        register: 0,
        registerType: 'holding'
      },
      timestamp: Date.now()
    }));

  } catch (err) {
    errorMessage = err.message;
    const totalTime = Date.now() - startTime;
    
    console.error(`✗ Erro no teste: ${errorMessage}`);

    ws.send(JSON.stringify({
      type: 'testConnectionResult',
      success: false,
      latencyMs: totalTime,
      error: errorMessage,
      connected: connected,
      readOk: false,
      message: connected 
        ? `Conectado, mas falha na leitura: ${errorMessage}` 
        : `Falha na conexão: ${errorMessage}`,
      connectTimeMs: connectTime,
      readTimeMs: null,
      totalTimeMs: totalTime,
      readValue: null,
      details: {
        commType: params.commType,
        target: params.commType === 'modbus_tcp' 
          ? `${params.tcpHost}:${params.tcpPort || 502}` 
          : `${params.serialPort} @ ${params.serialBaudRate || 9600}bps`,
        unitId: params.modbusAddress || 1,
        register: 0,
        registerType: 'holding'
      },
      timestamp: Date.now()
    }));
  }
}

async function handleReadRegisters(ws, client, params) {
  try {
    if (!client.isOpen) {
      throw new Error('Cliente Modbus não está conectado');
    }

    client.setID(params.unitId || 1);
    client.setTimeout(params.timeout || 1000);

    let data;
    const registerType = params.registerType || 'holding';
    const address = params.address;
    const count = params.count || 1;

    switch (registerType) {
      case 'holding':
        data = await client.readHoldingRegisters(address, count);
        break;
      case 'input':
        data = await client.readInputRegisters(address, count);
        break;
      case 'coil':
        data = await client.readCoils(address, count);
        break;
      case 'discrete':
        data = await client.readDiscreteInputs(address, count);
        break;
      default:
        throw new Error(`Tipo de registrador inválido: ${registerType}`);
    }

    ws.send(JSON.stringify({
      type: 'readResult',
      success: true,
      values: data.data,
      timestamp: Date.now()
    }));

  } catch (err) {
    ws.send(JSON.stringify({
      type: 'readResult',
      success: false,
      error: err.message,
      timestamp: Date.now()
    }));
  }
}

async function handleWriteRegister(ws, client, params) {
  try {
    if (!client.isOpen) {
      throw new Error('Cliente Modbus não está conectado');
    }

    client.setID(params.unitId || 1);
    client.setTimeout(params.timeout || 1000);

    const registerType = params.registerType || 'holding';
    const address = params.address;
    const value = params.value;

    if (registerType === 'holding') {
      await client.writeRegister(address, value);
    } else if (registerType === 'coil') {
      await client.writeCoil(address, value);
    } else {
      throw new Error(`Tipo de registrador não suporta escrita: ${registerType}`);
    }

    ws.send(JSON.stringify({
      type: 'writeResult',
      success: true,
      timestamp: Date.now()
    }));

  } catch (err) {
    ws.send(JSON.stringify({
      type: 'writeResult',
      success: false,
      error: err.message,
      timestamp: Date.now()
    }));
  }
}

// ==================== POLLING ====================

// Store active polling intervals
const pollingIntervals = new Map();

async function handleStartPolling(ws, client, clientId, config, registers) {
  try {
    // Stop existing polling if any
    handleStopPolling(clientId);

    // Close previous connection if exists
    if (client.isOpen) {
      client.close(() => {});
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Connect based on type
    if (config.commType === 'modbus_tcp') {
      await client.connectTCP(config.tcpHost, { port: config.tcpPort || 502 });
      console.log(`[${clientId}] Conectado via TCP para polling: ${config.tcpHost}:${config.tcpPort || 502}`);
    } 
    else if (config.commType === 'modbus_rtu' || config.commType === 'modbus_rtu_serial') {
      await client.connectRTUBuffered(config.serialPort, {
        baudRate: config.serialBaudRate || 9600,
        dataBits: config.serialDataBits || 8,
        stopBits: config.serialStopBits || 1,
        parity: config.serialParity || 'none'
      });
      console.log(`[${clientId}] Conectado via Serial para polling: ${config.serialPort}`);
    }

    // Set timeout and unit ID
    client.setTimeout(config.modbusTimeout || 1000);
    client.setID(config.modbusAddress || 1);

    // Start polling loop
    const interval = setInterval(async () => {
      try {
        const readings = [];

        for (const reg of registers) {
          try {
            let data;
            const address = reg.address;
            const registerType = reg.registerType || 'holding';

            switch (registerType) {
              case 'holding':
                data = await client.readHoldingRegisters(address, 1);
                break;
              case 'input':
                data = await client.readInputRegisters(address, 1);
                break;
              case 'coil':
                data = await client.readCoils(address, 1);
                break;
              case 'discrete':
                data = await client.readDiscreteInputs(address, 1);
                break;
              default:
                throw new Error(`Tipo inválido: ${registerType}`);
            }

            const rawValue = data.data[0];
            let value = rawValue;

            // Apply multiplier if exists
            if (reg.multiplier && reg.multiplier !== 1) {
              value = rawValue * reg.multiplier;
            }

            readings.push({
              registerId: reg.id,
              address: address,
              registerType: registerType,
              rawValue: rawValue,
              value: value,
              isError: false,
              error: null
            });

          } catch (regErr) {
            readings.push({
              registerId: reg.id,
              address: reg.address,
              registerType: reg.registerType || 'holding',
              rawValue: null,
              value: null,
              isError: true,
              error: regErr.message
            });
          }
        }

        // Send readings via WebSocket
        ws.send(JSON.stringify({
          type: 'pollingData',
          readings: readings,
          timestamp: Date.now()
        }));

      } catch (err) {
        console.error(`[${clientId}] Erro no polling:`, err.message);
        ws.send(JSON.stringify({
          type: 'pollingError',
          error: err.message,
          timestamp: Date.now()
        }));
      }
    }, config.pollingInterval || 1000);

    pollingIntervals.set(clientId, interval);
    console.log(`[${clientId}] Polling iniciado (${registers.length} registradores, intervalo: ${config.pollingInterval || 1000}ms)`);

    ws.send(JSON.stringify({
      type: 'pollingStarted',
      success: true,
      registerCount: registers.length,
      interval: config.pollingInterval || 1000,
      timestamp: Date.now()
    }));

  } catch (err) {
    console.error(`[${clientId}] Erro ao iniciar polling:`, err.message);
    ws.send(JSON.stringify({
      type: 'pollingStarted',
      success: false,
      error: err.message,
      timestamp: Date.now()
    }));
  }
}

function handleStopPolling(clientId) {
  const interval = pollingIntervals.get(clientId);
  if (interval) {
    clearInterval(interval);
    pollingIntervals.delete(clientId);
    console.log(`[${clientId}] Polling parado`);
  }
}

// ==================== ERROR HANDLING ====================

process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada não tratada:', reason);
});

console.log('✓ Agente pronto para receber comandos\n');
