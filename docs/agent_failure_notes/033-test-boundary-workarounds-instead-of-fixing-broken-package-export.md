---
title: Agent Failure Note – Test boundary workarounds instead of fixing broken package export
agent: Codex App Version 26.406.40811 (1457)
model: GPT-5.4 (medium)
date: 2026-04-13
---

# Agent Failure Note – Test boundary workarounds instead of fixing broken package export

## Short Summary

The agent was asked to clean up a Web UI test so it used the shared editor-state mock helpers correctly. Instead of checking whether the exported helper path actually worked through the package boundary, it tried a series of local workarounds:

- inlining a hand-built mock in the test
- adding package-local Vitest aliases to force the shared helper import to resolve
- duplicating the helper layer inside `web-ui`

All three approaches treated the symptom in the consumer package. The actual defect was in `@8f4e/editor-state`: the package exported `./testing` in `package.json`, but its build did not emit `dist/testing.js`.

## Original Problem

The test in `packages/editor/packages/web-ui/src/drawers/codeBlocks/index.test.ts` should have used the shared helpers from:

```ts
import { createMockCodeBlock, createMockState } from '@8f4e/editor-state/testing';
```

Instead, the initial change replaced that with a manual object literal. After the user pointed out that the repo already had helpers for this, the agent still did not verify the package export itself. It then tried two more wrong fixes:

- patching `web-ui`'s `vitest.config.ts` with ad hoc aliases
- creating a duplicate `createMockDrawState.ts` helper in `web-ui`

Only afterward did it inspect the package build and discover that `editor-state` was shipping `testing.d.ts` without `testing.js`.

## Anti-Patterns

- Rebuilding a typed fixture by hand in a test when the repo already has canonical mock builders.
- Modifying consumer-package module resolution to paper over a broken dependency package export.
- Duplicating test helper logic locally instead of fixing the shared helper’s packaging contract.
- Treating “make this one test pass” as the target instead of preserving the intended package boundary.
- Failing to check whether the declared export is actually backed by built runtime output.

```ts
// wrong direction: manual object instead of the shared helper
const hiddenBlock = {
	hidden: true,
	textureCacheKey: 'hidden-block',
	code: ['module hidden', 'moduleEnd'],
	// ...many more fields...
};
```

```ts
// wrong direction: force source resolution in the consumer package
resolve: {
	alias: {
		'@8f4e/editor-state/testing': '../editor-state/src/testing.ts',
		'~': '../editor-state/src',
	},
}
```

```ts
// wrong direction: duplicate helper layer in web-ui
export function createMockDrawState(...) {
	...
}
```

## Failure Pattern

Treating a broken package export as a local test problem and iterating through consumer-side workarounds instead of fixing the producer package.

## Correct Solution

The correct fix was at the package boundary:

1. verify whether `@8f4e/editor-state/testing` exists as a real built runtime artifact
2. confirm that `package.json` exports and build outputs match
3. update `@8f4e/editor-state`'s build to emit `dist/testing.js` alongside `dist/index.js`
4. keep `web-ui` tests using the shared helper import without local aliases or duplicate helpers
5. make `web-ui:test` depend on upstream builds so the package contract is available during tests

That preserves the intended ownership:

- `editor-state` owns the shared mock builders
- `web-ui` consumes them through the normal package export
- the test runner does not need one-off package-specific hacks
