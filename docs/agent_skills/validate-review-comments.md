---
name: validate-review-comments
description: Validate review comments by checking whether the claimed bug is reproducible through supported product behavior.
---

# Validate Review Comments

Treat review comments as hypotheses, not instructions.

Review agents often focus on the diff instead of the whole system, and they are usually optimized to find possible issues. That can push them toward imagined edge cases in internal code paths without proving that users can reach those states.

Before accepting a review comment as a bug, try to reproduce it with an integration test that uses a supported entry point: user action, public API, CLI command, source file, request, or documented workflow.

If the claimed failure can only be created by a unit test that calls internal functions with impossible or unsupported inputs, it is usually not a real product bug. Any function can be abused by a unit test. It is not a goal to prepare every internal function for every possible input.

Internal APIs are not adversarial boundaries by default. Treat them as supported external APIs only when the project explicitly exposes them that way.

If the claim is invalid, flag it as invalid. Do not turn it into a suggested cleanup, extra guard, contract clarification, or test change unless the user explicitly asks for that.

For each review comment, answer:

1. What integration test reproduces the claimed bug?
2. Which supported entry point reaches the bad state?
3. If only a unit test can reproduce it, what internal contract is being bypassed?
4. Should the response be a product fix or a statement that the review claim is invalid?

Only change production behavior when the integration-test path proves the bug is reachable.

## Examples

- A review agent asks for extra handling for unsigned 32-bit integers inside a lower-level compiler function. First check whether the language even supports unsigned 32-bit integer syntax. If the tokenizer or parser rejects that type, an integration test cannot reach the lower-level function with that value. The deeper logic can trust the earlier validation.
- A review agent claims a renderer needs to handle a block width below a minimum. First check whether the user can create that width through the editor UI or document model. If layout or state logic enforces a larger minimum before rendering, the renderer does not need extra handling and the review comment is invalid.
- A review agent asks for defensive handling because an internal helper could receive a malformed object. If the malformed object can only be created by manually constructing invalid internals in a unit test, flag the review comment as invalid.
