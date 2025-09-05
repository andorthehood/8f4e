What you have now

- Runtime: The generator draws into a 1024x1024 canvas using flat fills and few colors and returns
lookups (packages/sprite-generator/src/index.ts). Fonts are small arrays (~12 KB each; total
fonts+glyphs ~32 KB).
- Bundle footprint: The dist for the package is ~296 KB including maps; min+gzip of just the generator
code and tables will be far lower in the final app bundle.
- Engine: Accepts HTMLImageElement/HTMLCanvasElement/OffscreenCanvas, so swapping in a prebuilt image
works without engine changes.

When an asset can be bigger than code

- Many variations: If you ship a sprite per theme/font combo, assets can multiply.
- High-entropy art: Photographic/noisy content compresses poorly; procedural code can stay tiny.
- Otherwise: Flat-color UI sprites with a tiny palette usually compress extremely well as PNG8/
WebP lossless. A 1024x1024 palettized PNG for this kind of art is often 20–120 KB; WebP lossless is
frequently smaller.

Practical approach (hybrid, size-gated)

- Build both: At build time, render the sprite sheet once and emit:
    - sprite.<hash>.png and sprite.<hash>.webp
    - sprite-lookups.json (your existing lookups)
- Measure: Pick the smaller of PNG/WebP and compare to the code you can drop if you don’t generate at
runtime. If the asset is smaller, ship it; otherwise, keep runtime generation.
- Select at runtime:
    - Flag VITE_SPRITE_SOURCE=asset|runtime
    - If asset, load image + JSON and pass the image to engine.loadSpriteSheet(...)
    - Else, call generateSprite(...) as today.

Asset size optimizations (big wins for your art)

- Palette: Force PNG8 (≤256 colors; likely ≤32 here). Use median-cut/neuquant. Flat UI art shrinks
dramatically.
- Format: Emit both PNG8 and WebP lossless; choose smallest.
- Trim: Remove transparent gutters around sprites; store per-sprite offsets in your lookup.
- Atlas pack: Pack tightly rather than fixed grids; update lookups accordingly.
- Quantize: Snap colors to a shared palette across themes where possible.
- Dimensions: Don’t default to 1024x1024 if the packed atlas needs less.

When to keep runtime generation

- Combinatorics: Many user-selectable color schemes/fonts (combinatorial explosion of assets).
- Procedural variability: Sprites depend on dynamic/session inputs.
- Extremely tight JS budgets: If you already ship the generator for other reasons and assets wouldn’t
be cached well.

Suggested implementation steps

- Refactor a tiny seam in the generator to return “drawing commands” separately (you already have a
Command enum and arrays), so the same code can run in a headless context.
- Add a script under packages/sprite-generator/scripts that:
    - Renders a sheet in a headless browser (or Node canvas) using your existing visual-testing setup.
    - Writes PNG8 and WebP to packages/sprite-generator/dist/sprites/.
    - Emits sprite-lookups.json from generateLookup functions.
    - Logs sizes and writes a manifest indicating the chosen asset per theme/font.
- Add an editor loader branch:
    - If asset: import the manifest, new Image().src = spriteUrl, await load, pass to engine; load
lookups JSON into state.
    - Else: use current generateSprite path.
- Wire Vite static-copy to include the sprite and lookups into the root dist/ and use hashing for
cache-busting.

Bottom line

- For your specific flat, low-palette UI sprites, a palettized PNG/WebP is likely smaller than the
code you retain after removing runtime generation. But don’t assume—measure and let the build decide
per variant.