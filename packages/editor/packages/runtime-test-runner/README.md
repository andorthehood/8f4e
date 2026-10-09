# Test Runtime

`@8f4e/runtime-test-runner` provides the selectable `TestRuntime` in the default editor. Add this editor configuration
directive to a project that has a test entry:

```8f4e
; @config runtime TestRuntime
```

The runtime executes the compiled `test` export once after each successful compilation or recompilation. Selecting
it after compilation executes the latest successful program once. It has no timer or repeating execution loop.
Projects without an enabled test entry and failed compilations do not run.

Execution uses `@8f4e/test-runner` in a dedicated worker with the editor's existing shared memory. The compiler worker
owns default initialization and patches changed defaults on recompilation. The test runner does not initialize or
reset supplied memory; test writes remain visible in the editor and survive recompilation according to the existing
compiler memory policy.

A new compilation or runtime disposal terminates the test worker; superseded results are ignored. The runtime
publishes its state under `state.runtime.values.TestRuntime`, containing
the status (`idle`, `running`, `passed`, `failed`, or `error`), static assertion sites, and completed
assertion results or runtime error. Assertion failures are also formatted in the browser console. Assertion icons
are a separate follow-up.

The result-state contract is shared through `@8f4e/editor-state-types`. The editor's assertion-marker effect
subscribes to these results and derives per-block `widgets.assertions` rectangles, which the web UI draws over
the assertion line numbers.

Validate from the workspace root:

```bash
npx nx run @8f4e/runtime-test-runner:build
npx nx run @8f4e/runtime-test-runner:test
npx nx run @8f4e/runtime-test-runner:typecheck
```
