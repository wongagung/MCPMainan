$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root 'plugin\RobloxUniversalMCP.lua'
$pluginDir = Join-Path $env:LOCALAPPDATA 'Roblox\Plugins'
$destination = Join-Path $pluginDir 'RobloxUniversalMCP.lua'

if (-not (Test-Path $source)) { throw "Plugin source not found: $source" }
New-Item -ItemType Directory -Force -Path $pluginDir | Out-Null
Copy-Item -Force $source $destination
Write-Host "Roblox Universal MCP plugin installed to:" -ForegroundColor Green
Write-Host $destination
Write-Host "Restart Roblox Studio, then enable the Universal MCP plugin." -ForegroundColor Yellow
