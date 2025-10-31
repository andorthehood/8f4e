# ASCII Art Font Format

This document describes the human-readable ASCII art format used for sprite fonts in the `sprite-generator` package.

## Overview

The 6×10 and 8×16 sprite fonts have been migrated from densely packed numeric bitmaps to ASCII art representations for improved readability and maintainability. The ASCII art format uses `' '` (space) for unset pixels and `'#'` for set pixels, maintaining a 1:1 mapping with the rendered output.

## Format Example

### 6×10 Font (6 pixels wide, 10 pixels tall)
```typescript
const glyphs = [
    [ // 65 'A'
        '   #  ',
        '   #  ',
        '   #  ',
        '  # # ',
        '  # # ',
        ' #####',
        ' #   #',
        ' #   #',
        '      ',
        '      ',
    ],
    // ... more characters
];

export default asciiGlyphsToFont(glyphs, 6);
```

### 8×16 Font (8 pixels wide, 16 pixels tall)
```typescript
const glyphs = [
    [ // 65 'A'
        '        ',
        '        ',
        '        ',
        '   #    ',
        '  ###   ',
        ' ## ##  ',
        '##   ## ',
        '##   ## ',
        '##   ## ',
        '####### ',
        '##   ## ',
        '##   ## ',
        '##   ## ',
        '        ',
        '        ',
        '        ',
    ],
    // ... more characters
];

export default asciiGlyphsToFont(glyphs, 8);
```

## File Locations

- **6×10 ASCII Font**: `packages/editor/packages/sprite-generator/src/fonts/6x10/ascii.ts`
- **6×10 Glyphs**: `packages/editor/packages/sprite-generator/src/fonts/6x10/glyphs.ts`
- **8×16 ASCII Font**: `packages/editor/packages/sprite-generator/src/fonts/8x16/ascii.ts`
- **8×16 Glyphs**: `packages/editor/packages/sprite-generator/src/fonts/8x16/glyphs.ts`
- **ASCII Converter**: `packages/editor/packages/sprite-generator/src/fonts/ascii-converter.ts`

## Converter Functions

The `ascii-converter.ts` module provides utilities for converting between ASCII art and numeric bitmap formats:

### `asciiToBitmap(asciiGlyph: string[], characterWidth: number): number[]`
Converts a single ASCII art glyph to a numeric bitmap array.

```typescript
const glyph = [
    '   #  ',
    '  ### ',
    ' #   #',
];
const bitmap = asciiToBitmap(glyph, 6);
// Returns: [0b000100, 0b001110, 0b010001]
```

### `bitmapToAscii(bitmap: number[], characterWidth: number): string[]`
Converts a numeric bitmap array to ASCII art format.

```typescript
const bitmap = [0b000100, 0b001110, 0b010001];
const glyph = bitmapToAscii(bitmap, 6);
// Returns: ['   #  ', '  ### ', ' #   #']
```

### `asciiGlyphsToFont(asciiGlyphs: string[][], characterWidth: number): number[]`
Converts an array of ASCII art glyphs to a flat array of numbers expected by the font rendering system.

## Bit Ordering

The converter preserves the bit ordering used by the original numeric format:
- Most significant bit (MSB) represents the leftmost pixel
- Least significant bit (LSB) represents the rightmost pixel
- Each row is a separate byte (number)

For example, for a 6-bit wide character:
```
'   #  ' → 0b000100 (bit 2 is set)
' #####' → 0b011111 (bits 1-5 are set)
```

## Editing Fonts

To edit a font glyph:

1. Open the appropriate font file (e.g., `src/fonts/6x10/ascii.ts`)
2. Locate the character you want to edit (characters are ordered by ASCII code)
3. Modify the ASCII art representation:
   - Use `' '` (space) for unset pixels
   - Use `'#'` for set pixels
4. Ensure each row has the correct width (6 for 6×10, 8 for 8×16)
5. Save the file
6. Build and test: `npx nx build sprite-generator && npx nx test sprite-generator`

## Conversion Scripts

Conversion scripts are available in `packages/editor/packages/sprite-generator/scripts/` for migrating between formats:

- `convert-6x10-ascii.mjs`: Convert 6×10 ASCII font from numeric to ASCII art
- `convert-8x16-ascii-full.mjs`: Convert 8×16 ASCII font from numeric to ASCII art
- `convert-8x16-glyphs.mjs`: Convert 8×16 glyphs from numeric to ASCII art

These scripts are primarily for reference and were used during the initial migration.

## Testing

The font converter has comprehensive test coverage in `tests/ascii-converter.test.ts` including:
- Basic conversion tests
- Round-trip conversion tests (ASCII → bitmap → ASCII)
- Edge cases (empty rows, all pixels set, etc.)
- Regression tests comparing old and new font outputs

## Benefits

The ASCII art format provides several advantages over the previous numeric bitmap format:

1. **Readability**: Visual representation makes it easy to see what each character looks like
2. **Editability**: Simple to modify glyphs by editing text
3. **Code Reviews**: Easier to spot errors and review changes
4. **Onboarding**: New contributors can understand the font structure immediately
5. **Maintainability**: No need for helper utilities like `pad`, `same`, `mirr`, `invert`

## Migration Notes

The old numeric format files are preserved with `-old.ts` suffix for reference:
- `src/fonts/6x10/ascii-old.ts`
- `src/fonts/6x10/glyphs-old.ts`
- `src/fonts/8x16/ascii-old.ts`
- `src/fonts/8x16/glyphs-old.ts`

These files can be removed once the migration is fully validated and the new format is confirmed to work correctly in all contexts.

## Performance

The ASCII art format is converted to numeric bitmaps at runtime using the `asciiGlyphsToFont` function. This conversion happens once during module initialization and has negligible performance impact compared to the original helper-driven composition.
