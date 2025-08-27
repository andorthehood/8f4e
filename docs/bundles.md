# 8f4e UMD Bundles

This document explains how to use the 8f4e UMD bundles on external websites via script tags.

## Overview

The 8f4e framework provides three main UMD bundles for external integration:

- **8f4e-editor.js** - Complete editor interface with all dependencies
- **8f4e-compiler-worker.js** - Compiler worker for WASM compilation
- **8f4e-logic-runtime.js** - Web worker logic runtime

## Bundle URLs

### Production (CDN)
```html
<script src="https://YOUR-CDN-DOMAIN/bundles/8f4e-editor.js"></script>
<script src="https://YOUR-CDN-DOMAIN/bundles/8f4e-compiler-worker.js"></script>
<script src="https://YOUR-CDN-DOMAIN/bundles/8f4e-logic-runtime.js"></script>
```

### Versioned (Cache-busted)
```html
<script src="https://YOUR-CDN-DOMAIN/bundles/v/COMMIT-SHA/8f4e-editor.js"></script>
<script src="https://YOUR-CDN-DOMAIN/bundles/v/COMMIT-SHA/8f4e-compiler-worker.js"></script>
<script src="https://YOUR-CDN-DOMAIN/bundles/v/COMMIT-SHA/8f4e-logic-runtime.js"></script>
```

## Usage Examples

### Basic Editor Integration

```html
<!DOCTYPE html>
<html>
<head>
    <title>8f4e Editor Integration</title>
</head>
<body>
    <canvas id="editor-canvas" width="800" height="600"></canvas>
    
    <script src="https://YOUR-CDN-DOMAIN/bundles/8f4e-editor.js"></script>
    <script>
        const canvas = document.getElementById('editor-canvas');
        const options = {
            // Editor configuration options
        };
        
        // Initialize the editor
        EightF4EEditor.default(canvas, options).then(() => {
            console.log('Editor initialized successfully');
        }).catch(error => {
            console.error('Editor initialization failed:', error);
        });
    </script>
</body>
</html>
```

### Compiler Worker Usage

```html
<script src="https://YOUR-CDN-DOMAIN/bundles/8f4e-compiler-worker.js"></script>
<script>
    // Create a compiler worker
    const worker = EightF4ECompilerWorker.createCompilerWorker();
    
    // Or compile directly in main thread
    EightF4ECompilerWorker.compileModules(memoryRef, modules, options)
        .then(result => {
            console.log('Compilation successful:', result);
        })
        .catch(error => {
            console.error('Compilation failed:', error);
        });
</script>
```

### Logic Runtime Usage

```html
<script src="https://YOUR-CDN-DOMAIN/bundles/8f4e-logic-runtime.js"></script>
<script>
    // Create a logic runtime worker
    const worker = EightF4ELogicRuntime.createLogicRuntimeWorker();
    
    // Or run directly in main thread (use with caution)
    EightF4ELogicRuntime.runLogicRuntime(memoryRef, sampleRate, codeBuffer, callback)
        .then(runtime => {
            console.log('Logic runtime started:', runtime);
            
            // Stop the runtime when done
            runtime.stop();
        })
        .catch(error => {
            console.error('Logic runtime failed:', error);
        });
</script>
```

## API Reference

### EightF4EEditor

The main editor interface.

```typescript
// Main initialization function
EightF4EEditor.default(canvas: HTMLCanvasElement, options: Options): Promise<void>

// Available types (re-exported)
type Project = { ... }
type Options = { ... }
type State = { ... }
// ... other types
```

### EightF4ECompilerWorker

Compiler functionality for WASM compilation.

```typescript
// Factory function to create a worker
EightF4ECompilerWorker.createCompilerWorker(): Worker

// Direct compilation (main thread)
EightF4ECompilerWorker.compileModules(
    memoryRef: WebAssembly.Memory,
    modules: Module[],
    compilerOptions: CompileOptions
): Promise<CompilationResult>

// Access to testBuild function
EightF4ECompilerWorker.testBuild(
    memoryRef: WebAssembly.Memory,
    modules: Module[],
    compilerOptions: CompileOptions
): Promise<CompilationResult>
```

### EightF4ELogicRuntime

Logic runtime for executing compiled modules.

```typescript
// Factory function to create a worker
EightF4ELogicRuntime.createLogicRuntimeWorker(): Worker

// Direct runtime execution (main thread)
EightF4ELogicRuntime.runLogicRuntime(
    memoryRef: WebAssembly.Memory,
    sampleRate: number,
    codeBuffer: Uint8Array,
    callback?: (message: any) => void
): Promise<{ stop: () => void, wasmApp: any }>

// Access to createModule function
EightF4ELogicRuntime.createModule(
    memoryRef: WebAssembly.Memory,
    codeBuffer: Uint8Array
): Promise<any>
```

## Bundle Information

### Size Information
- **8f4e-editor.js**: ~84 KB (22 KB gzipped)
- **8f4e-compiler-worker.js**: ~45 KB (9 KB gzipped)
- **8f4e-logic-runtime.js**: ~2 KB (1 KB gzipped)

### Browser Compatibility
- ES2020 compatible
- Supports all modern browsers
- UMD format ensures compatibility with AMD, CommonJS, and global variables

### Performance Considerations
- Bundles are minified and optimized for production
- Tree-shaking removes unused code
- CDN delivery provides global performance
- Versioned URLs enable long-term caching

## Getting Current Bundle Information

You can fetch the current bundle manifest to get version and URL information:

```javascript
fetch('https://YOUR-CDN-DOMAIN/bundles/manifest.json')
    .then(response => response.json())
    .then(manifest => {
        console.log('Current version:', manifest.version);
        console.log('Available bundles:', manifest.bundles);
        
        // Use versioned URLs for cache busting
        const editorUrl = manifest.bundles.editor.versionedUrl;
        // ... load scripts dynamically
    });
```

## Error Handling

### Common Issues

1. **CORS Errors**: Ensure your DigitalOcean Space has proper CORS configuration
2. **Module Loading**: Scripts must be loaded in order if there are dependencies
3. **WebAssembly Support**: Ensure target browsers support WebAssembly

### Debug Mode

For development, you can load the unminified versions with source maps:

```html
<!-- Load source maps for debugging -->
<script src="https://YOUR-CDN-DOMAIN/bundles/8f4e-editor.js"></script>
<!--# sourceMappingURL=8f4e-editor.js.map -->
```

## Deployment

The bundles are automatically deployed to DigitalOcean Spaces via GitHub Actions when changes are pushed to the main branch. The deployment process:

1. Builds all packages
2. Creates UMD bundles
3. Uploads to DigitalOcean Spaces with public read access
4. Sets appropriate cache headers
5. Creates versioned copies for cache busting
6. Updates the bundle manifest

### Required Secrets

Configure these secrets in your GitHub repository:

- `DO_SPACES_ACCESS_KEY` - DigitalOcean Spaces access key
- `DO_SPACES_SECRET_KEY` - DigitalOcean Spaces secret key
- `DO_SPACES_BUCKET` - DigitalOcean Spaces bucket name
- `DO_SPACES_ENDPOINT` - DigitalOcean Spaces endpoint URL
- `DO_SPACES_CDN_DOMAIN` - DigitalOcean Spaces CDN domain

## Support

For issues with bundle integration:

1. Check the browser console for errors
2. Verify bundle URLs are accessible
3. Ensure proper script loading order
4. Check WebAssembly support in target browsers

For framework-specific issues, please refer to the main 8f4e documentation.