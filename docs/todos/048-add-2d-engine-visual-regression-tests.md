---
title: 'TODO: Add 2D Engine Visual Regression Tests'
priority: Medium
effort: 6-8 hours
created: 2025-08-28
status: Open
completed: null
---

# TODO: Add 2D Engine Visual Regression Tests

**Priority**: ⚠️

**NOTE**: The implementation approach for this TODO should follow the Vitest-based visual regression testing pattern established in TODO-101 (completed 2025-11-24) rather than the Jest + Puppeteer approach originally outlined below.

The 2D engine package currently lacks visual regression testing, which means:
- Rendering bugs may go undetected during refactoring
- Changes to shaders, coordinate systems, or rendering logic could break visual output
- No automated way to verify that sprite rendering, transformations, and effects work correctly
- Manual visual verification is time-consuming and error-prone
- Performance regressions in rendering pipeline may not be caught

Visual regression tests would provide confidence that the engine continues to render correctly as code evolves.

## Recommended Solution (Updated)

Implement visual regression testing for the 2D engine using **Vitest browser mode** (see TODO-101 for infrastructure):
- **Vitest + Playwright provider** for headless browser testing (Chromium only)
- **Pixel-perfect screenshot comparison** using Vitest's native snapshot system
- **Test fixtures** with known sprite sheets and rendering scenarios
- **Automated baseline generation** via `vitest --update`
- **Opt-in CI/CD integration** to control costs (not run by default)

See `packages/editor/packages/web-ui/vitest-visual-tests/` for a working prototype and pattern to follow.

## Original Proposed Solution (Deprecated)

~~Implement visual regression testing for the 2D engine using:~~
- ~~**Jest + Puppeteer** or **Playwright** for headless browser testing~~
- ~~**Pixel-perfect screenshot comparison** for rendering validation~~
- ~~**Test fixtures** with known sprite sheets and rendering scenarios~~
- ~~**Automated baseline generation** and comparison~~
- ~~**CI/CD integration** for catching visual regressions early~~

**This approach is superseded by the Vitest-based approach documented in TODO-101.**
## Implementation Plan

### Step 1: Set up visual testing infrastructure
- Install and configure Puppeteer/Playwright for headless browser testing
- Create test HTML pages for different rendering scenarios
- Set up screenshot capture and comparison utilities
- Configure Jest to handle visual test assets

### Step 2: Create basic rendering test fixtures
- Simple sprite rendering tests (single sprites, multiple sprites)
- Transform system tests (offsets, groups, scaling)
- Basic shape rendering tests (rectangles, lines)
- Test with known sprite sheets and expected outputs

### Step 3: Implement advanced rendering scenarios
- Complex transformation chains (nested groups, rotations)
- Performance tests (large numbers of sprites)
- Animation tests (time-based shader effects)
- Edge case tests (boundary conditions, extreme values)

### Step 4: Set up CI/CD integration
- Configure visual tests to run in CI pipeline
- Set up baseline image management
- Implement failure reporting with visual diffs
- Configure test result storage and comparison

## Success Criteria

- [ ] Visual regression tests run successfully in CI/CD pipeline
- [ ] Tests cover all major rendering scenarios (sprites, transforms, effects)
- [ ] Baseline images are automatically generated and maintained
- [ ] Visual diffs are generated for failed tests
- [ ] Tests can detect pixel-level rendering changes
- [ ] Performance benchmarks are included for rendering operations

## Affected Components

- `packages/editor/packages/glugglug/tests/` - Visual test directory and fixtures
- `packages/editor/packages/glugglug/package.json` - New testing dependencies
- `packages/editor/packages/glugglug/jest.config.js` - Visual testing configuration
- `packages/editor/packages/glugglug/test-fixtures/` - Test HTML pages and assets
- CI/CD pipeline configuration

## Risks & Considerations

- **Risk 1**: Platform-specific rendering differences (OS, GPU drivers)
  - **Mitigation**: Use consistent CI environment and tolerance for minor variations
- **Risk 2**: Test maintenance overhead for visual assets
  - **Mitigation**: Automate baseline generation and use semantic test descriptions
- **Risk 3**: Performance impact of visual testing
  - **Mitigation**: Run visual tests separately from unit tests, use parallel execution
- **Dependencies**: Jest configuration, headless browser setup
- **Breaking Changes**: None - tests are additive only

## Related Items

- **Blocks**: `todo/047-add-glugglug-buffer-utilities-tests.md` - Should complete unit tests first
- **Depends on**: Basic Jest setup for glugglug package
- **Related**: 
  - `todo/032-editor-test-coverage-plan.md` - General testing strategy
  - `todo/006-render-to-texture-capability.md` - Rendering features

## References

- [Puppeteer documentation](https://pptr.dev/)
- [Playwright documentation](https://playwright.dev/)
- [Jest visual regression testing](https://jestjs.io/docs/visual-regression-testing)
- [Visual testing best practices](https://www.chromium.org/developers/testing/visual-testing)

## Notes

- Visual tests should focus on rendering correctness, not exact pixel matching
- Consider using tolerance values for anti-aliasing and minor rendering variations
- Test fixtures should include both simple and complex rendering scenarios
- Performance benchmarks can be integrated with visual tests
- Baseline images should be version-controlled and reviewed with code changes

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized. 
