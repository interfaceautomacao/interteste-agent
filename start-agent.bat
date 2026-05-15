@echo off
chcp 65001 >nul
title InterTeste Agent - Interface Automação

echo.
echo ╔═══════════════════════════════════════════════════════════╗
echo ║         InterTeste Agent - Interface Automação            ║
echo ║                 Agente Local Modbus TCP/Serial            ║
echo ╚═══════════════════════════════════════════════════════════╝
echo.
echo 🚀 Iniciando agente local...
echo.

node index.js

if errorlevel 1 (
    echo.
    echo ❌ Erro ao iniciar o agente!
    echo.
    echo Possíveis causas:
    echo   - Node.js não está instalado
    echo   - Dependências não foram instaladas (execute: npm install)
    echo   - Porta 9090 já está em uso
    echo.
    pause
)
