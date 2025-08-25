# Import/Export Standards for Vite Compatibility

This document outlines the import/export patterns used in the 8f4e project and standards for maintaining Vite compatibility.

## ✅ Current Good Patterns

### 1. Named Exports and Imports
```typescript
// ✅ Good: Explicit named exports
export type SpriteCoordinates = { ... };
export class Engine { ... }

// ✅ Good: Named imports
import { SpriteCoordinates, Engine } from '@8f4e/2d-engine';
```

### 2. Default Exports for Components/Functions
```typescript
// ✅ Good: Default export for main functions
export default async function init(canvas: HTMLCanvasElement, project: Project, options: Partial<Options>) {
  // ...
}
```

### 3. Re-exports with Explicit Types
```typescript
// ✅ Good: Explicit re-exports
export type { Project, Options } from './state/types';
```

### 4. Cross-Package Imports
```typescript
// ✅ Good: Scoped package imports
import { CompileOptions, Module } from '@8f4e/compiler';
import { SpriteCoordinates } from '@8f4e/2d-engine';
```

### 5. Worker Imports with import.meta.url
```typescript
// ✅ Good: Modern worker imports
const workerUrl = new URL('../../../../../../packages/web-worker-midi-runtime/src/index.ts', import.meta.url);
const worker = new Worker(workerUrl, { type: 'module' });
```

### 6. Shader Imports as TypeScript Modules
```typescript
// ✅ Good: Shaders as TypeScript modules exporting strings
import textureShader from './shaders/fragmentShader';
import vertexShader from './shaders/vertexShader';

// shaders/fragmentShader.ts
export default `
precision mediump float;
// shader code...
`;
```

## ⚠️ Patterns Requiring Attention for Vite

### 1. AudioWorklet Import Pattern
```typescript
// ⚠️ Needs attention: Parcel-specific syntax
import workletBlobUrl from 'worklet:../../../../../audio-worklet-runtime/dist/index.js';
```

**Vite Alternative:** Will need to use Vite's asset import or a plugin for AudioWorklets.

## ❌ Patterns Fixed

### 1. Export * Pattern (Fixed)
```typescript
// ❌ Was problematic:
export * from './types';

// ✅ Now fixed with explicit exports:
export {
  MemoryTypes,
  type DataStructure,
  type CompiledModule,
  // ... all explicit exports
} from './types';
```

## Guidelines for Future Development

### 1. Always Use Explicit Exports
- Prefer named exports over `export *`
- Use `export type` for TypeScript type-only exports
- Be explicit about what you're exporting

### 2. Cross-Package Imports
- Use scoped package names (`@8f4e/package-name`)
- Ensure proper package.json dependencies are declared
- Use relative paths only within the same package

### 3. Asset Imports
- Shaders: Keep as TypeScript modules exporting strings
- Workers: Use `import.meta.url` with `new URL()` and `new Worker()`
- AudioWorklets: Will need Vite-specific handling (TBD during migration)

### 4. Dynamic Imports
- Use standard ES dynamic imports: `import('./module')`
- Avoid Parcel-specific import patterns

## Vite Migration Readiness

✅ **Ready:**
- All `export *` patterns fixed
- Cross-package imports working correctly
- Worker imports using modern patterns
- Shader imports compatible

⚠️ **Needs Research:**
- AudioWorklet import pattern (`worklet:` prefix)
- Asset handling for special file types

## Testing Import/Export Changes

1. Run `npm run typecheck --workspaces` to verify TypeScript
2. Run `npm run build --workspaces` to verify builds
3. Test that cross-package imports resolve correctly
4. Verify no circular dependencies exist

## Related Files

- `packages/compiler/src/index.ts` - Fixed export * pattern
- `packages/editor/src/state/effects/runtimes/audioWorkletRuntime.ts` - AudioWorklet pattern
- `packages/editor/src/state/effects/runtimes/webWorkerMIDIRuntime.ts` - Worker pattern
- `packages/2d-engine/src/shaders/` - Shader import examples