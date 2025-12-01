@echo off
SETLOCAL EnableDelayedExpansion

:: Define o título da janela
TITLE Launcher Automatizado do SIG Pilates

ECHO =================================================================
ECHO 🚀 INICIANDO SETUP E EXECUCAO DO SIG PILATES
ECHO =================================================================

:: Define o diretório raiz
SET "ROOT_DIR=%~dp0"

:: --- CONFIGURAÇÃO ---
SET "BACKEND_FOLDER=back"
SET "FRONTEND_FOLDER=front"

:: Caminhos completos
SET "BACKEND_PATH=%ROOT_DIR%%BACKEND_FOLDER%"
SET "FRONTEND_PATH=%ROOT_DIR%%FRONTEND_FOLDER%"

:: --- VERIFICAÇÃO DE PASTAS ---
IF NOT EXIST "%BACKEND_PATH%" GOTO ERRO_BACK
IF NOT EXIST "%FRONTEND_PATH%" GOTO ERRO_FRONT

:: --- PARTE 1: BACK-END ---
ECHO.
ECHO [1/2] Verificando Back-end...

:: Verifica Python
where python >nul 2>&1
IF %ERRORLEVEL% NEQ 0 GOTO ERRO_PYTHON

:: Verifica VENV
IF EXIST "%BACKEND_PATH%\venv" GOTO INICIAR_BACK

ECHO.
ECHO 📦 Criando ambiente virtual (venv)...
cd /d "%BACKEND_PATH%"
python -m venv venv
IF %ERRORLEVEL% NEQ 0 GOTO ERRO_CRIAR_VENV

ECHO 📦 Instalando dependencias...
call venv\Scripts\activate
pip install -r requirements.txt
IF %ERRORLEVEL% NEQ 0 GOTO ERRO_PIP


:INICIAR_BACK
ECHO.
ECHO 🔥 Iniciando Servidor Back-end...
:: Abre janela do Back-end
START "BACK-END (FastAPI)" cmd /k "cd /d "%BACKEND_PATH%" && call venv\Scripts\activate && alembic upgrade head && uvicorn main:app --reload"


:: --- PARTE 2: FRONT-END ---
ECHO.
ECHO [2/2] Verificando Front-end...

:: Verifica Node/NPM
where npm >nul 2>&1
IF %ERRORLEVEL% NEQ 0 GOTO ERRO_NODE

:: Verifica Node Modules
IF EXIST "%FRONTEND_PATH%\node_modules" GOTO INICIAR_FRONT

ECHO.
ECHO 📦 Instalando dependencias do Front (pode demorar)...
cd /d "%FRONTEND_PATH%"
call npm install
IF %ERRORLEVEL% NEQ 0 GOTO ERRO_NPM

:INICIAR_FRONT
ECHO.
ECHO 🔥 Iniciando Servidor Front-end...
:: Abre janela do Front-end
START "FRONT-END (React)" cmd /k "cd /d "%FRONTEND_PATH%" && npm run dev"

GOTO SUCESSO

:: --- SEÇÃO DE ERROS ---

:ERRO_BACK
color 0C
ECHO [ERRO] Pasta "%BACKEND_FOLDER%" nao encontrada.
PAUSE
GOTO END

:ERRO_FRONT
color 0C
ECHO [ERRO] Pasta "%FRONTEND_FOLDER%" nao encontrada.
PAUSE
GOTO END

:ERRO_PYTHON
color 0C
ECHO [ERRO] Python nao encontrado. Instale o Python.
PAUSE
GOTO END

:ERRO_CRIAR_VENV
color 0C
ECHO [ERRO] Falha ao criar o venv.
PAUSE
GOTO END

:ERRO_PIP
color 0C
ECHO [ERRO] Falha ao instalar dependencias do Python.
PAUSE
GOTO END

:ERRO_NODE
color 0C
ECHO [ERRO] Node.js/NPM nao encontrado. Instale o Node.js.
PAUSE
GOTO END

:ERRO_NPM
color 0C
ECHO [ERRO] Falha ao instalar dependencias do Front (npm install).
PAUSE
GOTO END

:SUCESSO
ECHO.
ECHO =================================================================
ECHO ✅ SISTEMA INICIADO COM SUCESSO!
ECHO.
ECHO As janelas dos servidores foram abertas.
ECHO Pode minimizar esta janela.
ECHO =================================================================

:END