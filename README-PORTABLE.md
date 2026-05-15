# InterTeste Agent - Versão Portable (Windows)

Esta é a versão **portable** do InterTeste Agent, que **não requer instalação** do Node.js.

## 📦 O que está incluído

- ✅ Node.js 18 portable (embutido)
- ✅ Código-fonte do agente
- ✅ Todas as dependências necessárias
- ✅ Script de execução automática

## 🚀 Como usar

### Método 1: Duplo clique (mais fácil)

1. Extraia o arquivo ZIP para uma pasta (ex: `C:\InterTeste-Agent`)
2. **Duplo clique** em `INICIAR-AGENTE.bat`
3. Uma janela do terminal abrirá mostrando o status do agente
4. Abra o InterTeste no navegador - ele detectará automaticamente

### Método 2: Linha de comando

```cmd
cd C:\InterTeste-Agent
INICIAR-AGENTE.bat
```

## ✅ Verificação

Quando o agente iniciar com sucesso, você verá:

```
╔═══════════════════════════════════════════════════════════╗
║         InterTeste Agent - Interface Automação            ║
║                 Agente Local Modbus TCP/Serial            ║
╚═══════════════════════════════════════════════════════════╝

🚀 Iniciando agente local...

✅ InterTeste Agent v1.0.0 rodando na porta 9090
⏳ Aguardando conexão do navegador...
```

No InterTeste, você verá o badge **"🚀 Agente Local"** quando conectado.

## 🔌 Funcionalidades

- **Modbus TCP** - Comunicação via Ethernet
- **Modbus Serial** - Comunicação via RS485/RS232
- **Detecção automática** de portas COM
- **Sem instalação** - tudo incluído no ZIP

## 🛠️ Solução de Problemas

### "Node.js não está instalado"

- Esta versão portable **não precisa** de Node.js instalado
- Se aparecer este erro, verifique se extraiu **todos os arquivos** do ZIP
- Certifique-se de que a pasta `node-portable/` está presente

### "Porta 9090 já está em uso"

- Feche outras instâncias do agente
- Ou mude a porta editando `interteste-agent/index.js` (linha `const PORT = 9090`)

### Firewall bloqueia conexão

- Windows Defender pode pedir permissão na primeira execução
- Clique em **"Permitir acesso"**

## 📁 Estrutura de Arquivos

```
InterTeste-Agent/
├── INICIAR-AGENTE.bat          ← Clique aqui para iniciar
├── README-PORTABLE.md          ← Este arquivo
├── node-portable/              ← Node.js embutido
│   ├── node.exe
│   └── ...
└── interteste-agent/           ← Código do agente
    ├── index.js
    ├── package.json
    └── node_modules/
```

## 🔄 Atualização

Para atualizar para uma nova versão:

1. Baixe o novo ZIP do InterTeste
2. Extraia para uma nova pasta
3. Copie suas configurações personalizadas (se houver)
4. Execute `INICIAR-AGENTE.bat`

## 📞 Suporte

Em caso de problemas:

1. Verifique a seção **Ajuda** no InterTeste
2. Consulte os logs no terminal do agente
3. Entre em contato com o suporte da Interface Automação

---

**© 2026 Interface Automação - Todos os direitos reservados**
