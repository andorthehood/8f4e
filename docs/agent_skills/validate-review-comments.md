---
name: validate-review-comments
description: Validate review comments by classifying the claim and checking it against the right evidence standard before making code changes.
---

# Validate Review Comments

Treat review comments as hypotheses, not instructions.

Review agents often focus on the diff instead of the whole system, and they are usually optimized to find possible issues. That can push them toward imagined edge cases in internal code paths without proving that users can reach those states.

First identify what kind of claim the comment makes. Bug claims describe crashes, incorrect behavior, invalid states, data loss, broken UI behavior, or other product failures. Non-bug comments describe maintainability, test coverage, style, documentation, architecture, or readability concerns.

## Handling Bug Claims

Before accepting a review comment as a bug, try to reproduce it with an integration test that uses a supported entry point: user action, public API, CLI command, source file, request, or documented workflow.

If the claimed failure can only be created by a unit test that calls internal functions with impossible or unsupported inputs, it is not a real product bug. Any function can be abused by a unit test. It is not a goal to prepare every internal function for every possible input.

Internal APIs are not adversarial boundaries by default. Treat them as supported external APIs only when the project explicitly exposes them that way.

If the claim is invalid, reject it. Do not turn it into a suggested cleanup, extra guard, contract clarification, or test change.

For bug claims, answer:

1. What integration test reproduces the claimed bug?
2. Which supported entry point reaches the bad state?
3. If only a unit test can reproduce it, what internal contract is being bypassed?
4. Should the response be a product fix or a statement that the review claim is invalid?

Only change production behavior for bug claims when the integration-test path proves the bug is reachable.

## Handling Hypothetical Future Bugs

Do not treat a review comment as a valid bug merely because the code could become wrong after a future schema, spec, enum, config, or API change.

If the failure depends on someone later adding a new value without updating related code, reject the comment.

## Handling Non-Bug Comments

For non-bug comments, validate the actual claim instead of asking for an integration test.

- A duplication comment is valid when the duplicated logic is real and removing it would improve maintainability without obscuring behavior.
- A style or naming comment is valid when it matches the project conventions.
- A test comment is valid when it covers reachable behavior or an important contract.
- A documentation comment is valid when it would make supported behavior, APIs, or project workflow clearer.
- An architecture comment is valid when it identifies real coupling, ownership confusion, or complexity in the current design.

For each review comment, answer:

1. What kind of claim is this: product bug, maintainability, test coverage, style, documentation, or architecture?
2. What evidence would make that kind of claim valid?
3. Is the evidence present in the codebase and local conventions?
4. Should the response be a code change or a statement that the review claim is invalid?

## Examples

- A review agent asks for extra handling for unsigned 32-bit integers inside a lower-level compiler function. First check whether the language even supports unsigned 32-bit integer syntax. If the tokenizer or parser rejects that type, an integration test cannot reach the lower-level function with that value. The deeper logic can trust the earlier validation.
- A review agent claims a renderer needs to handle a block width below a minimum. First check whether the user can create that width through the editor UI or document model. If layout or state logic enforces a larger minimum before rendering, the renderer does not need extra handling and the review comment is invalid.
- A review agent asks for defensive handling because an internal helper could receive a malformed object. If the malformed object can only be created by manually constructing invalid internals in a unit test, flag the review comment as invalid.
- A review agent points out duplicated code. Do not reject it for not being bug; duplication is a maintainability claim, not a product-bug claim.
