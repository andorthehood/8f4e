# Using the 8f4e Editor Bundle

This document provides examples and instructions for integrating the 8f4e editor bundle into external websites.

## Quick Start

### Basic Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website with 8f4e Editor</title>
</head>
<body>
    <canvas id="editor" width="800" height="600"></canvas>
    
    <!-- Load the 8f4e editor bundle -->
    <script src="https://[bucket].[region].digitaloceanspaces.com/editor/editor-bundle.js"></script>
    <script>
        const canvas = document.getElementById('editor');
        
        // Initialize the editor
        Editor8f4e(canvas, {
            // Required callbacks for storage
            loadProjectFromStorage: async (storageId) => {
                const stored = localStorage.getItem('project_' + storageId);
                return stored ? JSON.parse(stored) : null;
            },
            saveProjectToStorage: async (storageId, project) => {
                localStorage.setItem('project_' + storageId, JSON.stringify(project));
            },
            loadEditorSettingsFromStorage: async (storageId) => {
                const stored = localStorage.getItem('settings_' + storageId);
                return stored ? JSON.parse(stored) : null;
            },
            saveEditorSettingsToStorage: async (storageId, settings) => {
                localStorage.setItem('settings_' + storageId, JSON.stringify(settings));
            },
            
            // Required callbacks for file handling
            loadProjectFromFile: async (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => {
                        try {
                            resolve(JSON.parse(e.target.result));
                        } catch (error) {
                            reject(error);
                        }
                    };
                    reader.onerror = () => reject(new Error('Failed to read file'));
                    reader.readAsText(file);
                });
            },
            saveProjectToFile: async (project, filename) => {
                const blob = new Blob([JSON.stringify(project, null, 2)], {
                    type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            },
            importBinaryAsset: async (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => {
                        resolve({
                            data: e.target.result,
                            fileName: file.name
                        });
                    };
                    reader.onerror = () => reject(new Error('Failed to read file'));
                    reader.readAsDataURL(file);
                });
            },
            
            // Runtime factories (can be null for basic use)
            runtimeFactories: {
                'web-worker-logic': async () => null,
                'web-worker-midi': async () => null,
                'audio-worklet': async () => null
            }
        }).then(editor => {
            console.log('Editor initialized successfully');
            editor.resize(800, 600);
        }).catch(error => {
            console.error('Failed to initialize editor:', error);
        });
    </script>
</body>
</html>
```

## Advanced Integration

### With Custom Storage Backend

```javascript
// Example using IndexedDB for storage
const dbName = 'my-app-8f4e';
let db;

// Initialize IndexedDB
const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onupgradeneeded = e => {
            db = e.target.result;
            if (!db.objectStoreNames.contains('projects')) {
                db.createObjectStore('projects');
            }
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings');
            }
        };
        request.onsuccess = e => {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = e => reject(e.target.error);
    });
};

