# ADR-007: Prefer Off-Main-Thread Runtime Execution

**Date**: 2026-03-16

**Status**: Accepted

## Context

The application combines interactive editing, compilation, visualization, and runtime execution in the browser. Running all program execution on the main thread would force runtime work to compete directly with UI rendering, input handling, and editor state updates.

This is especially problematic for:

1. Continuous logic execution.
2. Audio processing with tight scheduling requirements.
3. MIDI handling and browser integration work.
4. Any future workloads that can stall input responsiveness or rendering.

The repository already contains multiple specialized execution targets:

- web worker runtime
- audio worklet runtime
- web worker MIDI runtime
- main-thread runtime as an available but non-default option

The application default runtime is `WebWorkerRuntime`.

## Decision

We **prefer off-main-thread runtime execution by default** and treat the main thread as a fallback or specialized integration point.

In practice this means:

1. General program logic defaults to a web worker runtime.
2. Audio execution uses an audio worklet runtime when audio-thread execution is required.
3. MIDI-oriented runtime execution uses dedicated worker-based isolation.
4. Main-thread execution remains available where browser integration or debugging needs justify it, but it is not the default architecture.

This decision aligns runtime placement with responsiveness requirements: UI work stays on the main thread, while executable program logic is isolated whenever practical.

## Consequences

### Positive

1. **Better editor responsiveness**: Runtime execution is less likely to interfere with rendering and input handling.
2. **Clear runtime specialization**: Worker, worklet, and main-thread runtimes each have a defined role.
3. **Improved scalability for browser workloads**: Heavy or continuous execution can be isolated from the UI loop.
4. **Architecture matches browser execution models**: Audio and worker use cases rely on the browser primitives intended for those workloads.

### Negative

1. **Higher integration complexity**: Workers and worklets add message passing, lifecycle management, and build concerns.
2. **Debugging is more distributed**: Runtime behavior may span multiple execution contexts.
3. **Feature constraints differ by context**: Not every API is available in every runtime environment.

## Alternatives Considered

### 1. Standardize on Main-Thread Execution

Rejected because it simplifies architecture at the expense of responsiveness and runtime isolation.

### 2. Support Only One Off-Main-Thread Runtime

Rejected because browser workloads are heterogeneous: general logic, audio, and MIDI have different execution-context requirements.

### 3. Choose Runtime Per Feature Without a Default Bias

Rejected because the repository already encodes a strong default toward worker-based execution, and documenting that bias clarifies future decisions.

## Related Decisions

- [ADR-006: Lazy-Load Optional Runtime Implementations and Schemas](006-lazy-load-optional-runtime-implementations-and-schemas.md)

