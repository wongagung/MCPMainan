# Roblox Universal MCP v2.0.0

## Roblox Studio Connector

This release packages the Roblox Studio connector used by Roblox Universal MCP v2.

### Included

- `plugin/RobloxUniversalMCP.lua` — canonical connector source.
- `installer/Install-RobloxUniversalMCPPlugin.ps1` — one-command plugin installer.
- `Install-Roblox-Universal-MCP.cmd` — full Windows setup for the MCP server, bridge, client configuration and Studio plugin.
- `check-port-58888.cmd` — verifies the loopback bridge port.

### Bridge

```text
127.0.0.1:58888
```

The MCP server uses stdio for AI clients. Port `58888` is only the local loopback RPC bridge between the Node server and Roblox Studio.

### Installation

Recommended:

```bat
Install-Roblox-Universal-MCP.cmd
```

Plugin-only:

```powershell
powershell -ExecutionPolicy Bypass -File .\installer\Install-RobloxUniversalMCPPlugin.ps1
```

Restart Roblox Studio after installation.

### Compatibility

The MCP server is AI/client agnostic and can be launched by MCP-capable clients. The Studio connector itself is independent of the AI provider.

### Important

The canonical source in `plugin/RobloxUniversalMCP.lua` is the authoritative connector implementation. A binary `.rbxm` GitHub Release asset is not included in this repository release package because the active GitHub connector cannot upload binary release assets from this session.
