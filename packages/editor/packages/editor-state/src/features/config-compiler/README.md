# Config Compiler Feature

## Purpose

Provides shared helpers for compiling stack-based config blocks into validated configuration objects. These utilities are used by the `project-config` and `editor-config` features.

## Key Behaviors

- **Config Collection**: Helpers for gathering config-type blocks
- **Source Combination**: Combines multiple config blocks into a single source string with line tracking
- **Compilation**: Uses `@8f4e/stack-config-compiler` to parse and execute config programs
- **Schema Validation**: Validates compiled config against a provided schema
- **Error Mapping**: Maps compilation/validation errors back to specific config blocks and line numbers
- **Default Merging**: Deep merges compiled config with default values

## Consumers

- `project-config` feature
- `editor-config` feature

## Integration Points

- **Config Compiler Package**: Uses [`@8f4e/stack-config-compiler`](../../../../stack-config-compiler/README.md) for parsing and execution
- **Config Schemas**: Project config is validated by `project-config/schema.ts`; editor config is validated by `editor-config/schema.ts`
- **Runtime**: Project config determines runtime settings and selection
- **Program Compiler**: Memory size and other compiler options come from project config
- **Project Export**: Compiled project config is included in runtime-ready project exports

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

- Config language documentation: [`@8f4e/stack-config-compiler/README.md`](../../../../../../stack-config-compiler/README.md)
- Project config schema definition: `project-config/schema.ts`
- Editor config schema definition: `editor-config/schema.ts`
- Error mapping utilities: `mapErrorLineToBlock.ts`

## Notes & Limitations

- Config blocks are combined in `creationIndex` order
- Line numbers in errors account for block boundaries
- Default config values provide fallbacks for missing settings
