---
title: Agent Failure Note – Custom Build Abstraction Instead of Standard Vite External
agent: Codex App Version 26.309.31024 (962)
model: gpt-5.4 (medium)
date: 2026-03-17
---

# Agent Failure Note – Custom Build Abstraction Instead of Standard Vite External

## Short Summary

When fixing duplicated code in library bundles, the agent introduced a custom shared build helper that auto-read `package.json` dependencies and externalized them implicitly. The user correctly pushed back that this was overengineered and less clear than the standard Vite library-mode approach.

## Original Problem

The same large `defaultColorScheme` object appeared twice in the final app bundle.

The real cause was that `@8f4e/editor-state` was bundling `@8f4e/sprite-generator` into its own `dist/index.js`, even though `editor-state` is an internal library inside a larger app and should preserve imports to its dependencies.

## Incorrect Fix Attempted (Anti-Pattern)

The agent modified the shared Vite helper in `packages/config/src/vite/index.ts` to:

1. read `dependencies` and `peerDependencies` from `package.json`
2. build a custom Rollup external matcher
3. apply that behavior automatically to all library builds using `createLibConfig()`

This did technically work, but it introduced extra abstraction and implicit behavior where the standard documented Vite configuration would have been simpler and clearer.

The custom code looked like this in essence:

```ts
function readPackageDependencyNames(cwd = process.cwd()): string[] {
	const packageJsonPath = resolve(cwd, 'package.json');
	if (!existsSync(packageJsonPath)) {
		return [];
	}

	const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
		dependencies?: Record<string, string>;
		peerDependencies?: Record<string, string>;
	};

	return [
		...Object.keys(packageJson.dependencies ?? {}),
		...Object.keys(packageJson.peerDependencies ?? {}),
	];
}

function createExternalMatcher(explicitExternal: string[], autoExternalizePackageDependencies: boolean) {
	const packageDependencies = autoExternalizePackageDependencies ? readPackageDependencyNames() : [];
	const externalPackages = [...new Set([...explicitExternal, ...packageDependencies])];

	return (id: string) => {
		return externalPackages.some(pkg => id === pkg || id.startsWith(`${pkg}/`));
	};
}
```

And then the helper wired it into every library build:

```ts
rollupOptions: {
	external: createExternalMatcher(external, autoExternalizePackageDependencies),
	output: rollupOutput,
}
```

This is exactly the kind of abstraction that should not be added unless there is a strong, repeated need for it.

## Failure Pattern

When there is a straightforward tool-supported configuration option, the agent invents a reusable abstraction too early instead of first using the tool in the standard explicit way.

## Correct Solution

Use the documented Vite library-mode pattern directly in the affected package config:

1. keep the shared config helper simple
2. set `build.rollupOptions.external` explicitly in the package `vite.config.ts`
3. externalize only the dependencies that the library should preserve as imports

In this case, the correct fix was to update `packages/editor/packages/editor-state/vite.config.ts` with an explicit `external` list for:

- `@8f4e/compiler`
- `@8f4e/sprite-generator`
- `@8f4e/state-manager`
- `glugglug`

The correct style is the ordinary Vite config:

```ts
const baseConfig = createLibConfig({
	entry: './src/index.ts',
	outDir: 'dist',
	formats: ['es'],
	fileName: () => 'index.js',
	emptyOutDir: false,
	external: ['@8f4e/compiler', '@8f4e/sprite-generator', '@8f4e/state-manager', 'glugglug'],
});
```

## Prevention Guideline

**Prefer Standard Tooling First**: If Vite, Rollup, Nx, TypeScript, or another core tool already has a standard explicit configuration for the problem, use that first. Do not introduce shared auto-detection or convenience abstractions unless there is a demonstrated repeated need across multiple packages and the added indirection is clearly justified.
