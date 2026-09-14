# Generic MCP client configuration

Roblox Universal MCP uses standard MCP `stdio`. Any MCP-capable client can launch the same `server/index.mjs` process.

## Windows example

```json
{
  "mcpServers": {
    "roblox-universal": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": ["D:\\Roblox-Universal-MCP\\server\\index.mjs"],
      "env": {
        "ROBLOX_MCP_HOST": "127.0.0.1",
        "ROBLOX_MCP_PORT": "58888",
        "ROBLOX_MCP_TOKEN": "roblox-universal-mcp-local"
      }
    }
  }
}
```

The MCP transport is stdio. Port `58888` is only the local Node-to-Roblox-Studio bridge.

Common clients include Claude Desktop/Code, Google Antigravity, Cursor, Windsurf, Cline, Roo Code, VS Code MCP clients, and other MCP-compatible hosts. The exact config file path is client-specific.

The Windows installer writes a ready-to-use generic config to `generated-configs/installed/` after installation and attempts to configure detected clients automatically.
