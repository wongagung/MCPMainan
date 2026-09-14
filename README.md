# Roblox Universal MCP

Universal, AI-agnostic MCP bridge for Roblox Studio.

```text
Claude / Antigravity / Cursor / Windsurf / Cline / Roo / VS Code / other MCP clients
                                      │
                                  MCP stdio
                                      │
                                      ▼
                         Roblox Universal MCP v2
                                      │
                             127.0.0.1:58888
                                      │
                                      ▼
                         Roblox Studio Connector
                                      │
                                      ▼
                              Roblox DataModel
```

## What is included

- Standard MCP stdio server, independent of any AI provider.
- Roblox Studio connector plugin.
- One-click Windows installer + uninstall script.
- Automatic backup before editing MCP client configs.
- Automatic configuration for detected Claude Desktop, Antigravity, Cursor, Windsurf, Cline and Roo Code setups.
- Port checker for `58888`.
- Studio tree/search/selection tooling.
- Script read/write and Instance create/delete/property tooling.
- Controlled Luau execution.
- Runtime Output and diagnostics capture.
- Project, performance, security and asset audits.
- Safe snapshots with dry-run restore.
- Programmatic Play/Run/Multiplayer tests through Studio test APIs.
- Persistent project memory and task tracking.
- Git status/diff/commit/push helpers.
- Bounded `roblox_autopilot` orchestration.

## Install on Windows

1. Clone/download this repository to a permanent folder, for example `D:\Roblox-Universal-MCP`.
2. Run `Install-Roblox-Universal-MCP.cmd` as Administrator.
3. Restart configured AI clients.
4. Restart Roblox Studio.
5. Open the **Universal MCP** plugin and wait for `Connected`.

The installer installs Node dependencies, validates the JavaScript server, copies the Studio plugin, checks port `58888`, and configures detected MCP clients without deleting unrelated MCP servers.

## Run manually

```bat
run-roblox-mcp.cmd
```

Or configure an MCP client directly with `server/index.mjs` using stdio.

## Port

```text
127.0.0.1:58888
```

The Node MCP server speaks stdio to the AI client. Port `58888` is a loopback-only RPC bridge between the Node server and the Roblox Studio plugin.

## Safety

The bridge binds to loopback and uses a shared local token. Snapshot restore is previewable with `dryRun` and does not silently delete unrelated instances. Git push is exposed as an explicit tool rather than performed automatically by normal edits.

## Repository layout

```text
server/                 MCP server + Studio bridge
plugin/                 Roblox Studio connector
installer/              Windows PowerShell installers
 generated-configs/     Generic MCP config templates
 docs/                  Installation, architecture and feature docs
run-roblox-mcp.cmd      Manual launcher
check-port-58888.cmd    Port availability checker
```

See `docs/INSTALL.md`, `docs/CLIENT-CONFIGS.md`, `docs/ARCHITECTURE.md`, and `docs/FEATURES.md` for details.
