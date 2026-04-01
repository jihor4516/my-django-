@echo off
for %%P in (3000 8000) do (
  for /f "tokens=*" %%I in ('powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort %%P -State Listen -ErrorAction SilentlyContinue ^| Select-Object -ExpandProperty OwningProcess -Unique"') do (
    powershell -NoProfile -Command "Stop-Process -Id %%I -Force -ErrorAction SilentlyContinue" >nul 2>nul
  )
)
exit /b 0