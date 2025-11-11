# WebGPU Migration Brainstorming Notes

## Overview

This document captures brainstorming and planning notes for migrating glugglug from WebGL to WebGPU for learning purposes.

## Current Architecture

Glugglug is a **minimal WebGL-based 2D sprite rendering engine** with:

- **~470 lines** in core `Renderer` class
- **Simple shader pipeline**: vertex + fragment shaders for sprite rendering
- **Batched rendering**: efficient buffer management with Float32Arrays
- **Post-processing system**: flexible shader-based effects
- **Caching system**: render-to-texture with framebuffers for reusable content
- **Clean separation**: utilities for shader/program/texture creation

## Migration Difficulty: Medium-High (6-7/10)

### What Makes It Easier

1. **Small, focused codebase** (~1500 LOC total)
   - Not a lot of code to rewrite
   - Clear separation of concerns
   - Well-documented

2. **Simple rendering pipeline**
   - Just triangle-based sprite rendering
   - No complex 3D transforms or lighting
   - Straightforward shaders (vertex transforms + texture sampling)

3. **Educational purpose**
   - Built as a learning exercise, so rewriting for WebGPU learning aligns with philosophy
   - Clean, readable code makes understanding easier

4. **Limited feature set**
   - No geometry shaders, compute shaders, or complex features
   - No external dependencies to migrate

### What Makes It Challenging

1. **Fundamental API Paradigm Shift**
   - **WebGL**: Stateful, imperative ("bind, draw, unbind")
   - **WebGPU**: Command-based, explicit ("create pipeline, record commands, submit")
   - Need to rethink entire rendering flow

2. **Shader Language Change**
   - **WebGL**: GLSL (C-like syntax)
   - **WebGPU**: WGSL (WebGPU Shading Language)
   - Shaders need rewriting with different syntax

3. **Render Pipeline Complexity**
   - WebGL: `gl.createProgram()` → done
   - WebGPU: Need to define explicit **pipeline descriptors** with vertex buffer layouts, bind group layouts, render pipeline state, color attachment formats
   - Much more verbose upfront

4. **Buffer Management**
   - WebGL: `gl.bindBuffer()`, `gl.bufferData()`
   - WebGPU: Explicit **buffer creation** with usage flags, **staging buffers**, command encoding
   - Current buffer management needs restructuring

5. **Post-Processing System**
   - Current `PostProcessManager` uses framebuffers and texture switching
   - WebGPU requires **explicit render pass** setup with attachments
   - More boilerplate for render-to-texture

6. **Caching System**
   - Current system uses framebuffers seamlessly
   - WebGPU needs **explicit texture views** and render pass configuration
   - More setup code required

7. **Browser Support**
   - WebGL: Universal (98%+ browsers)
   - WebGPU: ~85% browsers (no Safari on older iOS, no Firefox on Android)
   - May need fallback or version detection

## Work Estimate

| Component | Current LOC | Estimated WebGPU LOC | Effort |
|-----------|-------------|---------------------|---------|
| Renderer core | ~470 | ~800-1000 | High |
| Shader files | ~30 | ~80-100 | Medium |
| PostProcessManager | ~325 | ~500-600 | High |
| CachedRenderer | ~496 | ~700-800 | High |
| Utilities | ~100 | ~200-300 | Medium |
| **TOTAL** | ~1,421 | ~2,280-2,800 | **~60-80% more code** |

**Time Estimate: 2-4 weeks** for someone familiar with both WebGL and WebGPU

## The Big Conceptual Difference

### WebGL: Implicit State Machine

In the current glugglug code, we're manipulating a **state machine**:

```javascript
// You set states one at a time
gl.useProgram(program)           // "Current program is now X"
gl.bindBuffer(ARRAY_BUFFER, buf) // "Current buffer is now Y"
gl.bindTexture(TEXTURE_2D, tex)  // "Current texture is now Z"
gl.drawArrays(...)               // "Draw using current states"
```

The GPU has a "current configuration" and you mutate it piece by piece. It's like having a single workspace that you keep reconfiguring.

### WebGPU: Explicit Pipeline Objects

WebGPU forces you to **pre-define complete pipeline configurations** upfront:

