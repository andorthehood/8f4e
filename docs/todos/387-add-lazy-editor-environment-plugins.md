---
title: 'TODO: Add lazy editor environment plugins'
priority: Medium
effort: 1-2d
created: 2026-05-01
status: Open
completed: null
---

# TODO: Add lazy editor environment plugins

## Problem Description

Some editor features subscribe to browser APIs and write external input state into 8f4e program memory. The first example is keyboard memory support:

- `@keyPressedMemory`
- `@keyCodeMemory`

The directives are resolved by editor-state, but the browser event integration is mounted unconditionally from `packages/editor/src/index.ts`. That means every project loads and initializes the keyboard-memory integration even when it does not use those directives.

This becomes more important for future integrations such as MIDI. MIDI support may need larger helper code, browser permission flows, device enumeration, port subscriptions, and message parsing. That code should not be part of the initial editor bundle unless the loaded project asks for it through editor directives.

## Proposed Solution

Introduce a lazy editor environment plugin system in `packages/editor`.

High-level design:

- Keep directive parsing and raw directive records in editor-state.
- Add a small plugin registry in editor that maps raw editor directive names to dynamic import functions.
- Scan raw parsed directive names on loaded/edited code blocks to decide which plugins should be active.
- Lazy-load a plugin only when at least one of its trigger directives is present.
- Dispose the plugin when none of its trigger directives remain.
- Let each plugin own any deeper validation, browser subscriptions, state subscriptions, and memory writes.

The registry should stay lightweight and must not import plugin implementations directly:

```ts
interface EditorEnvironmentPluginRegistryEntry {
	id: string;
	editorDirectives: string[];
	load: () => Promise<{ default: EditorEnvironmentPlugin }>;
}

interface EditorEnvironmentPlugin {
	start: (context: EditorEnvironmentPluginContext) => void | (() => void) | Promise<void | (() => void)>;
}
```

Example registry entry:

```ts
{
	id: 'keyboard-memory',
	editorDirectives: ['keyPressedMemory', 'keyCodeMemory'],
	load: () => import('./editor-environment-plugins/keyboard-memory/plugin'),
}
```

## Decisions

- Use raw parsed directive names as the activation source for now. Do not add a generic resolved-directive-name state field yet.
- Load plugins even when matching directives are malformed. The plugin can then report plugin-specific formatting errors.
- Plugin instances can subscribe to state changes themselves if they need updates. The manager does not need a generic `update()` lifecycle in the first pass.
- Guard async load races. If a directive disappears before the dynamic import resolves, the loaded plugin must not remain active.
- Use the name `editor environment plugin` to avoid overloading the existing runtime terminology.
- Migrate keyboard memory as the first plugin without changing keyboard behavior.

## Implementation Plan

### Step 1: Add plugin types and registry

- Add editor-local types for `EditorEnvironmentPlugin`, `EditorEnvironmentPluginContext`, and `EditorEnvironmentPluginRegistryEntry`.
- Add a registry file with a lazy `keyboard-memory` entry.
- Ensure the registry file imports only types and dynamic import functions, not plugin implementations.

### Step 2: Add the plugin lifecycle manager

- Create a manager in `packages/editor/src` that receives the store, event dispatcher, browser globals, and registry.
- Derive active directive names from raw `parsedDirectives` on `state.graphicHelper.codeBlocks` and selected/programmatic selected block edits.
- Start plugins whose configured directive names are present.
- Dispose plugins whose configured directive names are absent.
- Track an activation generation/token per plugin so stale async imports cannot leave a plugin active after directives disappear.
- Dispose all active plugins from editor `dispose()`.

### Step 3: Add plugin-owned error plumbing

- Add an editor-environment plugin error bucket to state, for example:

```ts
codeErrors: {
	editorEnvironmentPluginErrors: Record<string, CodeError[]>;
}
```

- Include those errors in the code-block error rendering path.
- Provide plugin context helpers so each plugin can set or clear only its own errors.
- Clear a plugin's errors when that plugin is disposed.

