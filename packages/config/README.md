# @8f4e/config

Centralized tooling configuration for the 8f4e workspace.

This package provides shared configuration helpers that allow packages to maintain thin local config files while sharing common defaults across the workspace.

## Usage

### TypeScript Configuration

Import TypeScript configuration helpers in your package:

```ts
// In your package's vitest.config.ts or other tool config
import { baseCompilerOptions, libBuildOptions, libs } from '@8f4e/config/ts';
```

Your `tsconfig.json` can use these patterns:

- **Node library** (no DOM): `lib: libs.node`
- **Browser/DOM package**: `lib: libs.dom`
- **Web worker package**: `lib: libs.webworker`

### Vitest Configuration

```ts
import { defineConfig } from 'vitest/config';
import { createNodePreset } from '@8f4e/config/vitest';

export default defineConfig(
	createNodePreset({
		include: ['tests/**/*.test.ts'],
		typecheckEnabled: true,
	})
);
```

Available presets:
- `createNodePreset()` - For packages without DOM APIs
- `createJsdomPreset()` - For packages that need DOM APIs in tests
- `createPreset()` - Generic preset with full customization

### Vite Configuration

```ts
import { defineConfig } from 'vite';
import { createEsLibConfig } from '@8f4e/config/vite';

export default defineConfig(createEsLibConfig('./src/index.ts'));
```

Available helpers:
- `createEsLibConfig()` - Simple ES module library
- `createLibConfig()` - Full customization
- `createUmdBundleConfig()` - UMD bundle for browsers
- `createWorkerLibConfig()` - Web worker library

### ESLint Configuration

```js
const { createEslintConfig } = require('@8f4e/config/eslint');

module.exports = createEslintConfig({ root: true });
```

Or use individual exports:
- `sharedRules` - Shared rule configuration
- `prettierOptions` - Prettier settings
- `importOrderRule` - Import ordering rules

## Philosophy

Only **shared/common defaults** should live in `@8f4e/config`. Package-specific behavior (custom aliases, environment tweaks, include/exclude patterns, etc.) should stay in each package's own config wrapper.

This keeps packages self-contained while avoiding heavy configuration duplication.
