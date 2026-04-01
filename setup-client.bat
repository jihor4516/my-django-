@echo off
setlocal

set "ROOT=%~dp0"
set "PYTHON_CMD="

echo ========================================
echo   Grand Theatre Client Setup
echo ========================================
echo.

where py >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=py -3.12"
)

if not defined PYTHON_CMD (
  where python >nul 2>nul
  if not errorlevel 1 (
    set "PYTHON_CMD=python"
  )
)

if not defined PYTHON_CMD (
  echo Python was not found.
  echo Please install Python 3.12 and make sure it is available from Command Prompt.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Please install Node.js 20 or newer first.
  pause
  exit /b 1
)

if exist "%ROOT%.venv\Scripts\python.exe" (
  "%ROOT%.venv\Scripts\python.exe" --version >nul 2>nul
  if errorlevel 1 (
    echo Existing virtual environment is invalid on this machine. Recreating it...
    rmdir /s /q "%ROOT%.venv"
  )
)

if not exist "%ROOT%.venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  call %PYTHON_CMD% -m venv "%ROOT%.venv"
  if errorlevel 1 (
    echo Failed to create the Python virtual environment.
    pause
    exit /b 1
  )
)

echo Installing Python packages...
"%ROOT%.venv\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 (
  echo Failed to upgrade pip.
  pause
  exit /b 1
)

"%ROOT%.venv\Scripts\python.exe" -m pip install -r "%ROOT%requirements.txt"
if errorlevel 1 (
  echo Failed to install Python packages.
  pause
  exit /b 1
)

if not exist "%ROOT%email-settings.bat" if exist "%ROOT%email-settings.example.bat" (
  copy "%ROOT%email-settings.example.bat" "%ROOT%email-settings.bat" >nul
)

echo Applying database migrations...
pushd "%ROOT%backend"
"%ROOT%.venv\Scripts\python.exe" manage.py migrate
if errorlevel 1 (
  popd
  echo Failed to apply database migrations.
  pause
  exit /b 1
)
popd

echo Installing frontend packages...
pushd "%ROOT%frontend"
npm install
if errorlevel 1 (
  popd
  echo Failed to install frontend packages.
  pause
  exit /b 1
)

npm run build
if errorlevel 1 (
  popd
  echo Frontend build failed.
  pause
  exit /b 1
)
popd

echo.
echo Setup completed successfully.
echo Next step: double-click start-client.bat
echo.
pause