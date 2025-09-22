# TODO: Refactor Jest Configs to ES Modules

**Priority**: 🟡  
**Estimated Effort**: 3-4 hours  
**Created**: 2024-12-07
**Status**: Completed
**Completed**: 2024-12-25

## Problem Description

The project currently uses CommonJS Jest configurations across packages, which creates inconsistency with the planned ES module standardization and Vite migration:

**Current Jest setup issues:**
- **Mixed file extensions**: Some packages use `.cjs`, others use `.js` with CommonJS syntax
- **Inconsistent transforms**: Some packages use `ts-jest`, others use `@swc/jest`
- **Module system mismatch**: CommonJS configs don't align with planned `"type": "module"` in package.json
- **Vite compatibility**: Vite is built around ES modules, so Jest should match this approach

**Current Jest configurations:**
```javascript
// packages/compiler/jest.config.cjs - uses @swc/jest
module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", { ... }],
  },
  // ...
};

// packages/editor/jest.config.cjs - uses ts-jest
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // ...
};

// packages/sprite-generator/jest.config.cjs - uses preset with ts-jest
module.exports = {
  preset: './jest-presets.cjs',
  // ...
};
```

## Proposed Solution

Standardize all Jest configurations to use ES modules and consistent transform approaches:

1. **Convert all Jest configs to ES module syntax** using `.js` files
2. **Standardize on `@swc/jest`** for consistent, fast transforms across all packages
3. **Update package.json files** to include `"type": "module"` where appropriate
4. **Ensure Jest version compatibility** with ES module support

## Implementation Plan

### Step 1: Audit current Jest configurations
- Review all packages for Jest config files
- Document current transform approaches and dependencies
- Identify packages that need `"type": "module"` updates
- Expected outcome: Complete inventory of Jest setup across packages

### Step 2: Create standardized Jest config template
- Design ES module Jest configuration template
- Choose consistent transform approach (recommend `@swc/jest`)
- Define standard test patterns and environments
- Expected outcome: Reusable Jest config template for all packages

### Step 3: Update package.json files
- Add `"type": "module"` to packages that will use ES module Jest configs
- Update Jest-related dependencies to ensure ES module compatibility
- Verify Jest version supports ES module configs (Jest 29+)
- Expected outcome: Package.json files ready for ES module Jest configs

### Step 4: Convert Jest configs to ES modules
- Rename `.cjs` files to `.js`
- Convert `module.exports` to `export default`
- Update any require() statements to import statements
- Test that Jest still runs correctly
- Expected outcome: All Jest configs use ES module syntax

### Step 5: Standardize transform approaches
- Replace `ts-jest` with `@swc/jest` where appropriate
- Update preset references to use ES module syntax
- Ensure consistent test environment settings
- Expected outcome: Unified Jest transform approach across packages

### Step 6: Test and validate
- Run `npm run test` across all packages
- Verify Jest configurations load correctly
- Check that test execution performance is maintained or improved
- Expected outcome: All tests pass with new ES module Jest configs

## Success Criteria

- [ ] All Jest config files use ES module syntax (`export default`)
- [ ] All packages use consistent transform approach (preferably `@swc/jest`)
- [ ] No `.cjs` Jest config files remain
- [ ] All tests continue to pass with new configurations
- [ ] Jest configurations are ready for `"type": "module"` packages
- [ ] Performance is maintained or improved with standardized transforms

## Affected Components

- `packages/compiler/jest.config.cjs` → `jest.config.js` with ES module syntax
- `packages/editor/jest.config.cjs` → `jest.config.js` with ES module syntax
- `packages/sprite-generator/jest.config.cjs` → `jest.config.js` with ES module syntax
- `packages/sprite-generator/jest-presets.cjs` → `jest-presets.js` with ES module syntax
- Package-level `package.json` files - add `"type": "module"`
- Jest dependencies - ensure ES module compatibility

## Risks & Considerations

- **Risk 1**: Jest ES module support may have limitations in older versions
  - Mitigation: Ensure Jest 29+ is used across all packages
- **Risk 2**: Some test environments may not work with ES modules
  - Mitigation: Test thoroughly, update test environment settings if needed
- **Risk 3**: Transform changes may affect test execution
  - Mitigation: Run comprehensive test suites, compare performance
- **Dependencies**: Should be done after package.json standardization
- **Breaking Changes**: Low risk - mostly configuration updates

## Related Items

- **Depends on**: Package.json standardization (009-standardize-package-json-fields.md)
- **Enables**: ES module package.json updates
- **Related**: TypeScript configuration updates (008-adjust-typescript-configuration.md)
- **Prepares for**: Vite migration (001-vite-migration.md)

## References

- [Jest ES Module Support](https://jestjs.io/docs/ecmascript-modules)
- [@swc/jest Documentation](https://github.com/swc-project/swc/tree/main/packages/jest)
- [Jest Configuration Documentation](https://jestjs.io/docs/configuration)
- [ES Modules in Node.js](https://nodejs.org/api/esm.html)

## Notes

- This refactoring will improve consistency across the project
- `@swc/jest` provides faster test execution than `ts-jest`
- ES module Jest configs align with modern JavaScript practices
- Consider creating a shared Jest preset package if configurations become complex
- This change will make the project more ready for Vite migration 