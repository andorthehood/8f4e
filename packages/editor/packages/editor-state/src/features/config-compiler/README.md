# Config Compiler Feature

## Purpose

Compiles configuration blocks written in the stack-based config language into a validated configuration object. Combines multiple config blocks, compiles them using the `@8f4e/stack-config-compiler`, maps errors back to source blocks, and merges results with default configuration values.

## Key Behaviors

- **Config Collection**: Gathers all config-type blocks from the project
- **Source Combination**: Combines multiple config blocks into a single source string with line tracking
- **Compilation**: Uses `@8f4e/stack-config-compiler` to parse and execute config programs
- **Schema Validation**: Validates compiled config against a predefined schema
- **Error Mapping**: Maps compilation/validation errors back to specific config blocks and line numbers
- **Default Merging**: Deep merges compiled config with default values
- **Runtime Selection**: Determines which runtime to use based on compiled config

## Events & Callbacks

### Events Listened To

- Config blocks are monitored through state subscriptions
- Triggered automatically when config blocks are modified

### State Touched

- `state.graphicHelper.codeBlocks` - Filtered for config-type blocks
- `state.compiledConfig` - Resulting configuration object after compilation and merging
- `state.compiledConfig.selectedRuntime` - Index of the selected runtime
- `state.codeErrors.configErrors` - Array of config compilation/validation errors

## Integration Points

- **Config Compiler Package**: Uses [`@8f4e/stack-config-compiler`](../../../../stack-config-compiler/README.md) for parsing and execution
- **Config Schema**: Validates against schema defined in `configSchema.ts`
- **Runtime**: Compiled config determines runtime settings and selection
- **Program Compiler**: Memory size and other compiler options come from config
- **Project Export**: Compiled config is included in runtime-ready project exports

## Error Handling

Errors are categorized and mapped back to source:

- **Parse Errors**: Invalid command syntax in config blocks
- **Execution Errors**: Runtime errors during config program execution
- **Schema Validation Errors**: Config values that don't match schema requirements

Each error includes:
- Source block ID
- Line number within the block
- Error message and kind

## References

- Config language documentation: [`@8f4e/stack-config-compiler/README.md`](../../../../stack-config-compiler/README.md)
- Config schema definition: `configSchema.ts`
- Error mapping utilities: `mapErrorLineToBlock.ts`

## Notes & Limitations

- Config blocks are combined in `creationIndex` order
- Line numbers in errors account for block boundaries
- Default config values provide fallbacks for missing settings