```javascript
// You create a complete "recipe" for rendering
renderPipeline = device.createRenderPipeline({
    vertex: { /* shader + buffer layout */ },
    fragment: { /* shader + targets */ },
    primitive: { /* topology, culling */ },
    // ... everything needed to render
})

// Then you "record commands" that reference these pipelines
commandEncoder.setPipeline(renderPipeline)
commandEncoder.draw(...)
// Submit the recorded commands
```

It's more like **preparing a complete recipe card** that you can reuse, rather than cooking by improvising.

## Mapping Current Architecture to WebGPU Concepts

### 1. Initialization (Constructor)

**Current WebGL approach:**
- Get context → immediate use
- Create shaders → link program → use program
- Everything is stateful and immediate

**WebGPU approach:**
- Request adapter → request device (async!)
- Create shader modules (compiled separately)
- Create bind group layouts (describe uniforms/textures)
- Create render pipeline (combines everything)
- Create bind groups (actual uniform/texture instances)

**Conceptual shift:** More upfront planning, less "figure it out as you go"

### 2. Shader Compilation

**Current WebGL (GLSL):**
```glsl
attribute vec2 a_position;
uniform vec2 u_resolution;
varying vec2 v_texcoord;
```

**WebGPU (WGSL):**
```wgsl
@location(0) position: vec2<f32>
@group(0) @binding(0) var<uniform> resolution: vec2<f32>
@location(0) texcoord: vec2<f32>
```

**Conceptual shift:**
- Explicit binding points (`@group(0) @binding(0)`) vs implicit names
- Structs instead of loose variables
- Different syntax but similar concepts

### 3. Buffer Management

**Current WebGL (from renderer.ts):**
```typescript
// Float32Arrays in memory:
vertexBuffer: Float32Array;
textureCoordinateBuffer: Float32Array;

// Each frame:
gl.bindBuffer(ARRAY_BUFFER, glPositionBuffer);
gl.bufferData(ARRAY_BUFFER, vertexBuffer, STATIC_DRAW);
```

**WebGPU equivalent concept:**
```javascript
// Create GPUBuffer objects (GPU memory)
positionBuffer = device.createBuffer({
    size: vertexBuffer.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
})

// Each frame:
device.queue.writeBuffer(positionBuffer, 0, vertexBuffer);
```

**Conceptual shift:**
- Explicit about buffer **usage** (vertex? uniform? copy destination?)
- Separate **staging** vs **GPU** memory concepts
- Can't just "bind and upload" - must write to queue

### 4. Render Loop

**Current `renderWithPostProcessing()` flow:**
1. Bind framebuffer
2. Bind buffers
3. Upload data
4. Bind textures
5. Draw
6. Switch to canvas
7. Apply post-processing

**WebGPU concept:**
```javascript
// 1. Create a command encoder (records commands)
commandEncoder = device.createCommandEncoder()

// 2. Begin a render pass (like binding a framebuffer)
renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [{
        view: textureView,
        loadOp: 'clear',
        storeOp: 'store',
    }]
})

// 3. Set pipeline and resources
renderPass.setPipeline(renderPipeline)
renderPass.setBindGroup(0, bindGroup) // uniforms + textures
renderPass.setVertexBuffer(0, positionBuffer)
renderPass.draw(vertexCount)

// 4. End and submit
renderPass.end()
device.queue.submit([commandEncoder.finish()])
```

**Conceptual shifts:**
- **Command recording** vs immediate execution
- **Render passes** are explicit objects with attachments
- Can record commands on different threads (advanced)
- Everything validated upfront, not at draw time

### 5. Post-Processing

**Current approach:**
- `PostProcessManager` creates programs for each effect
- Renders full-screen quads

**WebGPU concept:**
- Each effect = separate render pipeline
- Chain render passes with different pipelines
- Same full-screen quad approach
- Explicit texture views and attachments

**Similar complexity**, just more verbose setup.

## The Mental Model Shift

### WebGL = "Tell the GPU what to do right now"
- Imperative: bind this, draw that, change state
- Global state machine
- Errors at runtime ("oops, forgot to bind texture!")

### WebGPU = "Prepare recipes, then execute them"
- Declarative: here's the complete pipeline description
- Immutable pipeline objects
- Errors at creation time ("pipeline invalid!")

## Architecture Transformation

