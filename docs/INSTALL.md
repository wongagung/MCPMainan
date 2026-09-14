# Install Roblox Universal MCP

## Windows one-click installation

1. Clone/download the repository to a permanent folder, for example:

```text
D:\Roblox-Universal-MCP
```

2. Run:

```text
Install-Roblox-Universal-MCP.cmd
```

Run it as Administrator when Windows asks.

The installer:

1. Checks Node.js 20+.
2. Checks that `127.0.0.1:58888` is not occupied.
3. Runs `npm install --omit=dev` in `server/`.
4. Runs JavaScript syntax validation.
5. Installs `plugin/RobloxUniversalMCP.lua` into `%LOCALAPPDATA%\Roblox\Plugins`.
6. Backs up existing MCP JSON files before editing them.
7. Configures detected Claude Desktop, Google Antigravity, Cursor, Windsurf, Cline and Roo Code setups when their paths are present.
8. Writes a generic config to `generated-configs/installed/` for any other MCP-capable client.

## Start Roblox Studio

1. Restart Roblox Studio after installation.
2. Open the target place.
3. In Plugins, load **Universal MCP**.
4. The plugin should connect to:

```text
127.0.0.1:58888
```

5. Ask the AI to run `studio_status`.

## Manual bridge

You normally do not need to start the bridge yourself: `server/index.mjs` starts `server/bridge.mjs` when an MCP client launches the stdio server.

For manual debugging:

```bat
run-roblox-mcp.cmd
```

## Port check

```bat
check-port-58888.cmd
```

If the port is busy, the script prints the owning PID. Do not use `-Force` until you have confirmed that process belongs to this MCP installation.

## Uninstall

Run:

```text
Uninstall-Roblox-Universal-MCP.cmd
```

Uninstall removes the Studio connector and intentionally leaves AI client configuration entries untouched so your other MCP setup is not damaged. Timestamped configuration backups remain available.

## Client compatibility

The server is AI/model agnostic. Any MCP host that can launch a local stdio MCP server can use the same backend; only the client's configuration location differs.
