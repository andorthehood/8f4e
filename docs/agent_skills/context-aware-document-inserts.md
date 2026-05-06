---
name: context-aware-document-inserts
description: Edit or prepend document text without introducing unexplained forward references or breaking the document's existing structure.
---

# Context-Aware Document Inserts

When adding text to an existing document, treat the insertion point as part of the document's reading order. New text must make sense to a reader at that point, using only information already introduced or immediately explained.

This matters most when prepending text near the beginning of a document. Agents often write an introduction after reading the whole document, then accidentally reference concepts, decisions, terminology, or examples that are only explained later.

## Workflow

1. Read the local structure before writing.
   - Identify the surrounding headings.
   - Note which concepts have already been introduced before the insertion point.
   - Note which concepts are introduced only later.

2. Draft from the reader's current knowledge.
   - Avoid references to later-only terminology unless the new text briefly defines it.
   - Avoid saying "this", "the above", "as discussed", or similar references when the referenced material comes later.
   - Keep prepended text broad enough to orient the reader without depending on later details.

3. Preserve the document's progression.
   - Do not front-load conclusions that the document builds toward later.
   - Do not duplicate later explanations unless a short preview is useful.
   - Add a transition only when it helps the existing next section still follow naturally.

4. Verify by reading forward from the insertion point.
   - Read the new text and the next section as if they are the reader's first encounter with the topic.
   - Check that every term, reference, and assumption is either already known, self-explanatory, or introduced in place.
   - If the new text relies on later material, either remove the reference, define it briefly, or insert the text later instead.

## Examples

- If prepending an overview to a design note, do not mention a specific internal mechanism before the document has named or explained it. Introduce the broader problem first, then let the existing section introduce the mechanism.
- If adding a summary before a failure analysis, avoid references like "the tokenizer boundary described below" unless the summary explains that boundary in one sentence.
- If adding a new opening paragraph to a todo, do not assume the reader already knows the final implementation plan. State the user-facing goal first, then let later sections explain the plan.
