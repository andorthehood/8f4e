# Postmortem: Runtime Definitions Refactoring Misinterpretation

**Date:** 2026-01-23  
**TODO Reference:** #205 - Move Runtime Definitions into Runtime Packages  
**Agent:** @copilot

## What Went Wrong

The TODO asked to move runtime factories, schemas, and defaults **into runtime packages** (e.g., `packages/runtime-web-worker-logic/src/runtimeDef.ts`). Instead, I:

1. Created `metadata.ts` files in runtime packages (partial compliance)
2. Created NEW files in `src/runtime-defs/` directory in the host layer (wrong location)
3. Left the factory code in the host layer instead of moving it to runtime packages

**Expected outcome:** Runtime packages should export complete `RuntimeRegistryEntry` objects  
**Actual outcome:** Runtime packages export metadata; host layer still contains factory code in new directory

## Root Cause Analysis

### What I Focused On (Incorrect Priority)

1. **Circular dependency concerns** - I fixated on Step 1's mention of "if package-level coupling to `@8f4e/editor` is undesirable" and the Risks section's "Type coupling" concern
2. **Technical obstacles** - I encountered issues with:
   - Runtime packages being worker code without browser API access
   - Import errors for `@8f4e/editor` types
   - The `?worker` and `?url` Vite-specific imports not working in package context
3. **"Host callbacks" pattern** - I interpreted "pass them into the factory via parameters" (Step 2) as meaning the factories must stay in the host

### What I Missed (The Core Intent)

1. **Step 2's clear directive**: "Move these files from `src/` into their owning runtime packages"
   - The TODO explicitly listed the exact file moves: `src/runtime-web-worker-logic-factory.ts` → `packages/runtime-web-worker-logic/src/runtimeDef.ts`
   - This was NOT a suggestion; it was the primary instruction

2. **Step 3's explicit export format**: `export const webWorkerLogicRuntimeDef: RuntimeRegistryEntry = { id, defaults, schema, factory }`
   - This clearly shows the ENTIRE definition (including factory) should be exported from the package

3. **Step 5's import pattern**: `import { webWorkerLogicRuntimeDef } from '@8f4e/runtime-web-worker-logic'`
   - The host should import complete definitions, not construct them

4. **Success Criteria #1**: "Each runtime package exports a single runtime definition object"
   - This means a complete `RuntimeRegistryEntry`, not just metadata

### Why I Went Off Track

1. **Overthinking the constraints** - I treated the "Risks & Considerations" section as blockers rather than considerations to address
2. **Premature optimization** - I tried to avoid circular dependencies before confirming they were actually a problem
3. **Misreading conditional language** - "If package-level coupling to `@8f4e/editor` is undesirable" was presented as an option, not a requirement, but I treated it as a mandate to avoid the coupling
4. **Not following the steps literally** - I interpreted the implementation plan as guidelines rather than explicit instructions

## What Would Have Helped

### Clear TODO Structure

**Instead of:**
```markdown
### Step 2: Move factories into runtime packages
- Move these files from `src/` into their owning runtime packages
- Ensure each factory still imports `getCodeBuffer/getMemory` or equivalent from the host layer if that is the current pattern; if those callbacks live in the host app, consider moving them into a shared compiler-callback package or passing them into the factory via parameters.
```

**Use this format:**
```markdown
### Step 2: Move factories into runtime packages [REQUIRED]

**Action:** Move these exact files (do not create new files):
- `src/runtime-web-worker-logic-factory.ts` → `packages/runtime-web-worker-logic/src/runtimeDef.ts`
- `src/runtime-main-thread-logic-factory.ts` → `packages/runtime-main-thread-logic/src/runtimeDef.ts`
- (etc.)

**If you encounter import errors:**
- For `getCodeBuffer/getMemory`: Import from `'../../src/compiler-callback'` (relative path from package to host)
- For type dependencies: Import from `@8f4e/editor` - this IS acceptable
- For `?worker` imports: Use relative imports within the package

**Do NOT:**
- Create new directories in `src/` for these files
- Split metadata and factories into separate files
- Keep any factory code in the host layer
```

### Explicit Success Criteria with Examples

**Instead of:**
```markdown
## Success Criteria
- [ ] Each runtime package exports a single runtime definition object.
```

