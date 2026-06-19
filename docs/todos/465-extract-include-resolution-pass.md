---
title: 'TODO: Extract include resolution pass'
priority: Medium
effort: 1-2d
created: 2026-06-19
issue: null
status: Open
completed: null
---

# TODO: Extract Include Resolution Pass

## Problem Description

The current project preparser knows about project include blocks and stdlib include expansion. That was workable while
includes were a shallow source-expansion feature, but recursive stdlib includes add graph concerns that should live in a
separate compiler pass:

- scanning include blocks;
- loading stdlib source files;
- resolving include source trees;
- deduping repeated includes;
- detecting recursive include cycles;
- resolving public versus private include visibility;
- rewriting stdlib helper names and calls.

The include pass should not depend on `@8f4e/project-preparser`. It should parse only the tiny include grammar from raw
source text and return raw source tree data. The project parser can keep preserving editable include blocks for the
editor, while the include pass provides a compile-time derived view.

## Proposed Solution

Create a standalone package, `@8f4e/include-resolver`, that owns include-only parsing and source-tree resolution.

The first milestone stays intentionally narrow:

- parse raw source text directly;
- understand only `includes`, `include ...`, and `includesEnd`;
- allow zero or one include block per source;
- reject more than one include block;
- resolve direct include ids through a caller-provided callback;
- dedupe repeated direct include declarations;
- return a shallow tree of raw source strings;
- do not recursively inspect loaded stdlib sources yet.
- pass that tree into `@8f4e/project-preparser` through a structural interface, so the preparser does not import the
  include resolver package.

The first-pass output shape should remain raw-source-oriented:

```ts
type IncludeSourceTree = {
  source: string;
  children: IncludeSourceTreeNode[];
};

type IncludeSourceTreeNode = {
  includeId: string;
  source: string;
  children: IncludeSourceTreeNode[];
};
```

For now, the tree is shallow:

```txt
root project source
  ├─ raw stdlib source A
  └─ raw stdlib source B
```

Later recursive stdlib includes can extend the same shape:

```txt
root project source
  ├─ raw stdlib source A
  │   └─ raw stdlib source C
  └─ raw stdlib source B
```

## Design Decisions

- The include pass is a standalone compiler-adjacent package, not part of `@8f4e/project-preparser`.
- The include pass does not import or depend on `@8f4e/project-preparser`.
- The include pass parses raw source text itself and only recognizes include block syntax.
- The include pass does not parse functions, modules, constants, entries, groups, or compiler instructions.
- The editable project source is not stripped or mutated.
- The include pass returns raw source tree data for later passes to lower into compiler input.
- Only one include block is allowed per source.
- The first implementation resolves only direct includes and leaves child `children` arrays empty.
- Recursive loading, cycle detection, dependency-private visibility, and re-export behavior are later milestones.

## Current Status

First-slice extraction and raw-source orchestration are implemented. The remaining work is recursive stdlib loading,
cycle detection, and final visibility/re-export semantics.

## Anti-Patterns

- Do not put the include pass inside `@8f4e/project-preparser`.
- Do not make the include pass depend on project-preparser types or parsed project documents.
- Do not mutate the editor/project source to remove include blocks.
- Do not make the include-only parser a general project parser.
- Do not recursively load stdlib includes in the first extraction milestone.
- Do not concatenate include source into one raw string before the tree/lowering boundary is designed.

## Implementation Plan

### Step 1: Add the standalone include resolver package

- Add `packages/compiler/packages/include-resolver`.
- Add package metadata, Nx project config, Vite config, Vitest config, and TypeScript config.
- Depend only on `@8f4e/language-spec` for shared include delimiter facts.
- Export include resolver types and diagnostics from `src/index.ts`.

### Step 2: Parse include declarations from raw source

- Implement a raw source scan that returns:

```ts
type IncludeParseResult = {
  source: string;
  includes: IncludeDeclaration[];
};
```

- Recognize `includes`, `include <id>`, and `includesEnd`.
- Ignore blank lines and project-level comments inside the include block.
- Reject malformed include lines.
- Reject unclosed include blocks.
- Reject `includesEnd` without a matching opener.
- Reject multiple include blocks.

