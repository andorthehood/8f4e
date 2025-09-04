Goal

- Replace fixed grid placement with an atlas packer that places variably sized sprites tightly, updates
lookups, and renders all draw commands at packed positions.

Data Model

- SpriteDef: id + size + draw commands (local 0,0).
    - id: string | number
    - width: number; height: number
    - pad?: number (default 1–2 to prevent bleeding)
    - allowRotate?: boolean (default false; enable case-by-case)
    - commands: Command[] (existing commands; all coords relative to 0,0)
- PackedSprite: id, x, y, width, height, rotated?: boolean
- AtlasResult: width, height, sprites: PackedSprite[]

Integration Plan

- Step 1: Make generators output sprite defs
    - Change each generateX(...) to return:
    - an array of `SpriteDef`s instead of drawing directly at absolute positions
    - each `SpriteDef`’s `commands` produce the sprite content relative to its own (0,0)
    - sizes:
      - fonts: `characterWidth x characterHeight`
      - plotter: `1 x characterHeight*8` (or whatever you currently use)
      - icons: from `generateIconPositions(...)`
      - background tile: `64*characterWidth x 32*characterHeight`
      - piano keys: from function constants
- Step 2: Add a packer and wire it in src/index.ts
    - Collect all SpriteDefs
    - Run packer → AtlasResult
    - Create canvas sized to atlas result (optionally round to next power-of-two)
    - For each packed sprite:
    - `ctx.save(); ctx.translate(x, y); draw(sprite.commands); ctx.restore();`
- Build final spriteLookups from packed positions:
    - `{ spriteX: x, spriteY: y, spriteWidth: width, spriteHeight: height }`
- Step 3: Keep lookup IDs stable
    - Use the same keys currently exposed by generateLookup* so no changes are required in the 2D
engine or editor code.

Packer Algorithm

- Use Skyline (Bottom-Left) or MaxRects. Skyline BL is simple, robust, and fast for UI atlases.
- Features:
    - Padding per sprite
    - Optional rotation (per-sprite)
    - Dynamic atlas grow: if a rect can’t fit, either grow width/height or start a new page
(multi-atlas optional)

Example TypeScript (Skyline BL, single atlas, dynamic grow):

- 
Note: This is compacted for clarity; productionize with tests and bounds checks.
- 
Types:
    - Node { x: number; y: number; width: number } skyline nodes.
- 
Packing procedure:
    - Maintain skyline nodes describing the top profile.
    - For each rect (sorted by height desc, then width desc):
    - Find position with minimal y and then minimal x where the rect fits.
    - Insert node and merge adjacent nodes.

Pseudo-implementation:

- src/packer.ts
    - packSprites(sprites: SpriteDef[], startW=256, startH=256, maxW=2048, maxH=2048): AtlasResult

Key code sketch:

- Sorting
    - const items = sprites.map((s, i) => ({...s, index:i})).sort((a, b) => b.height - a.height ||
b.width - a.width);
- Find position
    - Iterate skyline nodes, test fit with padding and rotation
- Place and update skyline
    - Insert new node { x, y + h, width: w }, then merge contiguous nodes with same height
- Grow
    - If no fit: double lesser side if under max, else double other side; retry

Lookup Generation

- Replace all generateLookupForX to return sizes keyed by id instead of absolute coordinates.
Centralize mapping after packing:
    - Old: fixed x, y formulas.
    - New: packer decides x, y; lookups use those coordinates with the original keys.
- This preserves the public contract that the engine consumes:
    - SpriteCoordinates = { x: spriteX, y: spriteY, spriteWidth, spriteHeight }

Padding and Bleeding

- Use pad = 1 or 2 pixels between sprites.
- Fill padding area by duplicating edge pixels if you see bleeding with min-filtering; often not
necessary with nearest + clamp-to-edge.
- Keep ctx antialias off (already configured).

Rotation

- Only enable for sprites that are visually rotation-invariant or where rotation would not break
semantics. For text/glyphs, keep allowRotate = false. For solid bars/background tiles, true can help
packing density.

Power-of-Two vs NPOT


- If sprites can never fit under maxW x maxH, implement multi-atlas:
    - Produce AtlasResult[] and multiple canvas pages.
accept pages.

Testing

- Unit tests:
    - Deterministic packing for a fixed list of SpriteDefs
    - No overlaps (sweep-line intersects)
    - Respect padding and rotation flags
- Visual check:
    - Debug draw: outline packed rects in the atlas with ids in visual-testing/index.ts.
    - Sample rendering in editor to ensure lookups line up.


Migration Tips
- Bridge layer: Create helpers per generator:
SpriteDefs so you can evaluate the approach end-to-end?