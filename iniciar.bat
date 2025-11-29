@echo off
chcp 65001 > nul
color 0A

ECHO =================================================================
ECHO 🚀 INICIANDO SISTEMA SIG PILATES (AMBIENTE LOCAL / PORTÁTIL)
ECHO =================================================================

:: --- CONFIGURAÇÃO DOS CAMINHOS RELATIVOS ---
:: %~dp0 representa a pasta onde este arquivo .bat está salvo.

:: 1. Caminho RELATIVO do Back-end
SET BACKEND_PATH="%~dp0back"

:: 2. Caminho RELATIVO do Front-end
SET FRONTEND_PATH="%~dp0front"


:: --- VERIFICAÇÃO DE SEGURANÇA ---
IF NOT EXIST %BACKEND_PATH% (
    color 0C
    ECHO.
    ECHO ❌ ERRO: Pasta do Back-end não encontrada!
    ECHO Caminho procurado: %BACKEND_PATH%
    ECHO Verifique se o nome da pasta no script está igual ao nome real.
    PAUSE
    EXIT
)

IF NOT EXIST %FRONTEND_PATH% (
    color 0C
    ECHO.
    ECHO ❌ ERRO: Pasta do Front-end não encontrada!
    ECHO Caminho procurado: %FRONTEND_PATH%
    ECHO Verifique se o nome da pasta no script está igual ao nome real.
    PAUSE
    EXIT
)


:: --- INICIANDO O BACK-END ---
ECHO.
ECHO [1/2] 🐍 Iniciando Servidor Back-end (FastAPI)...
:: Abre nova janela, entra na pasta do back, ativa venv e roda uvicorn
start "BACK-END - SIG PILATES" cmd /k "cd /d %BACKEND_PATH% && call venv\Scripts\activate && uvicorn src.main:app --reload"


:: --- INICIANDO O FRONT-END ---
ECHO.
ECHO [2/2] ⚛️ Iniciando Servidor Front-end (React/Vite)...
:: Abre nova janela, entra na pasta do front e roda npm run dev
start "FRONT-END - SIG PILATES" cmd /k "cd /d %FRONTEND_PATH% && npm run dev"


ECHO.
ECHO =================================================================
ECHO ✅ SISTEMA INICIADO!
ECHO As janelas dos servidores foram abertas.
ECHO Pode fechar esta janela se desejar.
ECHO =================================================================
PAUSE