**Use:**
```markdown
## Success Criteria

- [ ] Each runtime package exports a COMPLETE runtime definition object
  **Example:**
  ```typescript
  // packages/runtime-web-worker-logic/src/runtimeDef.ts
  export const webWorkerLogicRuntimeDef: RuntimeRegistryEntry = {
    id: 'WebWorkerLogicRuntime',
    defaults: { runtime: 'WebWorkerLogicRuntime', sampleRate: 50 },
    schema: { /* ... */ },
    factory: (store, events) => { /* factory implementation */ }
  };
  ```

- [ ] Host registry ONLY imports and assembles (does not define):
  **Example:**
  ```typescript
  // src/runtime-registry.ts
  import { webWorkerLogicRuntimeDef } from '@8f4e/runtime-web-worker-logic';
  
  export const runtimeRegistry = {
    [webWorkerLogicRuntimeDef.id]: webWorkerLogicRuntimeDef,
    // ...
  };
  ```

- [ ] NO factory code remains in `src/` directory
  **Verification:** `find src -name "*factory*" -o -name "*runtime-def*"` should return empty
```

### Constraints as Conditional Fallbacks, Not Primary Paths

**Instead of:**
```markdown
- If package-level coupling to `@8f4e/editor` is undesirable, create a minimal host types export
```

**Use:**
```markdown
- Package-level coupling to `@8f4e/editor` IS acceptable and expected for this refactor
- **Only if** TypeScript errors occur that cannot be resolved, consider creating minimal type exports (but attempt the straightforward solution first)
```

### Explicit Anti-Patterns Section

**Add:**
```markdown
## Anti-Patterns (What NOT to Do)

❌ **Do NOT** create new directories in `src/` like `src/runtime-defs/`
   - The goal is to MOVE code OUT of `src/`, not reorganize it within `src/`

❌ **Do NOT** split metadata and factory into separate files
   - Keep the complete definition in one file per runtime

❌ **Do NOT** create factory creator functions in the host
   - Factories should be defined in runtime packages, even if they import host utilities

✅ **Do** move the entire factory file content into the package
✅ **Do** keep factory and schema together in the same file
✅ **Do** import host utilities if needed (use relative paths if necessary)
```

### Step-by-Step Validation Checkpoints

**Add after each step:**
```markdown
### Step 2 Validation

Before proceeding to Step 3, verify:
- [ ] Files physically moved (not copied): `git status` shows deleted `src/runtime-*-factory.ts`
- [ ] New files in packages: `ls packages/runtime-*/src/runtimeDef.ts` lists 4 files
- [ ] No new files in `src/`: `find src -name "*runtime*" -newer HEAD~1` returns only `runtime-registry.ts`
```

## Concrete Wording Improvements

### Priority Markers
Use `[REQUIRED]`, `[OPTIONAL]`, or `[IF NEEDED]` tags on every instruction:

```markdown
### Step 2: Move factories [REQUIRED]
- [REQUIRED] Move these files...
- [IF NEEDED] If you encounter circular dependencies, consider...
```

### Imperative vs. Conditional
Distinguish between:
- **Primary path:** "Move the factory into the runtime package"
- **Fallback:** "If this creates unresolvable errors, then..."

### Verification Commands
Include concrete shell commands to verify each step:

```markdown
### Step 2 Complete - Run these checks:
```bash
# Verify moves (should show D for deleted)
git status | grep "src/runtime.*factory"

# Verify new locations exist
ls packages/runtime-*/src/runtimeDef.ts

# Verify no new host files
find src -type f -name "*runtime*" -newer HEAD~1
```
```

### File Content Templates
Provide template showing what the final file should look like:

```markdown
### Expected file structure after Step 2:

packages/runtime-web-worker-logic/src/runtimeDef.ts:
```typescript
import WebWorkerLogicRuntime from '@8f4e/runtime-web-worker-logic?worker';
// ... other imports ...

export const webWorkerLogicRuntimeDef: RuntimeRegistryEntry = {
  id: 'WebWorkerLogicRuntime',
  defaults: { /* ... */ },
  schema: { /* ... */ },
  factory: (store, events) => {
    // Factory implementation (moved from src/)
  }
};
```

## Key Lessons

1. **Follow literal instructions first** - When steps say "Move file X to location Y," do exactly that before considering alternatives
2. **Constraints are not blockers** - "Considerations" and "Risks" sections describe what to watch for, not what to avoid at all costs
3. **Success criteria define the end state** - Use them to validate the approach before implementation
4. **When in doubt, pick the simplest interpretation** - The most straightforward reading of the instructions is usually correct
5. **Verify against examples** - If the TODO shows `import { X } from 'package'`, that's what the final code should look like

## Recommendations for Future TODOs

1. Start each step with `[REQUIRED]` or `[OPTIONAL]` tags
2. Provide "Anti-patterns" section showing what NOT to do
3. Include file path examples in every step
4. Add validation commands after each step
5. Separate "Primary path" from "Fallback approaches" clearly
6. Include code templates showing expected file structure
7. Use concrete success verification commands, not just descriptions
