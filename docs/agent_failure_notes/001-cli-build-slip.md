---
title: Agent Failure Note - Ignoring Build Orchestration (Nx)
model: gpt-5.2-codex
agent: Codex CLI
date: 2026-01-25
---

# AI Failure Note - Ignoring Build Orchestration (Nx)

## Short Summary

The agent ignored Nx dependency orchestration and tried to fix CI test failures with local hacks inside test code instead of making the test target depend on upstream builds.

## Original Problem

Fix the failing test in CI caused by missing build dependencies (compiler packages not built before tests).

The CLI tests ran before the CLI and its dependency packages were built, so Node tried to import missing `dist` files.
Example failure:

- `Error: Cannot find module .../packages/compiler/dist/wasmUtils/load/f32load.js`

This was not a test logic issue; it was a build ordering issue.

## Bad Approaches Attempted (Don't Do This)

### Test-only environment lies

The agent suggested aliasing compiler packages to source in Vitest (a test-only hack that bypasses real build output and masks CI conditions).

```ts
// vitest.config.ts (bad)
resolve: {
  alias: {
    '@8f4e/compiler': path.resolve(__dirname, '../compiler/src/index.ts'),
    '@8f4e/stack-config-compiler': path.resolve(__dirname, '../stack-config-compiler/src/index.ts'),
  },
},
```

### Reimplementing the build system inside tests

The agent added manual build steps inside tests. This duplicates Nx’s responsibility and desynchronizes test behavior from CI orchestration.

```ts
// tests/compileProjectAudioBuffer.test.ts (bad)
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const nxBin = process.platform === 'win32' ? 'nx.cmd' : 'nx';
const nxPath = path.join(repoRoot, 'node_modules', '.bin', nxBin);
const execFileAsync = promisify(execFile);

beforeAll(async () => {
  await execFileAsync(nxPath, ['run', '@8f4e/cli:build'], { cwd: repoRoot });
});
```

### Strategy thrashing instead of root-cause fixing

The agent switched strategies midstream (tsc patches, ESM tweaks, bundling) without first addressing Nx orchestration, creating churn.

```json
// project.json (bad direction change without fixing dependsOn)
{
  "build": {
    "options": {
      "command": "vite build && tsc -p tsconfig.build.json"
    }
  }
}
```

## Failure Pattern

Treating build orchestration failures as test or runtime problems, leading to local hacks instead of fixing target dependencies.

## Correct Solution

Use Nx target dependencies so `@8f4e/cli:test` depends on `build` for itself and upstream packages.
Build order is part of the system contract and must be expressed in Nx, not encoded implicitly in test code or tooling hacks.
