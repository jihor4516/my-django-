@echo off
setlocal

set "ROOT=%~dp0"

if exist "%ROOT%email-settings.bat" call "%ROOT%email-settings.bat"

if not exist "%ROOT%.venv\Scripts\python.exe" (
  echo Virtual environment was not found.
  echo Please run setup-client.bat first.
  pause
  exit /b 1
)

"%ROOT%.venv\Scripts\python.exe" --version >nul 2>nul
if errorlevel 1 (
  echo The existing virtual environment is not valid on this machine.
  echo Please run setup-client.bat again to recreate it.
  pause
  exit /b 1
)

if not exist "%ROOT%frontend\node_modules" (
  echo Frontend packages were not found.
  echo Please run setup-client.bat first.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Please install Node.js 20 or newer, then run setup-client.bat.
  pause
  exit /b 1
)

call "%ROOT%stop-client.bat" >nul 2>nul

start "Grand Theatre Backend" cmd /k "cd /d "%ROOT%backend" && "%ROOT%.venv\Scripts\python.exe" manage.py runserver 127.0.0.1:8000"
start "Grand Theatre Frontend" cmd /k "cd /d "%ROOT%frontend" && npm run start"

timeout /t 6 >nul
start "" http://127.0.0.1:3000

echo Project started.
echo Frontend: http://127.0.0.1:3000
echo Backend:  http://127.0.0.1:8000
echo.
pause