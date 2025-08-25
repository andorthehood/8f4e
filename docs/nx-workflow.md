# Nx Workspace Workflow

This project now uses Nx for improved monorepo management while keeping Parcel as the build tool.

## Key Benefits

- **Intelligent Caching**: Nx caches build outputs and only rebuilds what's changed
- **Dependency Management**: Automatic build ordering based on project dependencies
- **Affected Builds**: Only rebuild projects affected by changes
- **Better Developer Experience**: Rich tooling and project graph visualization

## Available Commands

### Building

```bash
# Build all packages (uses Nx caching)
npm run build

# Build specific project
npx nx run @8f4e/compiler:build

# Build all projects with Nx
npx nx run-many --target=build

# Build only affected projects
npx nx affected --target=build --base=main
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific project
npx nx run @8f4e/compiler:test

# Run only affected tests
npx nx affected --target=test --base=main
```

### Type Checking

```bash
# Type check all projects
npm run typecheck

# Type check specific project
npx nx run @8f4e/compiler:typecheck
```

### Development

```bash
# Start development server (unchanged)
npm run dev

# Watch build for specific project
npx nx run @8f4e/compiler:dev
```

## Project Structure

All packages in `packages/` are automatically detected as Nx projects with their original names:

- `@8f4e/compiler`
- `@8f4e/2d-engine`
- `@8f4e/sprite-generator`
- `@8f4e/editor`
- `@8f4e/audio-worklet-runtime`
- `@8f4e/web-worker-midi-runtime`
- `@8f4e/web-worker-logic-runtime`
- `@8f4e/compiler-worker`

## Configuration

- **nx.json**: Main Nx configuration with caching and dependency rules
- **package.json**: Updated scripts to use Nx commands
- **Workspaces**: Still configured for package linking compatibility

## Migration Notes

- Parcel configuration unchanged
- All existing npm scripts still work
- Package.json files in packages unchanged
- TypeScript builds work exactly as before
- Dependency resolution works correctly

This setup provides the foundation for future Vite migration while improving current development experience.