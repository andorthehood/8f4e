---
title: Agent Failure Note - Overfitted Vite chunk naming
agent: Codex App Version 26.422.71525 (2210)
model: GPT-5.5 (High)
date: 2026-04-28
---

# Agent Failure Note - Overfitted Vite chunk naming

## Short Summary

The agent tried to fix ambiguous app bundle-size matching by adding source-aware Rollup chunk naming logic to `vite.config.mjs`. That moved complexity from the bundle-size logger into the build config instead of choosing a simple output-layout convention.

## Original Problem

The release bundle-size logger failed because the app tracking regex matched several files:

```txt
assets/index-8pzTVhIO.js
assets/index-BLCmeg_3.js
assets/index-BVtffuIL.js
assets/index-BiWCi9V0.js
assets/index-Dnm9DID0.js
assets/index-DtRHdi85.js
```

The root cause was that Vite/Rollup names emitted files from source basenames, and several worker, worklet, and package entry modules are named `index.js`. The app entry was only one of several generated `index-*` files.

The intended fix was to keep the bundle-size logger simple and make generated output names less confusing.

## Anti-Patterns

- Adding custom Rollup functions that inspect `facadeModuleId` and `moduleIds` to decide per-package output names.
- Encoding package path knowledge such as `packages/compiler-worker` or `packages/runtime-audio-worklet` into the root Vite config.
- Trying to produce semantically perfect filenames for every worker and worklet when the actual requirement was only to avoid app-entry ambiguity.
- Moving Vite/Rollup internals into project config after explicitly deciding the logger should stay a simple regex matcher.

```js
// wrong direction: overfitted source-aware naming
function getOutputFileName(chunkInfo, fallbackPattern) {
	const sourceIds = [chunkInfo.facadeModuleId, ...chunkInfo.moduleIds].map(normalizeRollupId);

	if (sourceIds.some(id => id.includes('packages/compiler-worker/'))) {
		return 'assets/workers/compiler-worker-[hash].js';
	}

	return fallbackPattern;
}
```

This was brittle because it depended on Rollup chunk metadata shape, Vite query suffixes, and repository path details.

## Failure Pattern

Solving a naming-layout problem with source-aware build introspection instead of a small, stable output convention.

## Correct Solution

Use coarse static Rollup output buckets:

```js
output: {
	entryFileNames: 'assets/entries/[name]-[hash].js',
	chunkFileNames: 'assets/chunks/[name]-[hash].js',
}
```

and for workers:

```js
worker: {
	rollupOptions: {
		output: {
			entryFileNames: 'assets/workers/[name]-[hash].js',
			chunkFileNames: 'assets/workers/chunks/[name]-[hash].js',
		},
	},
}
```

Then the bundle-size config can remain a simple regex:

```json
{
	"name": "index.js",
	"pattern": "^assets/entries/index-[A-Za-z0-9_-]+\\.js$"
}
```

The important boundary is that Vite owns output layout, while the bundle-size logger only matches configured files. The build config should not need package-specific source introspection to support that boundary.
