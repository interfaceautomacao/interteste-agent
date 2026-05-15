# InterTeste Agent

Agente local para comunicação Modbus TCP e Modbus RTU Serial com equipamentos industriais.

## 📋 Requisitos

- Windows 10/11 ou Linux
- Porta 9090 disponível
- Para comunicação serial: drivers USB-Serial instalados

## 🚀 Como usar

### Windows

1. Baixe o arquivo `interteste-agent-win.exe`
2. Execute o arquivo (duplo clique ou via terminal)
3. O agente irá iniciar na porta 9090
4. Abra o InterTeste no navegador - ele detectará automaticamente o agente

### Linux

1. Baixe o arquivo `interteste-agent-linux`
2. Torne o arquivo executável:
   ```bash
   chmod +x interteste-agent-linux
   ```
3. Execute:
   ```bash
   ./interteste-agent-linux
   ```
4. Abra o InterTeste no navegador - ele detectará automaticamente o agente

## 🔌 Funcionalidades

✅ **Modbus TCP** - Comunicação via Ethernet com inversores na rede local  
✅ **Modbus RTU Serial** - Comunicação via RS485/RS232  
✅ **Detecção automática** de portas seriais  
✅ **Teste de conexão** em tempo real  
✅ **Leitura e escrita** de registradores  

## 🛠️ Configuração

O agente não requer configuração. Ele se comunica automaticamente com o InterTeste via WebSocket.

### Portas Seriais

O agente detecta automaticamente todas as portas seriais disponíveis (COM1, COM2, /dev/ttyUSB0, etc.).

### Modbus TCP

Configure o IP e porta do equipamento diretamente no InterTeste. O agente se conectará automaticamente.

## 🐛 Solução de Problemas

### Agente não conecta

- Verifique se a porta 9090 está disponível
- Verifique o firewall (Windows Defender, iptables)
- Execute como administrador (Windows) ou com sudo (Linux)

### Porta serial não aparece

- Verifique se os drivers USB-Serial estão instalados
- No Linux, adicione seu usuário ao grupo `dialout`:
  ```bash
  sudo usermod -a -G dialout $USER
  ```
  (reinicie a sessão após executar)

### Erro de comunicação Modbus

- Verifique endereço Modbus (Unit ID) do equipamento
- Verifique baudrate e paridade (Serial)
- Verifique IP e porta (TCP)
- Teste a conexão física (cabos, adaptadores)

## 📝 Desenvolvimento

Para desenvolvedores que desejam modificar o agente:

```bash
cd interteste-agent
npm install
npm start
```

Para gerar executáveis:

```bash
npm run build
```

## 📄 Licença

© 2026 Interface Automação - Todos os direitos reservados
