---
title: 'TODO: Fix Runtime Reinitialization on Code Change'
priority: High
effort: 4-6 hours
created: 2025-09-03
status: Completed
completed: 2026-02-05
---

# TODO: Fix Runtime Reinitialization on Code Change

## Problem Description

Currently, the runtime completely reinitializes every time code changes, which causes:
- Performance degradation due to unnecessary runtime destruction and recreation
- Loss of runtime state between code changes
- Poor user experience with audio glitches and interruptions
- Inefficient resource usage (Web Workers, Audio Worklets, etc.)

The issue occurs because:
1. `compiler.ts` listens to `codeChange` events and triggers recompilation
2. On successful compilation, it dispatches `buildFinished` event
3. `runtime.ts` listens to `buildFinished` and calls `initRuntime()`
4. `initRuntime()` creates a completely new runtime instance instead of syncing the existing one

## Proposed Solution

Modify the runtime initialization logic to distinguish between:
- **Initial runtime creation**: When no runtime exists or runtime type changes
- **Runtime synchronization**: When only code/settings need to be updated

Key changes:
1. Add logic to detect if runtime type has changed vs just code/settings
2. Use `syncCodeAndSettingsWithRuntime` event for code changes instead of full reinitialization
3. Only call `initRuntime()` when runtime type actually changes
4. Ensure proper cleanup and state management

## Implementation Plan

### Step 1: Analyze Current Runtime Flow
- Review `packages/editor/src/state/effects/runtime.ts` initialization logic
- Identify where `buildFinished` triggers full reinitialization
- Document current event flow and dependencies

### Step 2: Modify Runtime Effect Logic
- Add runtime type change detection in `initRuntime()`
- Implement conditional logic to use sync vs full init
- Update `changeRuntime()` to handle type changes properly
- Ensure `syncCodeAndSettingsWithRuntime` is called for code-only changes

### Step 3: Update Compiler-Runtime Integration
- Modify `compiler.ts` to dispatch appropriate events
- Ensure `buildFinished` only triggers when runtime type changes
- Add new event for code-only changes that triggers sync

### Step 4: Test Runtime Behavior
- Verify runtime persists across code changes
- Test runtime type switching still works correctly
- Ensure proper cleanup on runtime type changes
- Test all runtime types (MainThread, WebWorker, AudioWorklet, MIDI)

## Success Criteria

- [ ] Runtime no longer reinitializes on code changes
- [ ] Runtime state persists between code modifications
- [ ] Runtime type switching still works correctly
- [ ] All runtime types (MainThread, WebWorker, AudioWorklet, MIDI) behave consistently
- [ ] No performance regression in compilation or runtime switching
- [ ] Audio continuity maintained during code changes

## Affected Components

- `packages/editor/src/state/effects/runtime.ts` - Main runtime initialization logic
- `packages/editor/src/state/effects/compiler.ts` - Event dispatching for build completion
- `src/runtime-*-factory.ts` - Runtime factory functions and sync logic
- `packages/runtime-*/src/index.ts` - Runtime implementations and sync methods

## Risks & Considerations

- **Risk 1**: Breaking existing runtime switching functionality
  - *Mitigation*: Thorough testing of runtime type changes
- **Risk 2**: Memory leaks from improper cleanup
  - *Mitigation*: Ensure proper destroyer function calls
- **Risk 3**: State synchronization issues between runtime and editor
  - *Mitigation*: Verify `syncCodeAndSettingsWithRuntime` works correctly
- **Dependencies**: Requires understanding of all runtime types and their sync mechanisms
- **Breaking Changes**: None expected, this is an internal optimization

## Related Items

- **Related**: `016-runtime-loading-ui.md` - May benefit from this optimization
- **Related**: `042-enable-runtime-only-project-execution.md` - Runtime execution improvements

## References

- Current runtime effect: `packages/editor/src/state/effects/runtime.ts`
- Compiler effect: `packages/editor/src/state/effects/compiler.ts`
- Runtime factories: `src/runtime-*-factory.ts`

## Notes

- The `syncCodeAndSettingsWithRuntime` event already exists and is used by runtime factories
- Runtime factories already implement proper sync logic via this event
- Main issue is that `buildFinished` always triggers full reinitialization
- Need to distinguish between "new runtime needed" vs "sync existing runtime"

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
