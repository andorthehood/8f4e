# Testing

## assert

Compares the top stack value with an expected integer value and reports a failure through the test host import when they differ.

**Stack effect:** `int --`

**Syntax:** `assert <expected-int>`

**Usage:**

```8f4e
group test
module addWorks
push 1
push 2
add
assert 3
moduleEnd
groupEnd
```

**Behavior:**
- `assert` consumes the top stack value
- The expected value must resolve to an integer compile-time value
- Passing assertions do not call the host
- Failed assertions call `test.assertFailed(assertIndex, expected, received)` and execution continues
- The compiler returns assertion metadata mapping each `assertIndex` to its module id, source line, and expected value

**Host import ABI:**

```ts
test.assertFailed(assertIndex: number, expected: number, received: number): void
```

The host function does not need to throw. A runner can collect calls during execution and report all failures afterward.
The CLI test runner executes the `test` execution group, but `assert` is valid in any module.

**Limitations:**
- Float assertions and approximate comparisons are not supported yet
- Assertion execution tracking is not supported yet
