---
title: Agent Failure Note – CLI Build Config Drift
agent: codex-cli 0.93.0
model: gpt-5.2-codex
date: 2026-02-02
---

# Agent Failure Note – CLI Build Config Drift

## Short Summary

The agent introduced avoidable build failures by using invalid TypeScript and parser options, duplicating the CLI shebang, and adding a test-time build workaround instead of fixing build orchestration and config boundaries.

## Original Problem

A new CLI package needed a working Vite build and tests. The agent initially used an invalid TS option, later a wrong XML parser option, and kept a shebang in source while also adding a Rollup banner. When tests failed due to missing build output, the agent added a build step in the test instead of adjusting Nx target dependencies.

## Incorrect Fixes Attempted (Anti-Patterns)

- Adding unsupported compiler/parser options (e.g., TypeScript config options or XML parser flags that do not exist).
- Duplicating shebang handling (source file plus bundler banner), leading to syntax errors in the built output.
- Building inside the test suite to "make it pass" instead of expressing build ordering in Nx.
- One-off externalization logic instead of using the standard Node builtins external pattern.

Why these are wrong: they ignore official tool boundaries and create brittle local workarounds rather than fixing the root configuration and orchestration.

Examples of what went wrong:

```json
// Invalid TypeScript option: preserveShebang is not supported
{
  "compilerOptions": {
    "preserveShebang": true
  }
}
```

```ts
// Invalid fast-xml-parser option: ignoreNameSpace does not exist (v5 uses removeNSPrefix)
const parser = new XMLParser({
  ignoreNameSpace: true,
});
```

```ts
// Duplicate shebang: source + bundler banner
#!/usr/bin/env node
// ...
// rollupOptions.output.banner = '#!/usr/bin/env node'
```

```ts
// Test-time build workaround instead of Nx dependsOn
beforeAll(async () => {
  await build({ ...config });
});
```

## Failure Pattern

Treating tooling and orchestration misconfigurations as local test/code issues, leading to ad-hoc fixes.

## Correct Solution

Use valid, documented config options; ensure only one shebang source; externalize Node builtins using a standard pattern; and encode build/test ordering in `project.json` via `dependsOn: ["build"]` rather than building inside tests.
