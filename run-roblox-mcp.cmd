@echo off
setlocal
cd /d "%~dp0server"
if not exist node_modules (
  echo Installing MCP dependencies...
  npm.cmd install --omit=dev
  if errorlevel 1 exit /b 1
)
set ROBLOX_MCP_HOST=127.0.0.1
set ROBLOX_MCP_PORT=58888
set ROBLOX_MCP_TOKEN=roblox-universal-mcp-local
node index.mjs