// Custom storage implementation
const customStorageCallbacks = {
    loadProjectFromStorage: async (storageId) => {
        const transaction = db.transaction(['projects'], 'readonly');
        const store = transaction.objectStore('projects');
        return new Promise((resolve, reject) => {
            const request = store.get(storageId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    },
    
    saveProjectToStorage: async (storageId, project) => {
        const transaction = db.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        return new Promise((resolve, reject) => {
            const request = store.put(project, storageId);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    // ... similar implementations for settings
};

// Initialize editor with custom storage
initDB().then(() => {
    return Editor8f4e(canvas, {
        ...customStorageCallbacks,
        // ... other callbacks
    });
});
```

### With Remote Storage

```javascript
// Example using remote API for storage
const apiBase = 'https://api.mysite.com';

const remoteStorageCallbacks = {
    loadProjectFromStorage: async (storageId) => {
        try {
            const response = await fetch(`${apiBase}/projects/${storageId}`);
            return response.ok ? await response.json() : null;
        } catch {
            return null;
        }
    },
    
    saveProjectToStorage: async (storageId, project) => {
        await fetch(`${apiBase}/projects/${storageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(project)
        });
    },
    
    // ... similar implementations for settings and files
};
```

### Framework Integration

#### React Component

```jsx
import React, { useEffect, useRef } from 'react';

const EditorComponent = ({ width = 800, height = 600 }) => {
    const canvasRef = useRef(null);
    const editorRef = useRef(null);
    
    useEffect(() => {
        if (!canvasRef.current || !window.Editor8f4e) return;
        
        const initEditor = async () => {
            try {
                editorRef.current = await window.Editor8f4e(canvasRef.current, {
                    // ... your callbacks here
                });
                editorRef.current.resize(width, height);
            } catch (error) {
                console.error('Failed to initialize editor:', error);
            }
        };
        
        initEditor();
        
        return () => {
            // Cleanup if needed
            editorRef.current = null;
        };
    }, []);
    
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.resize(width, height);
        }
    }, [width, height]);
    
    return <canvas ref={canvasRef} width={width} height={height} />;
};

export default EditorComponent;
```

#### Vue Component

```vue
<template>
    <canvas ref="canvas" :width="width" :height="height"></canvas>
</template>

<script>
export default {
    name: 'EditorComponent',
    props: {
        width: { type: Number, default: 800 },
        height: { type: Number, default: 600 }
    },
    data() {
        return {
            editor: null
        };
    },
    async mounted() {
        if (window.Editor8f4e) {
            try {
                this.editor = await window.Editor8f4e(this.$refs.canvas, {
                    // ... your callbacks here
                });
                this.editor.resize(this.width, this.height);
            } catch (error) {
                console.error('Failed to initialize editor:', error);
            }
        }
    },
    watch: {
        width(newWidth) {
            if (this.editor) this.editor.resize(newWidth, this.height);
        },
        height(newHeight) {
            if (this.editor) this.editor.resize(this.width, newHeight);
        }
    }
};
</script>
```

## API Reference

### Main Function

```typescript
Editor8f4e(canvas: HTMLCanvasElement, options: Options): Promise<EditorInstance>
```

### Options Interface

```typescript
interface Options {
    // Storage callbacks
    loadProjectFromStorage: (storageId: string) => Promise<Project | null>;
    saveProjectToStorage: (storageId: string, project: Project) => Promise<void>;
    loadEditorSettingsFromStorage: (storageId: string) => Promise<EditorSettings | null>;
    saveEditorSettingsToStorage: (storageId: string, settings: EditorSettings) => Promise<void>;
    
    // File handling callbacks
    loadProjectFromFile: (file: File) => Promise<Project>;
    saveProjectToFile: (project: Project, filename: string) => Promise<void>;
    importBinaryAsset: (file: File) => Promise<{ data: string; fileName: string }>;
    
    // Runtime factories
    runtimeFactories: {
        'web-worker-logic': () => Promise<RuntimeFactory | null>;
        'web-worker-midi': () => Promise<RuntimeFactory | null>;
        'audio-worklet': () => Promise<RuntimeFactory | null>;
    };
}
```

### Editor Instance

```typescript
interface EditorInstance {
    resize: (width: number, height: number) => void;
    state: State; // Editor state object
}
```

## Project Structure

### Grid Coordinates vs. Pixel Coordinates

The editor uses two coordinate systems:

1. **Grid Coordinates** (project files): Logical cell positions stored in project JSON files. These represent positions in terms of grid cells, making projects portable across different font sizes and grid configurations.

2. **Pixel Coordinates** (runtime): Actual screen positions calculated by multiplying grid coordinates by grid size (`vGrid` for horizontal, `hGrid` for vertical). Used internally for rendering.

#### Project File Format

Both viewport and code block positions use explicit `gridCoordinates` objects:

```json
{
  "title": "My Project",
  "author": "Your Name",
  "description": "Project description",
  "memorySizeBytes": 2097152,
  "codeBlocks": [
    {
      "code": ["module example", "...", "moduleEnd"],
      "gridCoordinates": { "x": 10, "y": 5 }
    }
  ],
  "viewport": { "gridCoordinates": { "x": 0, "y": 0 } },
  "selectedRuntime": 0,
  "runtimeSettings": [...]
}
```

This naming makes it clear that:
- Viewport position is in grid coordinates (not pixels)
- Code block positions are in grid coordinates (not pixels)
- Negative coordinates are valid (for viewports positioned to the left/above origin)

### Memory Configuration

Projects specify WebAssembly memory settings to optimize for their specific needs. The default is 1,048,576 bytes (1MB).

#### Default Memory Settings
- **Memory Size**: 1,048,576 bytes (1MB)

#### Custom Memory Configuration

You can specify custom memory settings in your project JSON:

```json
{
  "title": "My Project",
  "author": "Your Name",
  "description": "Project description",
  "memorySizeBytes": 2097152,
  "codeBlocks": [],
  "viewport": { "gridCoordinates": { "x": 0, "y": 0 } },
  "selectedRuntime": 0,
  "runtimeSettings": [...]
}
```

#### When to Adjust Memory Settings

**Keep default for simple projects:**
```json
{
  "memorySizeBytes": 1048576
}
```
The 1MB default is suitable for most simple projects.

**Increase memory for complex projects:**
```json
{
  "memorySizeBytes": 10485760
}
```
Use larger values (e.g., 10,485,760 bytes = 10MB) for projects with:
- Large audio buffers
- Complex data structures
- Multiple concurrent processes
- Extensive binary assets

#### Memory Configuration Best Practices

1. **Start with defaults**: The 1MB default is suitable for most projects. Only adjust if you encounter memory issues.

2. **Monitor memory usage**: Use browser developer tools to check actual memory consumption.

3. **Set appropriate size**: Choose a value that provides adequate memory for your project's needs while avoiding waste.

4. **Validation**: The editor respects browser limits for WebAssembly memory. Memory is allocated in page-sized chunks (64KiB), so the actual allocated size will be rounded up to the nearest page.

5. **Persistence**: Memory settings are preserved through save/export operations and runtime-ready bundles.

#### Example: Audio Processing Project

```json
{
  "title": "Audio DSP Project",
  "memorySizeBytes": 5242880,
  "runtimeSettings": [
    {
      "runtime": "AudioWorkletRuntime",
      "sampleRate": 44100,
      "audioOutputBuffers": [...]
    }
  ]
}
```

## Performance Considerations

### Bundle Size
- Main bundle: ~84KB (gzipped: ~22KB)
- Consider lazy loading for large applications
- Use versioned URLs for better caching

### Loading Strategy
```javascript
// Lazy load the editor when needed
const loadEditor = async () => {
    if (!window.Editor8f4e) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://[bucket].[region].digitaloceanspaces.com/editor/editor-bundle.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    return window.Editor8f4e;
};
```

## Troubleshooting

### Common Issues

1. **"Editor8f4e is not defined"**
   - Ensure the script has loaded completely before accessing
   - Check browser console for network errors

2. **Canvas not rendering**
   - Verify canvas dimensions are set properly
   - Ensure canvas is visible in the DOM

3. **Storage callbacks failing**
   - Check that all required callbacks are implemented
   - Verify async/await usage is correct

4. **CORS errors**
   - Contact the maintainers if loading from different domains fails
   - Ensure proper CORS configuration on the Spaces bucket

### Debug Mode

```javascript
// Enable debug logging (if available)
Editor8f4e(canvas, {
    ...options,
    debug: true
}).then(editor => {
    console.log('Editor state:', editor.state);
});
```