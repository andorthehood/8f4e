---
title: 'TODO: Add Editing Feature Flag'
priority: Medium
effort: 2-3 days
created: 2025-08-27
status: Completed
completed: 2025-08-27
---

# TODO: Add Editing Feature Flag


## Problem Description

Currently, the editor lacks a comprehensive way to disable all editing functionality. While the existing feature flags system provides granular control over specific features (context menu, module dragging, viewport dragging, etc.), there's no single flag to disable all editing operations.

**Current State**: The editor has feature flags for `contextMenu`, `infoOverlay`, `moduleDragging`, `viewportDragging`, and `persistentStorage`, but no flag to control editing capabilities.

**Why this is a problem**: 
- No way to create truly view-only editor instances
- Can't disable editing for security or presentation purposes
- Difficult to create embedded viewers that prevent modifications
- No unified control over all editing operations (create, edit, delete, save)

**Impact**: Limited editor flexibility, inability to create secure view-only instances, and reduced configurability for different deployment scenarios like presentations, demos, or embedded applications.

## Proposed Solution

**High-level approach**: Extend the existing feature flags system by adding a new `editing` flag that controls all editing functionality, including code block creation, modification, deletion, and project saving.

**Key changes required**:
- Add `editing: boolean` to the FeatureFlags interface
- Implement editing flag checks throughout the editing-related code
- Update context menus to conditionally show editing options
- Ensure graceful degradation when editing is disabled
- Maintain backward compatibility with existing functionality

**Alternative approaches considered**:
- Multiple granular editing flags (rejected - too complex, single flag is sufficient)
- Runtime editing state changes (rejected - flags should be immutable after instantiation for security)
- Separate editing configuration object (rejected - existing feature flags pattern is cleaner)

## Implementation Plan

### Step 1: Extend Feature Flags Interface
- Add `editing: boolean` to `packages/editor/src/config/featureFlags.ts`
- Set default value to `true` for backward compatibility
- Update TypeScript interfaces and types
- **Expected outcome**: Type-safe editing feature flag configuration
- **Dependencies**: None

### Step 2: Implement Editing Feature Flag Checks
- Add editing flag checks in `packages/editor/src/state/effects/codeBlocks/codeBlockCreator.ts`
- Add editing flag checks in `packages/editor/src/state/effects/codeBlocks/graphicHelper.ts`
- Add editing flag checks in `packages/editor/src/state/effects/save.ts`
- Add editing flag checks in `packages/editor/src/state/effects/compiler.ts`
- **Expected outcome**: All editing operations respect the editing feature flag
- **Dependencies**: Step 1 completion

### Step 3: Update Context Menu System
- Modify `packages/editor/src/state/effects/menu/menus.ts` to conditionally show editing options
- Hide creation, deletion, and modification menu items when editing is disabled
- Maintain navigation and view-only menu items
- **Expected outcome**: Context menus properly reflect editing state
- **Dependencies**: Step 2 completion

### Step 4: Update Tests and Documentation
- Extend `packages/editor/src/config/featureFlags.test.ts` with editing flag tests
- Update `packages/editor/src/integration/featureFlags.test.ts`
- Update `docs/feature-flags.md` with new editing flag documentation
- **Expected outcome**: Comprehensive testing and documentation coverage
- **Dependencies**: Step 3 completion

### Step 5: Integration Testing
- Test view-only mode with all editing disabled
- Verify graceful degradation when editing is disabled
- Test combination of editing flag with other feature flags
- **Expected outcome**: Verified editing feature flag system
- **Dependencies**: All previous steps

## Success Criteria

- [ ] New `editing` feature flag is added to the FeatureFlags interface
- [ ] All editing operations (create, edit, delete, save) respect the editing flag
- [ ] Context menus conditionally show editing options based on the flag
- [ ] View-only mode works correctly with editing disabled
- [ ] Backward compatibility is maintained (defaults to enabled)
- [ ] Comprehensive test coverage is added
- [ ] Documentation is updated with examples

## Affected Components

- `packages/editor/src/config/featureFlags.ts` - Add editing flag to interface
- `packages/editor/src/state/effects/codeBlocks/codeBlockCreator.ts` - Add editing checks for create/delete operations
- `packages/editor/src/state/effects/codeBlocks/graphicHelper.ts` - Add editing checks for keyboard input
- `packages/editor/src/state/effects/menu/menus.ts` - Conditionally show editing menu options
- `packages/editor/src/state/effects/save.ts` - Add editing checks for save operations
- `packages/editor/src/state/effects/compiler.ts` - Add editing checks for compilation
- `docs/feature-flags.md` - Document new editing flag and usage examples

## Risks & Considerations

- **Feature coupling**: Some editing operations may be tightly coupled, requiring careful isolation
- **Performance impact**: Feature flag checks should be minimal and not impact performance
- **Testing complexity**: Need to test all editing operations with flag disabled
- **Breaking changes**: Feature flag system should be additive, not breaking
- **Menu complexity**: Context menus need to gracefully handle missing editing options

## Related Items

- **Blocks**: None currently
- **Depends on**: None (can be implemented independently)
- **Related**: Existing feature flags system, editor configuration, user experience customization

## References

- [Feature Flags Best Practices](https://featureflags.io/feature-flag-best-practices/)
- [Graceful Degradation](https://developer.mozilla.org/en-US/docs/Glossary/Graceful_degradation)
- [Existing feature flags implementation](packages/editor/src/config/featureFlags.ts)

## Notes

- The `editing` flag provides a single switch to disable all editing functionality
- Defaults to `true` to maintain full backward compatibility
- Can be combined with other feature flags for fine-tuned control
- Perfect for creating view-only instances, embedded viewers, and presentation modes
- Follows the existing, well-tested feature flags architecture pattern

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 