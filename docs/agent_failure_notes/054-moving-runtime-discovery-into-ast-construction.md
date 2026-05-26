---
title: Agent Failure Note - Moving runtime discovery into AST construction
agent: Codex App
model: GPT-5
date: 2026-05-26
---

# Agent Failure Note - Moving runtime discovery into AST construction

## Short Summary

The agent was asked to harden compiler type interfaces so compiler phases would stop rediscovering facts by scanning AST lines. The implementation moved some discovery from later compiler phases into tokenizer AST construction, but still used extra line-scanning helpers instead of designing the AST construction path around the metadata it needed to produce.

## Original Problem

The refactoring goal was to make parsed AST objects specific and informative enough that downstream compiler code could rely on typed fields such as module ids, region lines, memory declarations, function signatures, exports, and module references. This was meant to remove defensive runtime checks and repeated `.find`, `.filter`, `.some`, or loop-based rediscovery in compiler phases.

The agent added metadata fields to AST objects, but also introduced helpers like:

```ts
function getReferencedModuleIds(lines: readonly CompilerASTLine[]): string[] {
	const referencedModuleIds = new Set<string>();

	for (const line of lines) {
		if (!isMemoryDeclarationLine(line)) {
			continue;
		}

		for (const argument of line.arguments) {
			for (const moduleId of getReferencedModuleIdsFromArgument(argument)) {
				referencedModuleIds.add(moduleId);
			}
		}
	}

	return [...referencedModuleIds];
}
```

This made downstream compiler code cleaner, but it did not fully honor the design intent. It turned "compiler phases should not repeatedly scan AST lines" into "the tokenizer does a separate scan after building the lines." That is still a discovery pass over an ambiguous line list, just earlier in the pipeline.

## Anti-Patterns

- Treating a moved runtime scan as equivalent to a hardened type interface.
- Adding metadata fields while computing them through ad hoc post-processing passes over `lines`.
- Optimizing for a local diff that removes downstream scans without checking whether the AST constructor itself became the new dumping ground for discovery logic.
- Calling the result a proper parsed interface while still relying on generic line-array traversal to infer important facts.
- Using helper extraction as a substitute for modeling source-block-specific AST construction.

This is especially risky in compiler code because it can create the appearance of stronger types while preserving the same ambiguity internally. Future agents may see the metadata fields and assume the architecture is fixed, even though the data is still derived by broad scans rather than owned by a specific parse path.

## Concrete Risks

- The AST object looks richer, but its metadata may still be incomplete or subtly inconsistent because each helper decides its own scan rules.
- New metadata fields may encourage more post-processing helpers instead of a coherent module/function/constants AST construction design.
- Tests may pass because downstream behavior improved, while the parser remains structured around generic line arrays.
- Future compiler phases may depend on metadata whose derivation is hard to audit because it is scattered through helper scans.
- The project can accumulate "almost typed" interfaces that reduce symptoms without removing the underlying ambiguity.

## Failure Pattern

Relocating runtime discovery earlier in the pipeline and mistaking that for a proper typed interface.

## Correct Solution

Design the AST construction path around the specific source-block type being parsed. Module AST construction should directly own module-specific metadata such as `moduleLine`, `regionLine`, `memoryDeclarationLines`, and `referencedModuleIds`; function AST construction should directly own function-specific metadata such as `functionLine`, `functionEndLine`, signature, and export data.

If metadata can be accumulated while parsing lines, do it there. If it needs a source-block construction pass, keep that pass cohesive and source-block-specific rather than scattering independent helper scans over `lines`. The compiler should receive an AST object whose interface makes invalid or ambiguous states hard to represent, not an object decorated by after-the-fact discovery.
