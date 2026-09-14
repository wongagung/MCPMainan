[CmdletBinding()]
param([switch]$KeepBackups)
$ErrorActionPreference = 'Stop'
$PluginTarget = Join-Path $env:LOCALAPPDATA 'Roblox\Plugins\RobloxUniversalMCP.lua'
if (Test-Path $PluginTarget) {
    Remove-Item $PluginTarget -Force
    Write-Host "Removed $PluginTarget" -ForegroundColor Green
}
Write-Host 'MCP config entries are intentionally left untouched.' -ForegroundColor Yellow
Write-Host 'Remove the roblox-universal entry from your AI client configs if desired.' -ForegroundColor Yellow
if (-not $KeepBackups) { Write-Host 'Installer backups were kept for safety.' -ForegroundColor DarkGray }
