# Technical Debt & Future Improvements

This directory contains documentation for planned improvements and technical debt. Each TODO item has its own file for better tracking and focused discussions.

## Current TODO Items

### 🔴 High Priority
- `001-vite-migration.md` - Convert from Parcel to Vite build system

### 🟡 Medium Priority  
- `002-editor-package-type-safety.md` - Enable strict TypeScript in editor package
- `003-standardize-build-scripts.md` - Consistent build commands across packages

### 🟢 Low Priority
- `004-ts-ignore-to-ts-expect-error.md` - Replace @ts-ignore with @ts-expect-error
- `005-error-handling-patterns.md` - Standardize error handling across codebase

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

1. **Mark as completed**: Move to "Completed" section below
2. **Keep the file**: For historical reference and documentation
3. **Update related TODOs**: Check if completion affects other items

## Completed Items

### ✅ Recently Completed
- None yet

## Template

Use `_template.md` as the starting point for new TODO items. It includes all the standard sections and formatting.

## Tracking

These items should be reviewed during:
- Pre-release planning
- Sprint planning  
- Architecture reviews
- Dependency update cycles 