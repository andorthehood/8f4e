# Technical Debt & Future Improvements

This directory contains documentation for planned improvements and technical debt. Each TODO item has its own file for better tracking and focused discussions.

## File Naming Convention

- **Format**: `NNN-short-description.md` (3-digit number + kebab-case description)
- **Numbers**: Sequential, starting from 001
- **Descriptions**: Brief, descriptive, using kebab-case

## Priority Levels

- 🔴 **High** - Should be addressed before major releases
- 🟡 **Medium** - Should be addressed in next development cycle
- 🟢 **Low** - Nice to have, address when convenient

## Adding New TODOs

1. **Choose next sequential number** (check existing files)
2. **Use the template**: Copy `_template.md` to `NNN-description.md`
3. **Fill in details**: Complete all sections in the template
4. **Update this README**: Add entry to the appropriate priority section
5. **Assign priority**: Use 🔴🟡🟢 indicators

## Completing TODOs

1. **Mark as completed**: Update status to "Completed" in the TODO file
2. **Move to archived folder**: Move the completed TODO file to `archived/` folder
4. **Update related TODOs**: Check if completion affects other items and update dependencies

## Template

Use `_template.md` as the starting point for new TODO items. It includes all the standard sections and formatting.

## Current TODOs

### 🟡 Medium Priority

- `055-strength-reduction-compiler-optimization.md` - Implement strength reduction optimization techniques in compiler

### 🟢 Low Priority

- `002-editor-package-type-safety.md` - Editor package type safety improvements
- `016-runtime-loading-ui.md` - Runtime loading UI improvements
- `025-separate-editor-view-layer.md` - Separate editor view layer
- `026-separate-editor-user-interactions.md` - Separate editor user interactions
- `032-editor-test-coverage-plan.md` - Editor test coverage plan
- `033-editor-state-effects-testing.md` - Editor state effects testing
- `034-editor-events-testing.md` - Editor events testing
- `035-editor-midi-testing-completion.md` - Editor MIDI testing completion
- `036-editor-config-testing-completion.md` - Editor config testing completion
- `037-editor-integration-testing-expansion.md` - Editor integration testing expansion
- `038-editor-types-testing.md` - Editor types testing
- `039-editor-test-utilities.md` - Editor test utilities
- `042-enable-runtime-only-project-execution.md` - Enable runtime-only project execution
- `048-add-2d-engine-visual-regression-tests.md` - Add 2D engine visual regression tests
- `052-simplify-cache-rendering-order.md` - Simplify cache rendering order
- `053-fix-runtime-reinitialization-on-code-change.md` - Fix runtime reinitialization on code change
- `054-benchmark-unrolled-vs-normal-loop-audio-buffer-filler.md` - Benchmark unrolled vs normal loop audio buffer filler

## Archive Process

When a TODO is completed:
1. **Update the TODO file**: Change status from "Open" to "Completed"
2. **Add completion date**: Note when the task was finished
3. **Move to archived folder**: Move the file to `todo/archived/` for historical reference
4. **Update this README**: Remove the completed item from the current TODOs section
5. **Review dependencies**: Update any other TODOs that depended on this completed item