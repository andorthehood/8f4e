# TODO: Feature Flags Configuration System

**Priority**: 🟡  
**Estimated Effort**: 2-3 days  
**Created**: 2025-08-26
**Status**: Completed  
**Completed**: 2025-08-26

## Problem Description

Currently, all editor functionality is always enabled with no way to disable specific features. This makes it difficult to create restricted editor instances for different use cases, such as view-only mode, presentation mode, or embedded editors with limited functionality.

**Current State**: All editor features are hardcoded and always active.

**Why this is a problem**: 
- No way to create restricted editor instances
- Can't disable features for security or UX reasons
- Difficult to create different editor modes (view-only, presentation, etc.)
- No configuration flexibility for different deployment scenarios
- Hard to test specific feature combinations

**Impact**: Limited editor flexibility, inability to create specialized editor instances, and reduced configurability for different use cases.

## Proposed Solution

**High-level approach**: Implement a feature flags configuration system that allows disabling/enabling specific functionality during editor instantiation.

**Key features to control**:
- **Context menu**: Ability to open right-click context menu
- **Info overlay**: Show/hide information display overlay
- **Module dragging**: Ability to drag and reposition modules
- **Screen dragging**: Ability to pan/scroll the editor viewport

**Key changes required**:
- Create feature flags configuration interface
- Implement feature flag checking throughout the codebase
- Add configuration options during editor instantiation
- Ensure graceful degradation when features are disabled
- Store feature flag configuration in global state
- Refactor existing feature flag-like functionality into unified system


**Alternative approaches considered**:
- Global configuration file (rejected - too rigid, need per-instance control)
- Runtime feature flag changes (rejected - flags should be immutable after instantiation for security)
- Configuration-time only changes (selected - allows flexibility during setup, then locks for security)

## Implementation Plan

### Step 1: Define Feature Flags Interface
- Create `packages/editor/src/config/featureFlags.ts`
- Define feature flag types and interfaces
- Create default configuration with all features enabled
- **Expected outcome**: Type-safe feature flag configuration system
- **Dependencies**: None

### Step 1.5: Audit Existing Feature Controls
- Identify existing feature flag-like functionality in global state
- Document current feature control mechanisms
- Plan refactoring approach for unified system
- **Expected outcome**: Clear understanding of existing feature controls
- **Dependencies**: Step 1 completion

**Existing feature controls found**:
- `state.options.showInfoOverlay` - Controls info overlay display (currently DEV-only)
- `state.options.isLocalStorageEnabled` - Controls localStorage functionality
- `state.graphicHelper.contextMenu.open` - Controls context menu visibility
- Viewport dragging handled in `packages/editor/src/state/effects/viewport.ts`
- Module dragging handled in `packages/editor/src/state/effects/codeBlocks/codeBlockDragger.ts`

### Step 2: Refactor Existing Feature Controls
- Refactor existing feature flag-like functionality into unified system
- Update global state to use new feature flag structure
- Ensure backward compatibility during transition
- **Expected outcome**: Unified feature flag system in global state
- **Dependencies**: Step 1.5 completion

**Refactoring targets**:
- Move `showInfoOverlay` from `state.options` to unified feature flags
- Move `isLocalStorageEnabled` from `state.options` to unified feature flags
- Integrate context menu control with feature flag system
- Maintain existing functionality during transition

### Step 3: Implement Feature Flag Checks
- Add feature flag checks in context menu system
- Implement flag checks for info overlay display
- Add flag checks for module dragging functionality
- Implement flag checks for screen/viewport dragging
- **Expected outcome**: All target features respect feature flags
- **Dependencies**: Step 2 completion

### Step 4: Editor Configuration Integration
- Modify editor instantiation to accept feature flags config
- Add configuration validation and defaults
- Implement graceful degradation for disabled features
- **Expected outcome**: Editor accepts and applies feature flag configuration
- **Dependencies**: Step 3 completion

### Step 5: UI State Management
- Update UI state to reflect disabled features
- Hide/disable UI elements for disabled functionality
- Add visual indicators for disabled features (optional)
- **Expected outcome**: UI properly reflects feature flag state
- **Dependencies**: Step 4 completion

### Step 6: Testing and Documentation
- Test various feature flag combinations
- Verify graceful degradation behavior
- Document feature flag configuration options
- **Expected outcome**: Verified feature flag system with documentation
- **Dependencies**: All previous steps

## Success Criteria

- [ ] Feature flags configuration interface is type-safe and extensible
- [ ] Context menu can be disabled via configuration
- [ ] Info overlay can be hidden via configuration
- [ ] Module dragging can be disabled via configuration
- [ ] Screen/viewport dragging can be disabled via configuration
- [ ] Editor gracefully handles disabled features
- [ ] Configuration can be set during editor instantiation
- [ ] All existing functionality preserved when features are enabled

## Affected Components

- `packages/editor/src/config/featureFlags.ts` - New feature flags configuration
- `packages/editor/src/state/effects/menu/contextMenu.ts` - Context menu functionality
- `packages/editor/src/view/drawers/` - Info overlay and UI components
- `packages/editor/src/state/effects/codeBlocks/codeBlockDragger.ts` - Module dragging logic
- `packages/editor/src/state/effects/viewport.ts` - Screen/viewport dragging
- `packages/editor/src/state/index.ts` - Editor instantiation and configuration
- `packages/editor/src/state/types.ts` - Update Options interface to remove feature flags
- `packages/editor/src/view/index.ts` - Info overlay rendering logic
- `packages/editor/src/state/effects/loader.ts` - localStorage functionality

## Risks & Considerations

- **Feature coupling**: Some features may be tightly coupled, making isolation difficult
- **Performance impact**: Feature flag checks shouldn't impact performance significantly
- **Testing complexity**: Need to test all feature flag combinations
- **Breaking changes**: Feature flag system should be additive, not breaking
- **Configuration validation**: Need robust validation for feature flag combinations

## Related Items

- **Blocks**: None currently
- **Depends on**: None (can be implemented independently)
- **Related**: Editor configuration, user experience customization, deployment flexibility

## References

- [Feature Flags Best Practices](https://featureflags.io/feature-flag-best-practices/)
- [TypeScript Configuration Patterns](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Graceful Degradation](https://developer.mozilla.org/en-US/docs/Glossary/Graceful_degradation)

## Notes

- Focus on the four specific features mentioned (context menu, info overlay, module dragging, screen dragging)
- Feature flags can be configured during instantiation/configuration phase, then become immutable
- Feature flags should be checked at the appropriate level (event handlers, render functions, etc.)
- Consider adding feature flag validation to prevent invalid combinations
- This system should be extensible for future features
- **Existing controls to integrate**: `showInfoOverlay`, `isLocalStorageEnabled`, context menu state
- **Migration strategy**: Move existing flags to unified system while maintaining backward compatibility
- **State structure**: Feature flags will be stored in `state.featureFlags` instead of scattered across different state sections

## Archive Instructions

When this TODO is completed, move it to the `archived/` folder to keep the main todo directory clean and organized. 