### Step 3: Resolve a shallow raw source tree

- Implement sync and async direct include resolution.
- Resolve each unique direct include id once.
- Throw include-resolution diagnostics when a direct include cannot be resolved.
- Return an `IncludeSourceTree` with the root source and one child per resolved include id.
- Leave every child `children` array empty in this first milestone.
- Add tests proving nested include declarations inside loaded child source are not followed yet.

### Step 4: Plan the lowering boundary

- First-slice lowering boundary: `@8f4e/project-preparser` accepts a structural source tree and lowers direct child raw
  sources into include function modules.
- Raw-source compiler/CLI orchestration should call `@8f4e/include-resolver` first, then pass the tree into the
  preparser.
- Keep the existing block-based editor path available until the editor has an explicit source-tree adapter.
- Later, decide whether include lowering should stay in project-preparser, move into a second include-lowering package,
  or live in a higher-level compiler-input orchestration package.

### Step 5: Add recursive loading later

- Parse child source include declarations.
- Resolve dependency graphs.
- Deduplicate diamond dependencies.
- Detect direct and indirect cycles.
- Preserve dependency-private visibility rules.
- Keep direct project includes as public visibility requests.

## Validation Checkpoints

- `npx nx run @8f4e/include-resolver:test`
- `npx nx run @8f4e/include-resolver:typecheck`
- `npx nx run @8f4e/include-resolver:build`

When changing the source-tree lowering boundary or raw-source orchestration, also run:

- `npx nx run @8f4e/project-preparser:test`
- `npx nx run @8f4e/project-preparser:typecheck`
- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`
- `npx nx run @8f4e/cli:test`
- `npx nx run @8f4e/cli:typecheck`
- `npx nx run @8f4e/examples:test`

## Success Criteria

- [x] A standalone `@8f4e/include-resolver` package exists.
- [x] The include resolver has no dependency on `@8f4e/project-preparser`.
- [x] Raw source with no include block parses successfully with zero include declarations.
- [x] Raw source with one include block returns include declarations with source line numbers.
- [x] Raw source with more than one include block fails.
- [x] Direct includes resolve into a shallow raw source tree.
- [x] Repeated direct include ids are resolved once and emitted once.
- [x] Loaded child source is not recursively inspected in the first milestone.
- [x] Raw-source compiler/CLI orchestration resolves include source trees before project preparsing.
- [x] Existing block-based editor behavior remains available until a block/source-tree adapter is designed.

## Affected Components

- `packages/compiler/packages/include-resolver` - new standalone include-only source resolution pass.
- `package-lock.json` - new workspace package link.
- `packages/compiler/AGENTS.md` - package map should mention the new pass.
- `packages/compiler/packages/project-preparser/src/functionIncludes.ts` - current include-function lowering helper.
- `packages/compiler/packages/project-preparser/src/prepareCompilerInput.ts` - accepts a structural source tree for
  raw-source orchestration.
- `packages/cli/src/compile/compileProject.ts` - raw source compile path resolves the include tree before preparsing.

## Risks & Considerations

- **Boundary clarity**: The include resolver must stay independent from project-preparser. If it starts importing parsed
  project documents or project block types, the separation is lost.
- **Editor source ownership**: Include blocks stay editable project content. Do not mutate project source as part of the
  pass.
- **Lowering boundary**: Returning raw source trees is deliberately separate from converting include files into function
  blocks. That lowering decision should be made explicitly.
- **Recursive loading**: The first milestone intentionally does not follow nested include blocks in child sources.
- **Future visibility rules**: Dependency-private visibility, project-public promotion, and re-export syntax still need a
  later design pass.

## Related Items

- **Depends on**: [464 - Require explicit stdlib include exports](./464-require-explicit-stdlib-include-exports.md)

## Notes

- Current first-slice implementation target: source tree extraction only, no recursive loading.
- Later recursive expansion should use canonical include ids for cycle detection and dedupe, not aliases or display names.
