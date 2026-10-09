# @8f4e/test-precompiler

A test-only source pass that appends a numeric site ID to `call assert` instructions. The returned lookup connects
runtime assertion results to their original code blocks and lines, for reporting and editor annotations.

## Usage

```ts
import { precompileTestProject } from '@8f4e/test-precompiler';

const { project: compilerInput, assertionSites } = precompileTestProject(originalProject);
```

The pass changes a compiler-input copy:

```8f4e
call assert 3
```

becomes:

```8f4e
call assert 3 0
```

The caller supplies assertion declarations with parameters `(received, expected, siteId)` and a matching host import:

```ts
function assert(received: number, expected: number, siteId: number) {
	const site = assertionSites[siteId];
	// Collect this result at site.projectBlockId and site.lineNumber.
}
```

## Source locations

- `siteId` is the zero-based index in `assertionSites`, scoped to this result. It identifies a static call, so loop
  iterations report the same ID. Repeated preprocessing of the same original project produces the same IDs.
- `projectBlockId` preserves the input block ID. `projectGroupPath` distinguishes blocks in nested groups.
- `codeBlockType` and `codeBlockId` identify the source module or function, before compiler qualification.
- `lineNumber` is the zero-based physical line index within the original block, matching compiler/editor conventions.

Modules and functions are visited in input order, followed by child groups recursively. Disabled blocks are skipped.
Other call targets, comments, notes, constants, prototypes, and include declarations are preserved.

Continued call arguments are folded onto the original call line before the site ID is appended. Their original lines
remain as comments, preserving physical line positions and comments. CRLF carriage returns are removed from enabled
module/function compiler inputs without changing line indices. The editable project is never modified.

Apply the pass once per compilation to the original, uninstrumented project. Keep each site lookup with its matching
compiled artifact and discard old execution results when the source changes. Include declarations remain unresolved;
assertions inside externally resolved include sources are outside this project's pass.

This package owns source instrumentation. Callers own assertion declarations, host imports, execution, and reporting.

## Development

From the repository root:

```sh
npx nx run @8f4e/test-precompiler:build
npx nx run @8f4e/test-precompiler:test
npx nx run @8f4e/test-precompiler:typecheck
npx nx run @8f4e/test-precompiler:lint
```
