# Config Compiler Feature

## Purpose

Compiles configuration blocks written in the stack-based config language into validated configuration objects. Supports two types of config blocks:

1. **Project Config** (`config project`): Runtime configuration for the project
2. **Editor Config** (`config editor`): Editor-wide settings like color scheme and font

Both config types use the stack-config language and are validated against their respective schemas. The compiler combines multiple config blocks, compiles them using the `@8f4e/stack-config-compiler`, maps errors back to source blocks, and merges results with default values.

## Key Behaviors

- **Config Collection**: Gathers all config-type blocks from the project
- **Type Separation**: Project and editor configs are compiled separately
- **Source Combination**: Combines multiple config blocks into a single source string with line tracking
- **Compilation**: Uses `@8f4e/stack-config-compiler` to parse and execute config programs
- **Schema Validation**: Validates compiled config against predefined schemas
- **Error Mapping**: Maps compilation/validation errors back to specific config blocks and line numbers
- **Default Merging**: Deep merges compiled config with default values

### Project Config

- **Runtime Selection**: Determines which runtime to use based on compiled config
- **Memory Configuration**: Sets memory size and other compiler options
- **Binary Assets**: Configures external assets to load into memory
- **Persistence**: Compiled config is included in runtime-ready project exports

### Editor Config

- **Editor Settings**: Configures editor appearance (color scheme, font)
- **Session-Specific**: Not included in project exports; persists via callbacks
- **Compilation**: Updates `state.editorSettings` when blocks change
- **Error Tracking**: Errors are stored in `state.codeErrors.editorConfigErrors`

## Events & Callbacks

### Events Listened To

- Config blocks are monitored through state subscriptions
- Triggered automatically when config blocks are modified

### State Touched

#### Project Config
- `state.graphicHelper.codeBlocks` - Filtered for project config-type blocks
- `state.compiledConfig` - Resulting configuration object after compilation and merging
- `state.compiledConfig.selectedRuntime` - Index of the selected runtime
- `state.codeErrors.configErrors` - Array of project config compilation/validation errors

#### Editor Config
- `state.graphicHelper.codeBlocks` - Filtered for editor config-type blocks
- `state.editorSettings` - Editor settings object updated from compiled config
- `state.codeErrors.editorConfigErrors` - Array of editor config compilation/validation errors

## Integration Points

- **Config Compiler Package**: Uses [`@8f4e/stack-config-compiler`](../../../../stack-config-compiler/README.md) for parsing and execution
- **Config Schemas**: 
  - Project config: Validates against runtime registry schema (defined in `configSchema.ts`)
  - Editor config: Validates against editor settings schema (defined in `configSchema.ts`)
- **Runtime**: Compiled project config determines runtime settings and selection
- **Program Compiler**: Memory size and other compiler options come from project config
- **Project Export**: Compiled project config is included in runtime-ready project exports
- **Editor Persistence**: Editor config blocks persist separately via callbacks

## Error Handling

Errors are categorized and mapped back to source:

- **Parse Errors**: Invalid command syntax in config blocks
- **Execution Errors**: Runtime errors during config program execution
- **Schema Validation Errors**: Config values that don't match schema requirements

Each error includes:
- Source block ID
- Line number within the block
- Error message and kind

## Config Block Types

### Project Config (`config project`)
```
config project
push 1048576
set memorySizeBytes
configEnd
```

### Editor Config (`config editor`)
```
config editor
push "hackerman"
set colorScheme
push "8x16"
set font
configEnd
```

## References

- Config language documentation: [`@8f4e/stack-config-compiler/README.md`](../../../../../../stack-config-compiler/README.md)
- Config schema definitions: `configSchema.ts`
- Error mapping utilities: `mapErrorLineToBlock.ts`

## Notes & Limitations

- Config blocks are combined in `creationIndex` order
- Line numbers in errors account for block boundaries
- Default config values provide fallbacks for missing settings
- Editor config blocks are excluded from project serialization
- Only the first editor config block is currently persisted (future: support multiple blocks)
