# Migrate to Nx

## Status
- [ ] Install Nx globally
- [ ] Initialize Nx workspace
- [ ] Migrate existing packages to Nx projects
- [ ] Configure project dependencies and relationships
- [ ] Test build and development workflows
- [ ] Update CI/CD if applicable

## Description
Migrate from npm workspaces to Nx workspace while keeping Parcel as the build tool initially. This provides a foundation for the later Vite migration.

## Prerequisites
- Complete todo `013-fix-npm-ls-errors.md`
- All packages marked as private
- Clean dependency graph
- Consistent package.json structures

## Tasks

### 1. **Setup Nx Workspace**
- Install Nx CLI globally: `npm install -g nx`
- Initialize Nx workspace at root level
- Configure workspace settings in `nx.json`
- Set up project graph and dependency management

### 2. **Migrate Existing Packages**
- Convert each package in `packages/` to Nx projects
- Update package.json files to work with Nx
- Configure build targets for each project
- Set up proper project naming and organization

### 3. **Configure Build System**
- Keep Parcel as the build tool initially
- Configure Nx to use Parcel for builds
- Set up build targets and scripts
- Ensure all packages can build independently

### 4. **Project Dependencies**
- Configure project dependencies in Nx
- Set up proper import/export relationships
- Ensure no circular dependencies
- Configure project graph correctly

### 5. **Development Workflow**
- Test `nx run-many` for building multiple projects
- Test `nx affected` for incremental builds
- Verify development server functionality
- Test package linking and imports

### 6. **Cleanup and Optimization**
- Remove npm workspace configuration
- Update root package.json scripts
- Optimize Nx configuration
- Document new workflow

## Benefits
- Better project organization and dependency management
- Improved build performance with caching
- Better project graph visualization
- Foundation for Vite migration
- Enhanced development experience

## Notes
- Keep Parcel during this migration - don't change build tools yet
- Focus on getting Nx workspace stable before Vite migration
- Test thoroughly to ensure no functionality is lost
- Document any Nx-specific configurations or workflows 