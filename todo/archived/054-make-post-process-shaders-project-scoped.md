---
title: 'TODO: Make Post-Process Shaders Project-Scoped'
priority: �
effort: 4-6 hours
created: 2025-09-03
status: Open
completed: null
---

# TODO: Make Post-Process Shaders Project-Scoped

## Problem Description

Currently, the post-process vertex and fragment shaders are hardcoded in the editor package (`packages/editor/src/shaders/`). This creates a limitation where:

- All projects use the same CRT scanline effect regardless of their specific needs
- Projects cannot define custom visual effects that match their aesthetic
- The shader system is not extensible for project-specific requirements
- The current scanline shader is tightly coupled to the editor rather than being a project feature
- No way to configure shader uniforms or other parameters per project

This reduces the flexibility and customization potential of individual projects.

## Proposed Solution

Refactor the post-process shader system to be project-scoped with a future-proof structure:

- Store shader configuration in project.json with an extensible `postProcessEffects` array
- Allow projects to define multiple post-process effects with full configuration
- Support shader code, uniform mappings, and other shader parameters
- Create a default project that includes the existing scanline CRT effect
- Update the editor to load shader configurations from the active project's project.json
- Maintain backward compatibility by providing a sensible default

## Implementation Plan

### Step 1: Create Extensible Project Shader Interface
- Define a comprehensive interface for post-process effects in project.json:
  ```json
  {
    "postProcessEffects": {
      "crt": {
        "name": "crt",
        "enabled": true,
        "vertexShader": "...",
        "fragmentShader": "...",
        "uniforms": {
          "u_time": { "type": "float", "source": "time" },
          "u_resolution": { "type": "vec2", "source": "resolution" },
          "u_renderTexture": { "type": "sampler2D", "source": "renderTexture" }
        },
        "parameters": {
          "distortionIntensity": 0.125,
          "scanlineFrequency": 50.0,
          "scanlinePower": 0.1
        }
      }
    }
  }
  ```
- Create type definitions for the extensible shader configuration
- Expected outcome: Future-proof structure supporting shaders, uniforms, and parameters

### Step 2: Move Existing Shaders to Example Project
- Create a new example project (e.g., `crtEffect.ts`) or add to existing project
- Add the existing shader code and configuration to the project's project.json using the new structure
- Map existing hardcoded uniforms to the new uniform mapping system
- Expected outcome: Existing CRT effect becomes a fully configured project feature

### Step 3: Update Editor to Load Project Shader Configurations
- Modify `packages/editor/src/view/index.ts` to load shader configurations from project.json
- Update the `CachedEngine` initialization to use project-provided shader configurations
- Implement uniform mapping system to connect shader uniforms to engine values
- Add fallback logic for projects that don't define custom shader configurations
- Expected outcome: Editor dynamically loads and configures shaders from project.json

### Step 4: Update Project Loading System
- Modify project loading logic to parse the new `postProcessEffects` structure
- Ensure shader configurations are properly validated and processed
- Add support for uniform mapping and parameter binding
- Expected outcome: Projects can reliably provide complete shader configurations via project.json

## Success Criteria

- [ ] Projects can define custom post-process effects with full configuration in project.json
- [ ] Existing CRT scanline effect works as a fully configured project feature
- [ ] Editor loads shader configurations dynamically from the active project's project.json
- [ ] Uniform mapping system connects shader uniforms to engine values
- [ ] Shader parameters can be configured per project
- [ ] Fallback behavior works for projects without custom shader configurations
- [ ] No breaking changes to existing project functionality
- [ ] Structure is extensible for future shader features (multiple effects, custom uniforms, etc.)

## Affected Components

- `packages/editor/src/view/index.ts` - Remove hardcoded shader imports, add project.json shader configuration loading
- `packages/editor/src/shaders/` - Move shader files to example project.json
- `src/examples/projects/` - Add new CRT effect project or update existing project with full shader configuration
- Project loading system - Add shader configuration parsing from project.json
- `glugglug` - May need updates to support dynamic shader loading and uniform mapping

## Future Extensibility Features

The new structure will support future enhancements:
- **Multiple Effects**: Array of post-process effects with ordering
- **Custom Uniforms**: Project-defined uniforms with custom sources
- **Dynamic Parameters**: Runtime parameter adjustment
- **Effect Chaining**: Multiple effects applied in sequence
- **Conditional Effects**: Effects that enable/disable based on project state
- **Shader Variants**: Different shader versions for different platforms/performance levels

## Risks & Considerations

- **Shader Compatibility**: Different projects might use incompatible shader versions or features
- **Performance Impact**: Dynamic shader loading and uniform mapping might introduce runtime overhead
- **Bundle Size**: Shader configurations in project.json will increase project file sizes
- **Dependencies**: Shader loading system needs to be robust and handle missing or malformed configurations gracefully
- **Breaking Changes**: Need to ensure existing projects continue working during transition
- **JSON Size**: Large shader strings and configurations might make project.json files harder to read and edit
- **Uniform Mapping Complexity**: Need to ensure uniform mapping system is flexible but not overly complex

## Related Items

- **Depends on**: Project loading and asset management system
- **Related**: Any future visual effects or rendering improvements
- **Enables**: Future shader features like multiple effects, custom uniforms, dynamic parameters

## References

- Current shader files: `packages/editor/src/shaders/postProcessVertexShader.ts`, `packages/editor/src/shaders/scanlineFragmentShader.ts`
- Editor view initialization: `packages/editor/src/view/index.ts` (lines 34-41)

## Notes

- The existing scanline shader provides a nice CRT effect with distortion, scanlines, and flicker
- Consider creating a `crtEffect.ts` project specifically for this effect with full configuration
- May want to create additional example projects with different visual effects to demonstrate the extensible system
- Shader loading should be asynchronous to avoid blocking the main thread
- Shader strings in project.json should be properly escaped and formatted for readability
- Uniform mapping system should be designed to be easily extensible for new uniform types and sources

## Archive Instructions

When this TODO is completed, move it to the `todo/archived/` folder to keep the main todo directory clean and organized.
