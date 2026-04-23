# Extend CLI with runtime inspection `run` command

## Goal

Extend the existing `@8f4e/cli` package with a runtime inspection command that can:

- compile a `.8f4e` project
- instantiate the generated WebAssembly module
- initialize its memory in the standard way
- set named memory values from the command line
- run a specified number of cycles
- dump selected memory ids as JSON for debugging and later automated tests

This should be implemented by extending the existing CLI rather than creating a separate package.

## Proposed CLI shape

Replace the current ad-hoc top-level compile flags with explicit subcommands:

```bash
cli compile <project.8f4e> [--wasm-output <file>] [--trace-output <file>]
cli run <project.8f4e> [--cycles <n>] [--set <id>=<value>]... [--set-json <id>=<json>]... [--dump <id>]... [--out <file>]
```

Because the software is unreleased, it is acceptable to break the old CLI shape as long as internal usage sites and tests are updated together.

## `run` command behavior

Standard execution flow:

1. Parse the `.8f4e` project
2. Compile it to WebAssembly
3. Instantiate the module with memory
4. Initialize declared memory defaults
5. Call `init()`
6. Apply `--set` and `--set-json` overrides
7. Run `cycle()` the requested number of times
8. Dump only the requested memory ids

No extra init-related flags are needed in v1. The command should always run in the standard initialized way.

## Minimal `run` options for v1

- `--cycles <n>`
  - default: `1`
- `--set <id>=<value>`
  - scalar assignments
- `--set-json <id>=<json>`
  - array or structured assignments encoded as JSON
- `--dump <id>`
  - may be provided multiple times
- `--out <file>`
  - optional JSON output file path

Not needed in v1:

- bulk preload from a JSON state file
- dump-all mode
- explicit `initOnly` or `no-init` flags
- `buffer()` stepping (for now `cycle()` is enough)

## Output shape

Return JSON keyed by dumped memory id, for example:

```json
{
  "out": 0.123,
  "blepBuffer": [0.1, 0.0, -0.02],
  "delta": -0.4
}
```

This keeps the first version easy to inspect manually and easy to assert against in tests.

## Reuse points

The implementation should reuse existing pieces where possible:

- `.8f4e` parsing from the current CLI
- project compilation in the current CLI
- WebAssembly instantiation and memory initialization patterns from compiler test utilities

## Follow-up potential

Once `run` exists, it can also become the foundation for:

- fixture-driven runtime tests in CI
- deterministic debugging of DSP examples like `minBLEP`
- future trace/watch modes for selected memory ids across many cycles
