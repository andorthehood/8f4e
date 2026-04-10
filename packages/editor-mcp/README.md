# `@8f4e/editor-mcp`

MCP bridge for the live 8f4e editor using Playwright.

This package starts a visible Chrome session on demand and exposes a small MCP tool surface for AI copilots. It is intentionally narrower than raw browser automation: the model only sees 8f4e-specific tools, not Playwright primitives.

## Current tools

- `explain_8f4e`
  Returns a short explanation of what 8f4e is and how the MCP bridge should be used.
- `get_8f4e_manual`
  Returns the 8f4e language and editor manual from the repository docs, including instruction and directive references.
- `open_editor_session`
  Opens a visible Chrome window for the configured 8f4e editor URL and returns a `sessionId`.
- `list_code_blocks`
  Returns the current code blocks for a previously opened `sessionId`.
- `close_editor_session`
  Closes a previously opened `sessionId`.

## Session model

The expected flow is:

1. Call `open_editor_session`
2. Open or load the desired project in the visible browser window
3. Call `list_code_blocks` with the returned `sessionId`
4. Call `close_editor_session` when finished

Each session is explicit. Tool calls do not implicitly create browser windows.

## Development

Build:

```bash
npx nx run @8f4e/editor-mcp:build
```

Typecheck:

```bash
npx nx run @8f4e/editor-mcp:typecheck
```

Test:

```bash
npx nx run @8f4e/editor-mcp:test
```

## Manual run

Hosted editor:

```bash
node /Users/andorpolgar/git/8f4e/packages/editor-mcp/dist/cli.js --url https://editor.8f4e.com
```

Local dev server:

```bash
node /Users/andorpolgar/git/8f4e/packages/editor-mcp/dist/cli.js --url http://localhost:3000
```

Optional browser channel override:

```bash
node /Users/andorpolgar/git/8f4e/packages/editor-mcp/dist/cli.js --channel chromium
```

## Codex config

Example MCP config:

```toml
[mcp_servers.8f4e_editor]
command = "node"
args = [
  "/Users/andorpolgar/git/8f4e/packages/editor-mcp/dist/cli.js",
  "--url",
  "https://editor.8f4e.com"
]
enabled = true
```

After changing the package or MCP config, rebuild the package and restart your AI agent.

## Notes

- The Chrome window is headful by design so the user can interact with the editor and load projects manually.
- Playwright is an implementation detail. The MCP interface is intentionally editor-specific.
- The MCP SDK currently has expensive TypeScript inference around tool registration. The implementation uses a small `any`-typed boundary in server registration to keep the package typecheck/build stable.