**Current structure:**
```
Engine → Renderer → WebGL calls
     ↓
     ↓  draw commands fill buffers
     ↓
     → render() flushes buffers to GPU
```

**Would become:**
```
Engine → WebGPU Renderer → Pipeline objects (created once)
     ↓                   ↓
     ↓ draw commands → Command encoder (records)
     ↓
     → render() submits command buffer
```

**Same high-level flow**, but:
1. More setup code (create pipelines, bind groups)
2. Command recording step (encode before submit)
3. More explicit about GPU resources

## Complexity Comparison for 2D Sprite Batching

### Things that get MORE complex
- ✗ Initial setup (3x more boilerplate)
- ✗ Shader syntax slightly different
- ✗ Bind groups for uniforms/textures
- ✗ Explicit buffer usage flags

### Things that get SIMPLER
- ✓ No hidden state to track
- ✓ Better error messages (validate upfront)
- ✓ Less "did I bind the right thing?" bugs
- ✓ Clearer what's happening

### Things that stay SIMILAR
- ≈ Overall architecture (still batched rendering)
- ≈ Buffer management concepts
- ≈ Render loop structure
- ≈ Post-processing approach

## Key Design Questions

1. **API Surface**
   - Keep `Engine.drawSprite()` etc., just swap the backend?
   - Or expose WebGPU concepts upward?

2. **Pipeline Switching**
   - Current code has one program
   - WebGPU: one pipeline for sprites, different ones for effects
   - Need to batch draws by pipeline

3. **Command Recording Strategy**
   - Record everything, submit once per frame? (typical)
   - Submit multiple command buffers? (advanced)

4. **Async Initialization**
   - WebGPU initialization is async (requestAdapter/requestDevice)
   - Current constructor is sync
   - Need to handle this in API design

## Migration Strategy (Recommended)

### Phase 1: Basic Triangle Rendering (2-3 days)
- Get WebGPU context working
- Port basic shaders to WGSL
- Render a single sprite

### Phase 2: Batched Rendering (3-5 days)
- Port buffer management
- Implement dynamic buffer updates
- Match current performance

### Phase 3: Post-Processing (4-6 days)
- Render-to-texture setup
- Port effect shaders
- Multi-pass rendering

### Phase 4: Caching System (3-4 days)
- Port framebuffer caching
- Texture atlas management

### Phase 5: Testing & Optimization (3-5 days)
- Feature parity testing
- Performance tuning
- Documentation

## Should We Do It?

### Arguments FOR
- ✅ Future-proof (WebGPU is the future)
- ✅ Better performance potential (more explicit control)
- ✅ Compute shader support (could add GPU-accelerated effects)
- ✅ Aligns with learning goals
- ✅ Modern API design

### Arguments AGAINST
- ❌ Significant effort for minimal immediate benefit
- ❌ Browser support not universal yet
- ❌ Current WebGL implementation is clean and works well
- ❌ WebGPU code is more verbose
- ❌ Would need to maintain fallback or drop older browsers

### Recommendation

**For learning purposes: Do it!** 

This is an excellent hands-on WebGPU learning opportunity with:
- Real-world use case (sprite rendering)
- Manageable scope (~2-4 weeks)
- Clear goals (feature parity with current engine)
- Practical experience with modern GPU API

Consider a **dual-renderer architecture** where you detect WebGPU support and fall back to WebGL. This would be the most work but also the most educational and production-ready.

## Next Steps

1. Study WebGPU fundamentals
   - [WebGPU Fundamentals](https://webgpufundamentals.org/)
   - [WebGPU Spec](https://www.w3.org/TR/webgpu/)
   
2. Prototype basic triangle rendering in WebGPU
   
3. Port GLSL shaders to WGSL
   
4. Design the WebGPU renderer class structure
   
5. Implement incrementally, maintaining WebGL version for comparison

## Resources

- [WebGPU Fundamentals](https://webgpufundamentals.org/)
- [WebGPU Spec](https://www.w3.org/TR/webgpu/)
- [WGSL Spec](https://www.w3.org/TR/WGSL/)
- [WebGPU Samples](https://webgpu.github.io/webgpu-samples/)
- [From WebGL to WebGPU](https://developer.chrome.com/blog/from-webgl-to-webgpu/)

---

*Notes compiled: November 11, 2025*
*Purpose: Learning and exploration*

