# Architecture

```text
Any MCP AI client
      |
      | stdio MCP
      v
Roblox Universal MCP server
      |
      | localhost RPC
      v
127.0.0.1:58888
      |
      v
Roblox Studio plugin
      +-- DataModel automation
      +-- diagnostics / Output
      +-- audits
      +-- snapshots
      +-- StudioTestService
```

The server is model/provider agnostic. Client-specific configuration only launches `server/index.mjs`.

The bridge is loopback-only and uses a shared local token for plugin RPC.
