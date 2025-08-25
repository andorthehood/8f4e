# Fix npm ls errors

## Status
- [ ] Audit current npm ls errors
- [ ] Resolve dependency conflicts
- [ ] Clean up duplicate dependencies
- [ ] Ensure consistent dependency versions across packages
- [ ] Test that all packages can build independently

## Description
Before migrating to Nx and Vite, we need to clean up dependency issues that could complicate the migration process.

## Tasks
1. **Run npm ls at root level**
   - Identify any dependency conflicts
   - Note packages with multiple versions of the same dependency
   - Check for peer dependency warnings

2. **Audit individual package dependencies**
   - Run `npm ls` in each package directory
   - Identify packages with missing or conflicting dependencies
   - Check for unused dependencies

3. **Resolve version conflicts**
   - Consolidate duplicate dependencies at root level where appropriate
   - Ensure all packages use compatible versions
   - Update packages to use consistent dependency versions

4. **Clean up package.json files**
   - Remove unused dependencies
   - Move dev dependencies to correct sections
   - Ensure consistent dependency management

5. **Mark all packages as private**
   - Add `"private": true` to all package.json files
   - Remove any `publishConfig` sections if they exist
   - Ensure no packages have `"main"` or `"module"` fields that suggest publishing

6. **Test build integrity**
   - Verify all packages can build independently
   - Check that cross-package imports work correctly
   - Ensure no circular dependencies exist

## Benefits
- Cleaner dependency graph for Nx migration
- Reduced build complexity
- Better package isolation
- Easier dependency management in Nx

## Notes
- Focus on packages that will be part of the Nx workspace
- Consider which dependencies should be hoisted vs kept at package level
- Document any special dependency requirements for specific packages 