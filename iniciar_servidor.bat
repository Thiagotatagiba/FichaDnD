@echo off
REM Servidor HTTP Simples - FichaDnD
REM Abra este arquivo com duplo clique para iniciar o servidor

echo.
echo ╔══════════════════════════════════════════════════╗
echo ║    Iniciando Servidor HTTP Local - FichaDnD    ║
echo ╚══════════════════════════════════════════════════╝
echo.

REM Navega para o diretório do script
cd /d "%~dp0"

REM Executa o servidor Node.js
node server.js

REM Se o servidor fechar, mostra mensagem de erro
if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ Erro ao iniciar servidor!
    echo Verifique se Node.js está instalado
    echo.
    echo Você pode:
    echo 1. Instalar Node.js: https://nodejs.org
    echo 2. Usar 'npx http-server' no PowerShell
    echo.
    pause
)