### Step 4: Move keyboard memory behind the plugin boundary

- Move the existing keyboard-memory browser integration out of unconditional editor startup.
- Implement the `keyboard-memory` plugin around the current `keyboardMemoryEvents` behavior.
- Remove the direct `keyboardMemoryEvents` import and unconditional call from `packages/editor/src/index.ts`.
- Keep current memory semantics:
  - `keydown` writes latest HID usage id and pressed flag
  - `keyup` restores the latest still-pressed key or clears pressed flag
  - `blur` clears the pressed flag
  - unresolved memory ids are ignored silently

### Step 5: Test the lifecycle and bundle boundary

- Unit test that the manager loads keyboard memory only when `keyPressedMemory` or `keyCodeMemory` appears.
- Unit test that the plugin is disposed when matching directives are removed.
- Unit test the async race where a directive appears, import starts, directive disappears, and the import resolves later.
- Preserve the current keyboard memory behavior tests after moving the code.
- Check the built output to confirm keyboard-memory implementation code is split out of the initial editor chunk.

## Validation Checkpoints

- `rg -n "keyboardMemoryEvents|keyPressedMemory|keyCodeMemory" packages/editor packages/editor/packages/editor-state`
- `npx nx run editor:test`
- `npx nx run editor:typecheck`
- `npx nx run app:build`
- Inspect the Vite build output to confirm the keyboard-memory plugin is emitted as a lazy chunk rather than bundled into the initial editor code.

## Success Criteria

- [ ] Projects without `@keyPressedMemory` or `@keyCodeMemory` do not load or mount keyboard-memory browser event code.
- [ ] Projects with either keyboard memory directive lazy-load the keyboard-memory plugin and preserve current behavior.
- [ ] Removing the directives disposes keyboard browser subscriptions.
- [ ] Plugin-owned errors can be surfaced and cleared without mixing them into unrelated directive/compiler/runtime error buckets.
- [ ] The plugin registry can be extended for MIDI without changing the lifecycle manager.
- [ ] The registry file remains lightweight and does not statically import plugin implementations.

## Affected Components

- `packages/editor/src/index.ts` - remove unconditional keyboard-memory setup and wire plugin manager lifecycle.
- `packages/editor/src/events/keyboardMemoryEvents.ts` - move or wrap as the first lazy plugin implementation.
- `packages/editor/src/events/keyboardMemoryEvents.test.ts` - preserve behavior coverage after the move.
- `packages/editor/packages/editor-state-types/src/index.ts` - add plugin error state shape if error bucket is added to global state.
- `packages/editor/packages/editor-state/src/pureHelpers/state/createDefaultState.ts` - add default plugin error state.
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts` - include plugin errors in rendered code-block diagnostics.

## Risks & Considerations

- **Bundle boundary leakage**: importing plugin implementation code from the registry or index file will defeat lazy loading.
- **Directive scan cost**: scanning all raw parsed directives is acceptable for the first pass, but TODO 315 may later make global directive recomputation more incremental.
- **Async races**: dynamic imports are async and cannot be cancelled, so the manager must guard stale imports explicitly.
- **Error ownership**: plugin-owned validation should not duplicate existing global directive resolution unless the plugin has custom formatting rules.
- **Module caching**: dynamic imports remove the code from the initial bundle, but loaded modules are not unloaded by the browser after first import. Disposal still needs to clean up listeners and browser resources.

## Related Items

- **Related**: `315` Optimize global editor directive recomputation
- **Related**: MIDI handling plans should use this plugin manager once implemented

## Notes

- This TODO intentionally starts with keyboard memory as a refactor, not a behavior change.
- MIDI is the motivating future plugin because it may involve permission prompts, device enumeration, and larger parsing/mapping code.
- The plugin manager should live in `packages/editor`, not editor-state, because browser APIs belong at the host/editor boundary.
