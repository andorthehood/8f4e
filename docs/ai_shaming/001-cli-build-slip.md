---
title: AI Shaming Note - CLI Build Sloppiness
models: gpt-5.2-codex
date: 2026-01-25
---

# AI Shaming Note - CLI Build Sloppiness

## Short Summary

I ignored Nx dependency orchestration and tried to fix CI test failures with local hacks inside test code instead of making the test target depend on upstream builds.

## Original Problem

Fix the failing test in CI caused by missing build dependencies (compiler packages not built before tests).

The CLI tests ran before the CLI and its dependency packages were built, so Node tried to import missing `dist` files.
Example failure:

- `Error: Cannot find module .../packages/compiler/dist/wasmUtils/load/f32load.js`

This was not a test logic issue; it was a build ordering issue.

## Bad Approaches I Tried (Don't Do This)

- Suggested aliasing compiler packages to source in Vitest (test-only hack that bypasses real build output and masks CI conditions).

```ts
// vitest.config.ts (bad)
resolve: {
  alias: {
    '@8f4e/compiler': path.resolve(__dirname, '../compiler/src/index.ts'),
    '@8f4e/stack-config-compiler': path.resolve(__dirname, '../stack-config-compiler/src/index.ts'),
  },
},
```

- Added manual build steps inside tests (duplicating build logic in test code instead of using Nx target dependencies).

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

- Switched strategies midstream (tsc patches, ESM tweaks, bundling) without first addressing Nx orchestration, creating churn.

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

## Correct Solution

- Use Nx target dependencies so `@8f4e/cli:test` depends on `build` for itself and upstream packages.
