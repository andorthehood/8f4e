---
 title: 'TODO: Surface config compilation errors in graphicHelper'
 priority: Medium
 effort: 4-6 hours
 created: 2025-12-02
 status: Open
 completed: null
 ---
 
 # TODO: Surface config compilation errors in graphicHelper
 
 ## Problem Description
 
 Clear description of the issue, technical debt, or improvement needed. Include:
 - What is the current state?
   - Module compilation errors are surfaced via `state.compiler.compilationErrors` and the `'compilationError'` event; `graphicHelper` decorates affected code blocks (line gaps + error messages).
   - Config compilation errors are not surfaced in the same manner, and the configCompiler API differs from the code compiler API (do not assume identical shape or methods).
 - Why is this a problem?
   - Users editing config blocks lack immediate, line-specific feedback on errors.
 - What impact does it have?
   - Reduced usability and slower troubleshooting for configuration issues.
 
 ## Proposed Solution
 
 Detailed description of the proposed solution:
 - High-level approach
   - Mirror the module error visualization pipeline for config compilation errors, adapting to the configCompiler’s API.
 - Key changes required
   - Introduce `state.configCompiler.compilationErrors: Array<{ lineNumber, moduleId, code, message }>` populated on config compile failures (normalize from the configCompiler’s actual error shape).
   - Emit `'configCompilationError'` on failure and `'configBuildFinished'` on success.
   - Update `graphicHelper` to listen for these events and refresh visuals.
   - Ensure identifier mapping (`moduleId` ↔ `CodeBlockGraphicData.id`) works for config blocks.
 - Alternative approaches considered
   - Use a shared error array with a `scope` field (module|config) and reuse `'compilationError'`; deferred due to wider refactoring needs and API differences.
 
 ## Implementation Plan
 
 ### Step 1: Normalize config compiler errors
 - Specific task description
   - Catch config compile errors and normalize: `{ lineNumber, moduleId, code, message }` → `state.configCompiler.compilationErrors`.
 - Expected outcome
   - Consistent error payload similar to module errors (even though the source API is different).
 - Dependencies or prerequisites
   - Locate config compiler invocation and document its API differences.
 
 ### Step 2: Emit config compile events
 - Specific task description
   - Emit `'configCompilationError'` on failure and `'configBuildFinished'` on success.
 - Expected outcome
   - Downstream visuals refresh on error/success.
 - Dependencies or prerequisites
   - Event dispatcher access.
 
 ### Step 3: Update graphicHelper listeners
 - Specific task description
   - Add listeners in `graphicHelper` to call `updateGraphicsAll` on config events.
 - Expected outcome
   - Code blocks re-render when config compile state changes.
 - Dependencies or prerequisites
   - Ensure `graphicHelper` has `events` wiring.
 
 ### Step 4: Decorators consume config errors
 - Specific task description
   - Update `gaps` and `errorMessages` to read `state.configCompiler.compilationErrors` for blocks with `blockType === 'config'` and matching `moduleId`.
 - Expected outcome
   - Line-level gaps and error messages appear in config blocks.
 - Dependencies or prerequisites
   - Confirm ID derivation for config blocks.
 
 ### Step 5: Identifier mapping for config blocks
 - Specific task description
   - Verify whether `getModuleId(code)` applies to config blocks; if not, introduce `getConfigId(code)` and set `graphicData.id` accordingly.
 - Expected outcome
   - Accurate mapping of errors to blocks.
 - Dependencies or prerequisites
   - Parser for config identifiers.
 
 ## Success Criteria
 
 - [ ] Config compile failures populate `state.configCompiler.compilationErrors` with correct `moduleId` and `lineNumber`.
 - [ ] `'configCompilationError'` triggers `graphicHelper` to refresh.
 - [ ] Affected config code blocks show gaps and error message overlays matching the error entries.
 - [ ] `'configBuildFinished'` clears the markers on success.
 - [ ] Manual and automated tests verify mapping and rendering.
 
 ## Affected Components
 
 - `packages/editor/packages/editor-state/src/effects/compiler.ts` — reference model for module errors
 - `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts` — listeners and ID assignment
 - `packages/editor/packages/editor-state/src/effects/codeBlocks/gaps.ts` — inserts visual gaps
 - `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockDecorators/errorMessages/errorMessages.ts` — renders textual messages
 - `packages/editor/packages/editor-state/src/types.ts` — potential state additions
 
 ## Risks & Considerations
 
 - **Identifier mismatch**: If config IDs differ, errors may not map; mitigate with a config-specific ID parser.
 - **API differences**: Config compiler’s error shape and invocation differ from the module compiler; ensure normalization handles this correctly.
 - We do not need to debounce events.
 - We can assume `lineNumber` and `moduleId` will always be present.
 - We do not need to care about breaking changes.
 
 ## Related Items
 
 - **Related**: Brainstorming note in `brainstorming_notes/config-error-integration.md`
 
 ## References
 
 - `packages/editor/packages/editor-state/src/effects/compiler.ts`
 - `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts`
 - `packages/editor/packages/editor-state/src/effects/codeBlocks/gaps.ts`
 - `packages/editor/packages/editor-state/src/types.ts`
 
 ## Notes
 
 - Aim for parity with module error visuals first; add global panel filters later if needed.
 - Config compiler API differs; document the normalizer clearly.
 
## Archive Instructions
 
When this TODO is completed:
 1. Update the front matter to set `status: Completed` and provide the `completed` date
 2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
 3. Update the `todo/_index.md` file to:
    - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
    - Add the completion date to the TODO entry (use `date +%Y-%m-%d` if needed)