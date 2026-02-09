# Code block position instruction migration

## Context
We want to stop storing code block grid positions in `project.json` (`codeBlocks[].gridCoordinates`) and instead keep position in the code itself via an editor instruction:
- `# position <x> <y>` (example: `# position 14 -18`)

The `graphicHelper` should set runtime block position from this instruction.

## Decisions
- We can break API/format compatibility because the software is not released yet.
- We do **not** need legacy project format support for `codeBlocks[].gridCoordinates`.
- We should update projects in the `packages/examples` package o the new format.
- We should keep the `# position` instruction in the code block code (do not remove it during load/render).

## Open design question
Shader blocks (`vertexShader` / `fragmentShader`) do not currently follow the same compile/runtime path as normal module/function blocks, so we need to decide how position instructions should behave for them.

Options to evaluate:
- Use `# position` in shader blocks exactly the same way as other blocks.
- Keep shader block positions in a separate editor-only storage path.
- Exclude shader blocks from position instruction migration (likely not ideal due to inconsistent UX/format).

## Next planning step
Define the exact shader-block behavior first, then implement:
1. parsing and writing `# position`,
2. `graphicHelper` load/update behavior,
3. export shape change,
4. examples package migration.
