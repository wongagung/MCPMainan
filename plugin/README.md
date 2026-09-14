# Roblox Studio Connector Plugin

This folder contains the Roblox Studio side of Roblox Universal MCP.

## Install

### Automatic
Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\installer\Install-RobloxUniversalMCPPlugin.ps1
```

The installer copies `plugin/RobloxUniversalMCP.lua` into:

```text
%LOCALAPPDATA%\Roblox\Plugins
```

### Manual
Copy `plugin/RobloxUniversalMCP.lua` to:

```text
%LOCALAPPDATA%\Roblox\Plugins
```

Then restart Roblox Studio.

## What the plugin does

- Connects Studio to `127.0.0.1:58888`.
- Registers the current place/session with the MCP bridge.
- Receives MCP commands and returns results.
- Reads/writes scripts and instances.
- Reads Studio selection/tree data.
- Captures Output diagnostics.
- Runs project/performance/security/asset audits.
- Creates and restores safe snapshots.

The plugin communicates only with the loopback bridge and uses the local token configured by the MCP server.
