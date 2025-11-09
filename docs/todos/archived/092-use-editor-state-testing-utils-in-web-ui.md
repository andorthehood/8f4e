---
title: 'TODO: Use Editor State Testing Utilities in Web-UI Tests'
priority: Medium
effort: 4-6 hours
created: 2025-11-09
status: Completed
completed: 2025-11-09
---

# TODO: Use Editor State Testing Utilities in Web-UI Tests

## Problem Description

The `@8f4e/editor-state` package exports a comprehensive set of testing utilities via `@8f4e/editor-state/testing`:
- `createMockState()` - Creates full state objects with sensible defaults
- `createMockCodeBlock()` - Creates code block graphic data with flexible parameters
- `createMockViewport()` - Creates viewport objects
- `createMockEventDispatcher()` - Creates mocked event dispatchers

Currently, the `@8f4e/web-ui` package has only screenshot tests and doesn't leverage these utilities. As unit and integration tests are added to web-ui, these utilities should be used to:
- Ensure consistency with editor-state testing patterns
- Avoid duplicating mock creation logic
- Reduce test setup boilerplate
- Maintain type safety with the state contract

Without using these utilities, web-ui tests would need to:
- Recreate similar mock generators locally
- Maintain separate test data factories
- Risk inconsistencies between packages
- Duplicate test infrastructure

## Proposed Solution

Import and use testing utilities from `@8f4e/editor-state/testing` in all web-ui unit and integration tests:
- Use `createMockState()` for component tests that need state
- Use `createMockCodeBlock()` for rendering tests involving code blocks
- Use `createMockViewport()` for viewport-related tests
- Use `createMockEventDispatcher()` for event handling tests

This establishes a pattern for other packages that depend on editor-state to reuse the same testing utilities.

## Implementation Plan

### Step 1: Add Editor State Testing Utilities to Web-UI Tests
- Import utilities from `@8f4e/editor-state/testing` in test files
- Replace any local mock creation with utility functions
- Expected outcome: Web-UI tests use centralized testing utilities

### Step 2: Document Testing Patterns in Web-UI
- Add examples to web-ui test documentation
- Document when to use each utility function
- Create guidelines for writing web-ui component tests
- Expected outcome: Clear guidance for future web-ui test development

### Step 3: Validate Package Export Configuration
- Verify `@8f4e/editor-state/testing` export works correctly
- Check TypeScript path resolution in web-ui tests
- Test utilities import and usage in Vitest
- Expected outcome: Seamless import of testing utilities

## Success Criteria

- [ ] Web-UI tests import and use `@8f4e/editor-state/testing` utilities
- [ ] No duplicate mock creation logic in web-ui tests
- [ ] Testing patterns are documented in web-ui package
- [ ] TypeScript correctly resolves testing utility imports
- [ ] All web-ui tests using utilities pass successfully
- [ ] Pattern established for other packages to follow

## Affected Components

- `packages/web-ui/src/**/__tests__/**/*.test.ts` - Unit test files
- `packages/web-ui/screenshot-tests/` - Screenshot tests (if applicable)
- `packages/web-ui/README.md` or testing docs - Documentation
- `packages/editor-state/src/testing.ts` - Source of utilities

## Risks & Considerations

- **Import Path Issues**: Need to verify package.json exports configuration supports `/testing` subpath
- **Build Dependencies**: Web-UI must build after editor-state to have utilities available
- **Test Isolation**: Ensure utilities don't create coupling between test suites
- **Vitest Configuration**: May need to adjust module resolution for testing exports
- **Documentation**: Need to make utilities discoverable to developers

## Related Items

- **Depends on**: 069 - Extract Editor State Into Dedicated Package (Completed)
- **Related**: 039 - Create Editor Test Utilities and Cross-Cutting Testing Infrastructure
- **Related**: 032 - Plan and Implement Comprehensive Test Coverage for Editor Package
- **Blocks**: Future testing work in other packages that depend on editor-state

## References

- [`packages/editor-state/src/testing.ts`](/home/andormade/8f4e/packages/editor/packages/editor-state/src/testing.ts) - Testing utilities export
- [`packages/editor-state/src/helpers/testUtils.ts`](/home/andormade/8f4e/packages/editor/packages/editor-state/src/helpers/testUtils.ts) - Utility implementations
- [Vitest Configuration](https://vitest.dev/config/) - Module resolution docs

## Notes

- This is a relatively straightforward task that establishes good testing patterns
- Should be done before adding significant unit test coverage to web-ui
- Pattern can be replicated in other packages (runtime packages, compiler-worker, etc.)
- Consider creating similar testing utilities in other core packages
- Good opportunity to validate the package export structure for testing utilities
- May need to update `package.json` exports field in editor-state if `/testing` path isn't configured

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
