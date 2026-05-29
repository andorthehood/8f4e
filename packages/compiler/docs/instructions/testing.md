# Testing

## Assert Utility

The CLI test command provides an imported utility function named `assert`.

**Stack effect:** `int int --`

**Syntax:** `call assert`

**Usage:**

```8f4e
entry test
module addWorks
push 1
push 2
add
push 3
call assert
moduleEnd
entryEnd```

**Behavior:**
- Push the received value first, then the expected value.
- `call assert` consumes both integer values.
- The CLI test runner injects `function assert` as a host import before compiling tests.
- The CLI host implementation counts each call and reports calls where the received value differs from the expected value.

**Host import ABI:**

```ts
host.assert(received: number, expected: number): void
```

The compiler does not treat `assert` as a built-in instruction. It is just an imported function supplied by the CLI test runner.

**Limitations:**
- Float assertions and approximate comparisons are not supported yet
- Source-location tracking for assertion failures is not supported yet
