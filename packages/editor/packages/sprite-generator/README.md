# Sprite Generator Package

This package generates sprite sheets for the 8f4e editor, including fonts, icons, and UI elements.

## Font Bitmaps

Font bitmaps are precomputed from ASCII art sources and bundled as Base64-encoded payloads to reduce bundle size and eliminate runtime conversion overhead.

### Editing Fonts

Font glyphs are defined as ASCII art in the source files:

- `src/fonts/8x16/ascii.ts` - 8x16 ASCII character font
- `src/fonts/8x16/glyphs.ts` - 8x16 custom glyphs for UI elements
- `src/fonts/6x10/ascii.ts` - 6x10 ASCII character font
- `src/fonts/6x10/glyphs.ts` - 6x10 custom glyphs for UI elements

Each glyph is an array of strings where:
- `' '` (space) represents an unset pixel
- `'#'` represents a set pixel

Example:
```typescript
[ // Character 'A'
	'   #    ',
	'  ###   ',
	' ## ##  ',
	'##   ## ',
	'####### ',
	'##   ## ',
	'##   ## ',
]
```

### Regenerating Font Bitmaps

Font bitmaps are automatically regenerated as part of the build process. However, you can manually regenerate them:

```bash
# From the sprite-generator package directory
node tools/generate-font-bitmaps.mjs

# Or using Nx
npx nx run sprite-generator:generate-fonts
```

Generated files are located in:
- `src/fonts/8x16/generated/`
- `src/fonts/6x10/generated/`

These files are git-ignored and should not be committed.

### How It Works

1. **Build Time**: The `generate-font-bitmaps.mjs` tool reads ASCII art font definitions and converts them to numeric bitmaps.
2. **Encoding**: Numeric bitmaps are encoded as Base64 strings with metadata (character dimensions, glyph count).
3. **Runtime**: The `font-decoder.ts` utility decodes Base64 payloads back to numeric arrays for rendering.

This approach reduces the production bundle size by ~90% compared to shipping ASCII art sources.

## Development

```bash
# Build the package
npm run build

# Run tests
npm run test

# Type check
npm run typecheck

# Development mode with watch
npm run dev
```

## Bundle Size

Font bitmaps before optimization: ~79KB
Font bitmaps after optimization: ~8KB (90% reduction)
