# @8f4e/test-runner

Shared test execution for compiler fixtures and the `cli test` command. The runner instruments assertion calls with
`@8f4e/test-precompiler` (the nested workspace package in `packages/test-runner/packages/test-precompiler/`), adds typed
host assertion imports, creates memory, calls `initDefaults()` and `test()`, and
returns all assertion results. Assertion failures are returned as data; adapters decide how to report them.

The compiler fixture adapter owns snapshot generation and fixture include/memory-region options. The CLI adapter owns
file selection, standard-library includes, and terminal output. Both use this package for execution and failure text.

## Usage

```ts
import { compileProject, parseProjectSource } from '@8f4e/compiler';
import { formatTestFailures, hasTestEntry, runTestProject } from '@8f4e/test-runner';

const project = parseProjectSource(source);
if (hasTestEntry(project)) {
	const result = await runTestProject(project, {
		compile: instrumented => compileProject(instrumented, { disableSharedMemory: true }),
	});
	if (result.failures.length) console.error(formatTestFailures(result.failures));
}
```

The compile callback receives a project with three-parameter assertion declarations (`received`, `expected`, `siteId`).
It must compile with non-shared memory and supply any include resolver or memory-region configuration needed by the
project. The returned `compileResult` retains the callback's full result type, including data needed for snapshots.
The input project is preserved. Run on the original project once; do not instrument it separately first.

## Assertion results

`assertionSites` lists static calls, including calls in branches that never execute. `assertions` records runtime
invocations in execution order, with `assertIndex`, `received`, `expected`, `passed`, and the original `site`.
`failures` contains the failing invocations. Repeated loop invocations share a site ID but have distinct invocation
indices. The comparison tolerance is 0.001; NaN comparisons fail.

A site contains the project block ID, group path, module/function name, and zero-based physical line within that block.
`formatTestFailures` displays a one-based **block line**, for example:

```text
1 assertion failed:
  assert #0 expected 4, received 3 at module addFails, block line 6 (site 0)
```

Adapters add the source filename. Site IDs are scoped to one run, and preserve the precompiler's original source
mapping. Assertions in unresolved includes are outside the instrumentation pass; included helper functions can be
resolved by the compiler callback, but assertion calls themselves must be in the supplied project blocks.

## Validation

Use `npx nx run @8f4e/test-runner:build|test|typecheck|lint`. Real compiler/Wasm integration coverage lives in
`packages/compiler/tests/testRunner.test.ts`; compiler fixtures and CLI tests exercise the same runner.
