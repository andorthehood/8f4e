# 8f4e Stack-Oriented Programming Language

Always follow these instructions first and only search for additional context or run bash commands if the information here is incomplete or found to be in error.

## Quick Start & Build Commands

Run these commands in sequence for a fresh repository clone:

```bash
# Install dependencies - takes 19-90 seconds depending on network, NEVER CANCEL
npm install

# Build all workspace packages - takes ~12 seconds, NEVER CANCEL  
npm run build --workspaces

# Full production build - takes ~15 seconds, NEVER CANCEL
npm run build

# Run tests - takes ~2 seconds (30 tests), ~4 seconds (163 compiler tests)
npm test

# Start development server - takes ~2 seconds
npm run dev
```

**CRITICAL TIMEOUTS:**
- Set timeout to 120+ seconds for `npm install` (can vary from 19-90 seconds based on network)
- Set timeout to 60+ seconds for any build command
- Set timeout to 30+ seconds for test commands
- NEVER CANCEL builds or installs - they may appear to hang but will complete

## Project Structure

8f4e is a monorepo with 7 packages using npm workspaces:
- `@8f4e/compiler` - TypeScript compiler for the 8f4e language
- `@8f4e/editor` - Visual editor built with TypeScript and WebGL
- `@8f4e/2d-engine` - 2D rendering engine
- `@8f4e/sprite-generator` - Sprite generation utilities
- `@8f4e/audio-worklet-runtime` - Browser audio processing runtime
- `@8f4e/web-worker-midi-runtime` - Browser MIDI processing runtime
- `@8f4e/compiler-worker` - Web Worker for compilation

## Working Effectively

### Dependencies & Environment
- Node.js version: v22.15.1 (specified in `.nvmrc`)
- Uses npm workspaces for monorepo management
- TypeScript with Parcel bundler for build system
- Jest for testing with custom @swc/jest transform
- ESLint for linting with TypeScript support

### Bootstrap from Fresh Clone
```bash
# 1. Install all dependencies (NEVER CANCEL - 19-90 seconds)
npm install

# 2. Build workspace packages first (NEVER CANCEL - 12 seconds)
npm run build --workspaces

# 3. Run type checking (may have MIDI API warnings - this is normal)
npm run typecheck

# 4. Run full production build (NEVER CANCEL - 15 seconds)
npm run build
```

### Development Workflow
```bash
# Start editor development server
npm run dev
# Access at http://localhost:3000

# Start website development server (includes both editor and landing page)
npm run dev-website  
# Access at http://localhost:3000/index.html or http://localhost:3000/editor

# Run specific workspace tests
npm run test --workspaces

# Lint and auto-fix code
npm run lint
```

## Known Issues & Workarounds

### TypeScript Errors (Non-blocking)
- MIDI API types missing in browser environment - this is expected
- Errors in `webWorkerMIDIRuntime.ts` about `MIDIInput`, `MIDIOutput`, `MIDIAccess` - these do not prevent builds
- These errors occur during `npm run typecheck` but do not affect functionality

### Linting Issues
- ESLint will show warnings about `@ts-ignore` vs `@ts-expect-error` - use `npm run lint` to auto-fix most issues
- Some unused variables in test files and audio worklet runtime - these are acceptable

### Build Behavior
- `npm run build` first builds workspaces, then uses Parcel to bundle the main application
- Parcel may show "Cannot find module" errors in browser console - these are related to dynamic imports and do not affect core functionality
- The application is deployed to Netlify (check README badge for deploy status)

## Testing & Validation

### Run All Tests
```bash
# Run root project tests (~2 seconds, 30 tests)
npm test

# Run workspace tests (~4 seconds, 163 compiler tests)
npm run test --workspaces

# Run specific workspace (e.g., compiler package)
npm run test --workspace=@8f4e/compiler
```

### Validation Scenarios
After making changes, always:

1. **Build Validation**: Run `npm run build` and ensure it completes without errors
2. **Test Validation**: Run `npm test` and `npm run test --workspaces`
3. **Development Server**: Start `npm run dev` and verify it serves on localhost:3000
4. **Landing Page**: Use `npm run dev-website` and test http://localhost:3000/index.html loads
5. **Linting**: Run `npm run lint` before committing

### Browser Runtime Testing
The application provides two runtimes:
- **AudioWorkletRuntime**: For audio signal processing (requires user interaction to start)
- **WebWorkerMIDIRuntime**: For MIDI events (limited to 50Hz, not supported in Safari)

## Key Files & Locations

### Core Application
- `src/editor.html` - Main editor entry point
- `src/index.html` - Landing page
- `packages/compiler/src/` - 8f4e language compiler
- `packages/editor/src/` - Visual editor implementation

### Examples & Documentation
- `src/examples/modules/` - 70+ example 8f4e modules (audio processing, MIDI, etc.)
- `src/examples/projects/` - Complete example projects
- `docs/instructions.md` - Language instruction reference
- `README.md` - Comprehensive project documentation

### Configuration
- `package.json` - Root package with workspace configuration
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.js` - ESLint configuration
- `jest.config.js` - Jest test configuration

## Language-Specific Information

8f4e is a stack-oriented programming language designed for real-time audio/MIDI processing:
- Compiles to WebAssembly for browser execution
- Modules contain memory declarations and instruction sequences  
- Variables are allocated in contiguous memory locations
- No runtime memory allocation - all memory must be pre-planned
- Supports C-style pointers with visual wire representations

### Common Module Structure
```
module moduleName

; memory declarations  
int variable 0
float[] buffer 32 0.0

; code instructions
push variable
push 42
store
moduleEnd
```

## Performance Notes

- **Build Times**: Builds are fast (workspace: ~12 seconds, full: ~15 seconds) due to efficient TypeScript/Parcel pipeline
- **Test Speed**: Comprehensive test suite runs in ~2-4 seconds (total 193 tests)
- **Development**: Hot module replacement available in development mode  
- **Production**: Optimized bundles with tree shaking and minification

## Troubleshooting

### Clean Build Issues
```bash
# Clean all artifacts
rm -rf node_modules package-lock.json .parcel-cache dist packages/*/dist packages/*/node_modules

# Reinstall and rebuild
npm install
npm run build
```

### Missing Dependencies
- All dependencies are in root `package.json` or workspace package.json files
- Use `npm install` at root to install all workspace dependencies
- Individual workspace dependencies are managed via the workspace system

### Runtime Errors
- Browser console errors about module resolution are typically harmless
- MIDI functionality requires user permission and is not available in Safari
- Audio functionality requires user interaction to start (browser security)

Always run the complete build and test cycle before submitting changes to ensure compatibility across the monorepo structure.