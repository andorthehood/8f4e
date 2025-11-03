---
title: 'TODO: Modularize Example Module Imports'
priority: Medium
effort: 1-2d
created: 2025-11-01
status: Completed
completed: 2025-11-01
---

# TODO: Modularize Example Module Imports

## Problem Description

- `src/examples/modules/index.ts` eagerly imports every module implementation (70+ files) into a single object, and `src/examples/registry.ts` loads that bundle via one dynamic import.
- These modules contain large embedded code strings and metadata, so the main editor bundle ships ~300 KB of content even when only a single module is needed.
- The pattern prevents tree-shaking and makes future module additions increasingly costly for initial load time and memory.

## Proposed Solution

- Replace the hand-written aggregate module with a generated manifest driven by `import.meta.glob` (or an Nx build step) that exposes lazy loaders per module without bundling their code string payloads.
- Export lightweight metadata separately (title, author, category) so the registry can list modules without forcing their heavy code blocks into the primary chunk.
- Update the registry to resolve modules on demand through the glob manifest, keeping backwards-compatible return types for existing callbacks.

## Implementation Plan

### Step 1: Audit Current Module Imports
- Measure current bundle impact and confirm consumers of `modules/index` and `loadAllModules`.
- Document required metadata to ensure lazy loading preserves existing UI behavior.

### Step 2: Introduce Glob-Based Manifest
- Use `import.meta.glob('./*.ts', { eager: false })` (or a generated TypeScript file) to create `Record<string, () => Promise<ExampleModule>>`.
- Change `loadAllModules` to build the module map on first call by iterating loaders, while keeping type safety and logging.
- Ensure tests/dev server still work by updating build outputs if necessary.

### Step 3: Separate Metadata from Heavy Payloads
- Export a lightweight metadata dictionary generated at build time (e.g. via `import.meta.glob` with `import: 'default', eager: true, as: 'metadata'`) or static JSON file.
- Update `getListOfModules` and `getModule` to consume the new metadata/loader split and add regression tests verifying lazy loading.

## Success Criteria

- [ ] Editor production bundle excludes example module code strings until the module is requested.
- [ ] `getListOfModules` still returns identical metadata while loading only the manifest/metadata layer.
- [ ] Vitest coverage or an integration test confirms lazy loading resolves modules correctly.

## Affected Components

- `src/examples/modules/index.ts` - Replace eager imports with glob-based manifest.
- `src/examples/registry.ts` - Update module loading logic to use new manifest + metadata split.
- `vite.config.ts` / Nx targets - Ensure glob usage is supported and documented.

## Risks & Considerations

- **Risk 1**: `import.meta.glob` semantics differ between Vite dev and Nx build; mitigate with shared helper and CI verification.
- **Risk 2**: Consumers relying on object identity/order might break; confirm no reliance via tests before refactor.
- **Dependencies**: Requires Vite/Nx configuration to allow glob imports in this path.
- **Breaking Changes**: None expected if loader API remains compatible.

## Related Items

- **Related**: TODO 022 (Implement Modules/Projects Lazy Loading) – broader effort; this delivers the module half with modern bundler features.

## References

- [Vite: Glob Import](https://vitejs.dev/guide/features.html#glob-import)
- [Nx Docs: Vite + import.meta.glob](https://nx.dev/recipes/vite/environment-variables-and-glob-imports)

## Notes

- Consider adding a build-time verification script that ensures every module exports metadata for the manifest.
- Track bundle size before/after to validate the intended savings; include numbers in PR notes.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
