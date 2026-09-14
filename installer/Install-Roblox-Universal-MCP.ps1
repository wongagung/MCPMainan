[CmdletBinding()]
param(
  [switch]$NoClientConfig,
  [switch]$SkipNpmInstall,
  [switch]$Force
)
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest

$Root=Split-Path -Parent $PSScriptRoot
$ServerDir=Join-Path $Root 'server'
$PluginSource=Join-Path $Root 'plugin\RobloxUniversalMCP.lua'
$PluginDir=Join-Path $env:LOCALAPPDATA 'Roblox\Plugins'
$PluginTarget=Join-Path $PluginDir 'RobloxUniversalMCP.lua'
$Port=58888
$ServerName='roblox-universal'

function Step([string]$s){Write-Host "`n[+] $s" -ForegroundColor Cyan}
function Ok([string]$s){Write-Host "    $s" -ForegroundColor Green}
function Warn([string]$s){Write-Host "    $s" -ForegroundColor Yellow}
function NodePath{
  $c=Get-Command node.exe -ErrorAction SilentlyContinue
  if($c){return $c.Source}
  foreach($p in @("$env:ProgramFiles\nodejs\node.exe","$env:LOCALAPPDATA\Programs\nodejs\node.exe")){if(Test-Path $p){return $p}}
  throw 'Node.js 20+ tidak ditemukan.'
}
function PortFree([int]$n){try{$null=Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $n -State Listen -ErrorAction Stop;return $false}catch{return $true}}
function Backup([string]$p){if(Test-Path $p){$stamp=Get-Date -Format 'yyyyMMdd-HHmmss';Copy-Item $p "$p.backup-$stamp" -Force;Ok "Backup dibuat: $p.backup-$stamp"}}
function SetMcp([string]$p,[hashtable]$entry){
  $dir=Split-Path -Parent $p;if(!(Test-Path $dir)){New-Item -ItemType Directory -Force -Path $dir|Out-Null}
  if(Test-Path $p){Backup $p;$raw=Get-Content -Raw -LiteralPath $p;if([string]::IsNullOrWhiteSpace($raw)){$cfg=[pscustomobject]@{}}else{try{$cfg=$raw|ConvertFrom-Json}catch{throw "JSON invalid: $p"}}}else{$cfg=[pscustomobject]@{}}
  if(!($cfg.PSObject.Properties.Name -contains 'mcpServers')){$cfg|Add-Member -MemberType NoteProperty -Name mcpServers -Value ([pscustomobject]@{})}
  $obj=[pscustomobject]$entry
  if($cfg.mcpServers.PSObject.Properties.Name -contains $ServerName){$cfg.mcpServers.$ServerName=$obj}else{$cfg.mcpServers|Add-Member -MemberType NoteProperty -Name $ServerName -Value $obj}
  $cfg|ConvertTo-Json -Depth 20|Set-Content -LiteralPath $p -Encoding UTF8
}

Write-Host '============================================' -ForegroundColor Magenta
Write-Host ' Roblox Universal MCP - One Click Installer ' -ForegroundColor Magenta
Write-Host ' Bridge: 127.0.0.1:58888' -ForegroundColor Magenta
Write-Host '============================================' -ForegroundColor Magenta

$node=NodePath;Ok "Node.js: $((& $node --version).Trim())"
if(-not(PortFree $Port)){
  $pid=(Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort $Port -State Listen -ErrorAction SilentlyContinue|Select-Object -First 1 -ExpandProperty OwningProcess)
  if(!$Force){throw "Port 58888 sedang dipakai PID $pid. Hentikan proses tersebut lalu ulangi installer."}
}

Step 'Install dependency + validate server'
Push-Location $ServerDir
try{
  if(-not $SkipNpmInstall){& npm.cmd install --omit=dev;if($LASTEXITCODE-ne0){throw 'npm install gagal.'}}
  & $node '--check' (Join-Path $ServerDir 'index.mjs');if($LASTEXITCODE-ne0){throw 'index.mjs syntax check gagal.'}
  & $node '--check' (Join-Path $ServerDir 'bridge.mjs');if($LASTEXITCODE-ne0){throw 'bridge.mjs syntax check gagal.'}
  Ok 'Server validation OK'
}finally{Pop-Location}

Step 'Install Roblox Studio connector'
if(!(Test-Path $PluginSource)){throw "Plugin tidak ditemukan: $PluginSource"}
if(!(Test-Path $PluginDir)){New-Item -ItemType Directory -Force -Path $PluginDir|Out-Null}
if(Test-Path $PluginTarget){Backup $PluginTarget}
Copy-Item $PluginSource $PluginTarget -Force
Ok "Plugin: $PluginTarget"

$entry=@{
  command=$node
  args=@((Join-Path $ServerDir 'index.mjs'))
  env=@{ROBLOX_MCP_HOST='127.0.0.1';ROBLOX_MCP_PORT='58888';ROBLOX_MCP_TOKEN='roblox-universal-mcp-local'}
}

if(-not $NoClientConfig){
  Step 'Detect + configure common MCP clients'
  $targets=@(
    @{Name='Claude Desktop';Path=(Join-Path $env:APPDATA 'Claude\claude_desktop_config.json');Detect=@("$env:LOCALAPPDATA\Programs\Claude\Claude.exe","$env:LOCALAPPDATA\Claude\Claude.exe")},
    @{Name='Antigravity';Path=(Join-Path $HOME '.gemini\config\mcp_config.json');Detect=@((Join-Path $HOME '.gemini'))},
    @{Name='Cursor';Path=(Join-Path $HOME '.cursor\mcp.json');Detect=@("$env:LOCALAPPDATA\Programs\cursor\Cursor.exe")},
    @{Name='Windsurf';Path=(Join-Path $HOME '.codeium\windsurf\mcp_config.json');Detect=@("$env:LOCALAPPDATA\Programs\Windsurf\Windsurf.exe")},
    @{Name='Cline';Path=(Join-Path $env:APPDATA 'Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json');Detect=@()},
    @{Name='Roo Code';Path=(Join-Path $env:APPDATA 'Code\User\globalStorage\rooveterinaryinc.roo-cline\settings\mcp_settings.json');Detect=@()}
  )
  foreach($t in $targets){
    $det=$false
    if(Test-Path $t.Path){$det=$true}else{foreach($d in $t.Detect){if($d -and (Test-Path $d)){$det=$true;break}}}
    if($det){try{SetMcp $t.Path $entry;Ok "$($t.Name): configured"}catch{Warn "$($t.Name): $($_.Exception.Message)"}}
  }
  $gen=Join-Path $Root 'generated-configs\installed';New-Item -ItemType Directory -Force -Path $gen|Out-Null
  @{mcpServers=@{$ServerName=$entry}}|ConvertTo-Json -Depth 20|Set-Content (Join-Path $gen 'roblox-universal-mcp.json') -Encoding UTF8
  @("MCP server: $ServerName","Transport: stdio","Command: $node","Args: $(Join-Path $ServerDir 'index.mjs')","Bridge: 127.0.0.1:58888")|Set-Content (Join-Path $gen 'README.txt') -Encoding UTF8
  Ok "Generic config: $gen"
}

Step 'Done'
Write-Host 'Restart AI clients and Roblox Studio.' -ForegroundColor Yellow
Write-Host 'Plugin status should show Connected on 127.0.0.1:58888.' -ForegroundColor Yellow
