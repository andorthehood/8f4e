# Audio Buffer Cycle Length Configuration Analysis

## Problem Statement

The compiler can currently generate a function that executes the compiled code X times in the runtime to fill an output buffer. This is primarily used in audio applications to generate audio buffers.

Previously, the cycle length (X) was hardcoded to 128, which made it inflexible. This document analyzes the trade-offs between build-time vs runtime configuration and documents the chosen implementation.

## Analysis: Build-time vs Runtime Configuration

### Build-time Configuration (CHOSEN APPROACH)

**Pros:**
- **Performance**: No runtime overhead - the buffer function is generated with unrolled calls to the cycle function
- **Simplicity**: Clean implementation that maintains the existing architecture
- **Predictability**: Deterministic performance characteristics essential for audio applications
- **Memory efficiency**: No additional memory allocation required for storing cycle length
- **Optimization**: Compiler can optimize the unrolled calls more effectively

**Cons:**
- **Flexibility**: Less flexible - requires recompilation to change buffer size
- **Static nature**: Cannot adapt buffer size dynamically during execution

### Runtime Configuration (NOT CHOSEN)

**Pros:**
- **Flexibility**: Highly flexible, can adapt buffer size dynamically
- **Runtime adaptation**: Different modules could potentially have different cycle lengths
- **User control**: Could allow users to adjust buffer sizes on-the-fly

**Cons:**
- **Performance overhead**: Requires runtime loops instead of unrolled calls
- **Memory usage**: Requires memory allocation for storing the cycle length variable
- **Complexity**: More complex implementation requiring loop generation instead of unrolled calls
- **Audio timing issues**: Variable cycle lengths could introduce timing inconsistencies in audio processing

## Decision: Build-time Configuration

After careful analysis, **build-time configuration** was chosen for the following reasons:

1. **Audio Application Focus**: This system is primarily used for audio processing where timing precision and consistent performance are critical. Runtime variability could negatively impact audio quality.

2. **Performance Priority**: Audio processing requires extremely efficient code. The current unrolled approach (calling cycle() X times directly) is faster than runtime loops with variable bounds.

3. **Architecture Compatibility**: The existing WASM generation architecture is well-suited for build-time configuration and requires minimal changes.

4. **Use Case Alignment**: Audio buffer sizes are typically determined by the audio context configuration and rarely change during execution.

## Implementation Details

### Changes Made

1. **Compiler Types** (`packages/compiler/src/types.ts`):
   - Added `bufferSize?: number` to `CompileOptions` interface
   - Default value: 128 (maintains backward compatibility)

2. **Compiler** (`packages/compiler/src/index.ts`):
   - Modified buffer function generation: `new Array(options.bufferSize || 128).fill(call(1)).flat()`
   - This creates a WASM function that calls the cycle function the specified number of times

3. **Editor Types** (`packages/editor/src/state/types.ts`):
   - Added `bufferSize?: number` to `AudioWorkletRuntime` interface
   - Only AudioWorklet runtime needs this since other runtimes don't use audio buffers

4. **Editor Compiler Effect** (`packages/editor/src/state/effects/compiler.ts`):
   - Extract buffer size from runtime settings for AudioWorklet runtimes
   - Pass buffer size to compiler options
   - Update `AUDIO_BUFFER_SIZE` constant to reflect actual configured size

5. **Testing** (`packages/compiler/tests/bufferSize.test.ts`):
   - Comprehensive test suite verifying configurable buffer sizes
   - Tests default behavior, custom sizes, and edge cases

### Usage

Projects can now specify custom buffer sizes in their runtime settings:

```typescript
runtimeSettings: [
  {
    runtime: 'AudioWorkletRuntime',
    sampleRate: 44100,
    bufferSize: 256, // Custom buffer size
    audioOutputBuffers: [...]
  }
]
```

If not specified, the system defaults to 128 for backward compatibility.

## Performance Impact Analysis

### Positive Impacts
- **No runtime overhead**: Buffer size is determined at compile time
- **Optimal WASM generation**: Unrolled calls allow for better optimization
- **Consistent timing**: No variability in execution time per buffer

### Considerations
- **WASM size**: Larger buffer sizes result in longer unrolled call sequences and larger WASM bytecode
- **Compilation time**: Very large buffer sizes could slightly increase compilation time
- **Memory layout**: Different buffer sizes in the compiled code may affect memory access patterns

## Edge Cases Handled

1. **Buffer size 0**: Generates valid WASM with no cycle calls (useful for testing)
2. **Very large buffer sizes**: System can handle large values (tested up to 1024)
3. **Non-AudioWorklet runtimes**: Default to 128 for compatibility
4. **Missing configuration**: Falls back to 128 for backward compatibility

## Future Considerations

### Potential Enhancements
1. **Validation**: Add validation for reasonable buffer size ranges
2. **Performance warnings**: Warn when very large buffer sizes are used
3. **Multiple buffer sizes**: Support different buffer sizes for different modules
4. **Documentation**: User-facing documentation for buffer size configuration

### Migration Path
The implementation is fully backward compatible. Existing projects will continue to use buffer size 128 unless explicitly configured otherwise.

## Conclusion

Build-time configuration of audio buffer cycle length provides the optimal balance of flexibility and performance for audio applications. The implementation maintains backward compatibility while enabling users to optimize buffer sizes for their specific use cases.

The solution respects the performance-critical nature of audio processing while providing the flexibility requested in the original issue.