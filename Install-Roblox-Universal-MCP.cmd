@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0installer\Install-Roblox-Universal-MCP.ps1"
if errorlevel 1 (
  echo.
  echo Installation gagal. Lihat pesan di atas.
  pause
  exit /b 1
)
echo.
echo Roblox Universal MCP berhasil di-install.
pause
