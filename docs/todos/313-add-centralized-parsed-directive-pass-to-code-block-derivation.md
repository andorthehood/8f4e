---
title: 'TODO: Add centralized parsed-directive pass to code-block derivation'
priority: Medium
effort: 1-2d
created: 2026-03-16
status: Open
completed: null
---

# TODO: Add centralized parsed-directive pass to code-block derivation

## Problem Description

Directive-related features currently parse code comments independently by rescanning raw code block lines in separate feature paths.

That creates a weak architectural shape:

- multiple passes walk the same code blocks repeatedly
- project order and line attribution logic are duplicated
- runtime directives and editor directives are parsed in separate local systems
- feature subscriptions can drift, causing one directive system to update differently from another

This is already visible in the runtime-directive work, where `~sampleRate` resolution currently loops through all code blocks independently instead of consuming a shared parsed representation.

## Proposed Solution

Add a centralized parsed-directive pass to the main code-block derivation/update path.

The first goal is structural, not semantic:

- scan each code block's lines once during the main derivation pass
- parse directive comment lines generically
- attach lightweight parsed directive records to each `CodeBlockGraphicData`

Suggested initial record shape:

```ts
type ParsedDirectiveRecord = {
  prefix: '@' | '~';
  name: string;
  args: string[];
  rawRow: number;
};
```

This pass should not resolve runtime/editor meaning yet.
It should only collect parsed directive records so downstream features can consume a shared source of truth.

## Anti-Patterns

- Do not build a large plugin/hook framework as the first step.
- Do not resolve all directive semantics inside the central pass.
- Do not store block-local resolved meaning for project-global directives such as `~sampleRate`.
- Do not keep new directive systems scanning raw code independently after the parsed-directive pass exists.

## Implementation Plan

### Step 1: Add parsed-directive storage to code block graphic data
- Extend `CodeBlockGraphicData` with a `parsedDirectives` field.
- Keep the stored data minimal: prefix, name, args, and raw row.

### Step 2: Parse directives during the central code-block derivation pass
- Update the main graphics/code-block derivation flow to scan each block's lines once.
- Parse both `; @...` and `; ~...` comments during that pass.
- Store the parsed records on each block.

### Step 3: Migrate runtime-directive resolution to consume parsed records
- Refactor the runtime-directive feature so it reads `codeBlock.parsedDirectives` instead of rescanning raw code.
- Preserve project-global resolution and conflict detection semantics.

### Step 4: Prepare gradual migration for editor directives
- Leave existing editor-directive features working initially.
- Identify the next directive consumers to migrate onto `parsedDirectives` incrementally.

## Validation Checkpoints

- `npx nx run editor:test`
- `npx nx run editor:typecheck`
- `rg -n "parsedDirectives|parseRuntimeDirective|parseDirectiveComment" packages/editor/packages/editor-state/src`

## Success Criteria

- [ ] `CodeBlockGraphicData` includes parsed directive records.
- [ ] The main code-block derivation pass populates parsed directive records for `@` and `~` comment directives.
- [ ] Runtime-directive resolution no longer rescans raw code block lines directly.
- [ ] Parsed records preserve correct project order and raw row attribution.
- [ ] The change does not yet force a full editor-directive semantic refactor.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/` - central code-block derivation path
- `packages/editor/packages/editor-state/src/features/runtime-directives/` - migration to parsed directive input
- `packages/editor/packages/editor-state/src/features/code-blocks/types.ts` - block shape extension
- `packages/editor/packages/editor-state/src/features/code-blocks/features/directives/` - future consumers of shared parsed records

## Risks & Considerations

- **Overreach**: the first step should only centralize parsing, not attempt to redesign all directive semantics at once.
- **State churn**: parsed records should be lightweight and deterministic to avoid noisy block updates.
- **Migration timing**: some directive consumers may continue to use legacy parsing temporarily, but new systems should prefer the shared parsed records.

## Related Items

- **Related**: `docs/todos/312-add-runtime-samplerate-directive-and-begin-config-block-replacement.md`
- **Related**: `docs/brainstorming_notes/033-centralize-project-directive-parsing.md`

## Notes

- This TODO is meant to happen before adding many more runtime directives.
- The main architectural goal is to centralize line scanning while keeping resolution logic feature-owned.
