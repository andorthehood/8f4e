# Config compilation utils consolidation idea

## Context
`compileConfigFromCombined` and `compileConfigBlocksByType` in editor-state both:
- compile combined config sources,
- map compiler errors back to block line mappings,
- return a merged config object.

`compileConfigFromCombined` is currently only used by `compileConfigForExport` for runtime-ready project export. It also always pulls the project schema from `runtimeRegistry` internally.

## Option under consideration
Replace `compileConfigFromCombined` with `compileConfigBlocksByType` inside `compileConfigForExport` (configType: 'project') and pass the schema explicitly via `getProjectConfigSchema(state.runtimeRegistry)`.

## Expected effects
- **Behavior**: Should remain the same (still compile all project config blocks together and map errors back to blocks).
- **Schema**: Becomes explicit in `compileConfigForExport`, matching the current internal choice.
- **Performance**: Minor recombination of config blocks vs passing a pre-combined source.

## Pros
- Removes duplicated code paths.
- One fewer helper to maintain.
- Aligns export compilation with normal config compilation utilities.

## Cons / considerations
- Loses a specialized entry point that accepts pre-combined sources.
- Slight overhead from recombining config blocks.

## Follow-up questions
- Do we want to keep a helper that accepts pre-combined sources for other use cases?
- Should there be a shared internal helper that handles compile + error mapping + merging?
