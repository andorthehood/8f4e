# @8f4e/test-runner

Shared native assertion execution for compiler fixtures and `cli test`. The compiler emits
assertion imports and static source sites. This package supplies collecting callbacks, executes the `test` export,
and returns failures as data. Sources are compiled unchanged.

## Compile and run a project

```ts
import { compileProject, parseProjectSource } from '@8f4e/compiler';
import { formatTestFailures, hasTestEntry, runTestProject } from '@8f4e/test-runner';

const project = parseProjectSource(source);
if (hasTestEntry(project)) {
  const result = await runTestProject(project, {
    compile: (project, options) => compileProject(project, { ...options, resolveInclude }),
  });
  if (result.failures.length) console.error(formatTestFailures(result.failures));
}
```

The compile callback receives the original project and `{ enableAssertions: true, disableSharedMemory: true }`.
Forward those options along with caller-specific includes and memory regions. The runner allocates fresh non-shared
memory for every region, calls `initDefaults()` exactly once, and calls `test()`. The callback's full compilation
result is retained, so fixture adapters can serialize snapshots. The runner has no compiler implementation dependency.

## Assertions and reporting

```8f4e
entry test
module addWorks
push 1
push 2
add
push 3
assertEqual
push 1
assert
moduleEnd
entryEnd
```

`assert` passes for nonzero integers. `assertEqual` compares matching integer, float32, float64, or pointer values
exactly. Pointers compare addresses. NaN fails, matching infinities pass, and signed zero compares equal. Express
approximate expectations explicitly with arithmetic and `assert`; no tolerance is hidden in the runner.

`createAssertionCollector(sites)` exposes the same callbacks and a serializable `getReport()` for hosts that own
execution themselves. Collecting callbacks return normally after failures. `assertionSites` includes all static
sites, including unexecuted branches. `assertions` records each invocation with `assertIndex`, `site`, `instruction`,
and `passed`; condition results contain `condition`, equality results contain `received` and `expected`. `failures`
contains failed invocations. Loops share a static site but have distinct invocation indices. Reports are snapshots of
the results so far.

Failure formatting uses one-based physical block lines and included-source provenance:

```text
1 assertion failed:
  assertEqual #0 expected 4, received 3 at module addFails, block line 6 (site 0)
```

Site IDs belong to one compilation. Static sites and every invocation are retained in the report, including sites
that were never executed.

## Validation

Use `npx nx run @8f4e/test-runner:build|test|typecheck|lint`. Real compiler/Wasm integration coverage lives in
`packages/compiler/tests/testRunner.test.ts`, terminal reporting in `packages/cli/tests/cli.test.ts`.
