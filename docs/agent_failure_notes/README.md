This folder contains short notes documenting recurring failure modes observed when using AI coding agents.

The purpose is to capture patterns: situations where an agent produced plausible changes that were locally reasonable yet systemically wrong.

These notes exist to support code review, debugging, and future agent usage by making these patterns easy to recognize before they escape into mainline code.

Each note documents a real incident and typically includes:
- the original goal or task,
- incorrect or misleading fixes that were attempted,
- and the correct solution or architectural boundary that should have been respected.

What this is not:
- This is not a list of bugs.
- This is not a critique of a specific AI models.