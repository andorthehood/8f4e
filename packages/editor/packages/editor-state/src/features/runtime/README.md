# Runtime Feature

## Purpose

Manages the lifecycle of runtime instances that execute compiled 8f4e programs. Handles runtime selection from compiled config, initialization, destruction, and recreation when configuration changes.

## Key Behaviors

- **Runtime Registry**: Looks up runtime factories from `state.runtimeRegistry` at project root
- **Runtime Selection**: Determines which runtime to use from `compiledProjectConfig.selectedRuntime`
- **Lifecycle Management**: Creates and destroys runtime instances as needed
- **Runtime Switching**: Recreates runtime when configuration changes (e.g., switching from audio to MIDI runtime)
- **Fallback Handling**: Falls back to default runtime ID if unknown runtime is requested
- **Initialization Locking**: Prevents concurrent initialization attempts

## Runtime Registry

The runtime registry is located at the project root level (not in editor-state):

```typescript
state.runtimeRegistry = {
  'audio': { factory: audioRuntimeFactory },
  'midi': { factory: midiRuntimeFactory },
  // ... other runtimes
}
```

Each entry contains a `factory` function that creates and returns a destroyer function.

## Runtime Lifecycle

1. **Initialization**: Triggered when compilation completes and runtime needs to change
2. **Destruction**: Previous runtime is destroyed before creating new one
3. **Factory Call**: Runtime factory is invoked with `(store, events)` parameters
4. **Destroyer Storage**: Factory returns a cleanup function for later destruction

## Events & Callbacks

### State Subscriptions

- Subscribes to `compiler.isCompiling` becoming `false` to trigger runtime initialization

### Events Dispatched

- Dispatches events as needed for runtime coordination (implementation-specific)

### State Touched

- `state.runtimeRegistry` - Registry of available runtime factories
- `state.defaultRuntimeId` - Fallback runtime identifier
- `state.compiledProjectConfig.selectedRuntime` - Index of selected runtime
- `state.compiledProjectConfig.runtimeSettings` - Array of runtime configurations

## Integration Points

- **Config Compiler**: Runtime selection comes from compiled configuration
- **Program Compiler**: Runtime initialization waits for compilation to complete
- **Runtime Factories**: External runtime implementations register themselves in the registry

## Runtime Factory Contract

```typescript
type RuntimeFactory = (
  store: StateManager<State>,
  events: EventDispatcher
) => () => void;  // Returns destroyer function
```

## Logging

Runtime lifecycle events are logged:
- "Requesting runtime: {runtime}"
- "Loaded runtime from registry: {runtime}"
- "Unknown runtime {runtime}, falling back to default: {default}"
- "Destroying runtime: {runtime}"
- "Successfully initialized runtime: {runtime}"

## References

- Runtime registry is defined at project root initialization
- Runtime settings schema: See project config schema

## Notes & Limitations

- Only one runtime can be active at a time
- Runtime switching requires destroying previous runtime completely
- Initialization is locked to prevent race conditions
- Unknown runtimes fall back to default silently (with log message)
- Runtime factories must be registered before runtime feature initializes
