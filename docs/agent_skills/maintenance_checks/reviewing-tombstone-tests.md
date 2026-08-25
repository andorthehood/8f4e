# Reviewing Tombstone Tests

Use this check after removing a feature, menu item, field, API, compatibility path, or other obsolete behavior, and when reviewing tests added by an agent during that cleanup.

## Goal

Remove tests and assertions whose only purpose is to prove that intentionally deleted behavior is still absent. Keep negative tests that describe an active product, safety, or interoperability requirement.

## Terminology

This repository calls a test a **tombstone test** when it preserves the memory of something that was removed instead of verifying behavior the product still promises.

Typical examples include:

- asserting that a removed menu item cannot be found;
- asserting that a deleted object field is `undefined` or absent;
- asserting that an old directive, command, or export no longer exists;
- adding a type-level assertion that a removed property is not part of an interface;
- naming a test after old, legacy, or removed behavior solely to prevent it from returning.

These may also be described as absence regression tests. The important distinction is their intent: they encode repository history rather than a current contract.

## Why This Matters

Tests should explain and protect current behavior. Tombstone tests accumulate a negative history of the codebase and make ordinary cleanup look like a permanent product requirement.

Common costs:

- removed concepts remain visible in test names and fixtures;
- future contributors must understand behavior that no longer exists;
- test suites grow whenever something is deleted;
- harmless redesigns fail because a test protects the shape left behind by an old implementation;
- agents learn to add defensive absence assertions after every removal.

Deleting a feature should normally include deleting its tests. Do not replace those tests with assertions that the feature remains deleted.

## Detection Prompts

Start with negative assertions and historical wording in test files:

```sh
rg -n "not\\.to(HaveProperty|Contain|ContainEqual|Match)|toBeUndefined|does not|doesn't|without|removed|legacy|old" packages src -g '*.test.ts' -g '*.spec.ts'
```

Look specifically for menu or collection entries proved absent:

```sh
rg -n "find\\(.*\\).*toBeUndefined|some\\(.*\\).*toBe\\(false\\)|not\\.toContain" packages src -g '*.test.ts' -g '*.spec.ts'
```

Look for deleted runtime or type fields:

```sh
rg -n "not\\.toHaveProperty|expectTypeOf.*not\\.toHaveProperty" packages src -g '*.test.ts' -g '*.spec.ts'
```

These searches are intentionally broad. A negative assertion is a candidate, not automatically a tombstone test.

## Classification

Treat a test or assertion as a tombstone when all of these are true:

- it names or targets an intentionally removed concept;
- its main claim is that the concept is missing, ignored, undefined, or no longer accepted;
- the absence has no independent meaning in the current product contract;
- the test would not have been written if the removed concept had never existed.

Keep a negative test when the negative behavior is itself an active requirement, such as:

- invalid source is rejected with the correct diagnostic;
- permissions or modes hide actions from users who must not access them;
- private or secret data is excluded from serialized output;
- a filter excludes values according to its current documented semantics;
- mutually exclusive states cannot be constructed;
- an external wire format requires a field to be omitted rather than set to a value;
- a reported bug can still arise from current behavior, rather than only by restoring deleted code.

When uncertain, state the requirement without referring to repository history. If there is no useful current requirement to state, the assertion is probably a tombstone.

## Review Steps

1. Identify what was removed.

   Name the old item, field, directive, command, API, or compatibility path.

2. Find tests that still mention or negate it.

   ```sh
   rg -n "OldName|oldField|removed label" packages src
   ```

3. Read the surrounding test, not just the matching assertion.

   A stale negative assertion may be attached to a useful positive test. Remove only the stale assertion and rename the test around the behavior that remains.

4. Check history when intent is unclear.

   ```sh
   git blame -- <test-file>
   git log -S 'OldName' -- <test-file> <source-file>
   ```

   A negative assertion introduced in the same change that removed the named concept is a strong tombstone signal.

5. Delete the tombstone.

   - Delete the entire test when absence is its only claim.
   - Delete only the negative assertion when the test also verifies current behavior.
   - Remove unused imports, fixtures, and helpers left behind.
   - Do not replace the assertion with a snapshot, comment, or differently worded absence check.

6. Verify that remaining tests describe current behavior.

   Test names should make sense to someone who has never seen the removed implementation.

7. Run the narrowest relevant test and typecheck targets through Nx.

   ```sh
   npx nx run <project>:test
   npx nx run <project>:typecheck
   ```

## Examples

Remove a test like this after deleting a menu entry:

```ts
it('does not show the removed New Entry item', () => {
	const menu = createMainMenu();

	expect(menu.find(item => item.title === 'New Entry')).toBeUndefined();
});
```

If the assertion was added to a useful test, keep the positive behavior and remove the historical check:

```ts
it('creates a new module from the menu', () => {
	const item = createMainMenu().find(item => item.title === 'New Module');

	expect(item?.action).toBe('addCodeBlock');
	expect(item?.payload).toEqual({ isNew: true, blockType: 'module' });
});
```

Keep a negative test when it expresses a current rule:

```ts
it('hides editing actions in read-only mode', () => {
	const menu = createMainMenu({ readOnly: true });

	expect(menu.some(item => item.action === 'addCodeBlock')).toBe(false);
});
```

The last test is about access available in a supported mode, not about preserving a deletion.

## Review Notes

- Do not add a test merely because a feature or field was removed.
- Do not treat every `not`, `undefined`, or omitted-field assertion as a tombstone; classify it by current intent.
- Prefer positive tests of the behavior that remains.
- Avoid historical words such as `removed`, `old`, and `legacy` in active test names unless compatibility with that history is intentionally supported.
- A revert can restore deleted tests together with deleted code. The normal test suite does not need to act as a permanent record of every past removal.
