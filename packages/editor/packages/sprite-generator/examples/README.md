# Color Helper Examples

This directory contains examples demonstrating the usage of color helper utilities in the sprite-generator package.

## derived-color-scheme.ts

A comprehensive example showing how to use `lighten()`, `darken()`, `alpha()`, and `mix()` to derive a complete color scheme from a base color.

Key techniques demonstrated:
- **Darkening/Lightening**: Create variations of a base color for different UI elements
- **Alpha blending**: Add transparency to colors for overlays and layering effects
- **Color mixing**: Blend two colors to create harmonious combinations
- **Gradient creation**: Use `mix()` with different weights to create color gradients

To see this example in action, import and use the `derivedColorScheme` in your sprite generator configuration:

```typescript
import { derivedColorScheme } from '@8f4e/sprite-generator/examples/derived-color-scheme';
import generateSprite from '@8f4e/sprite-generator';

const { canvas, spriteLookups } = generateSprite({
  font: '8x16',
  colorScheme: derivedColorScheme
});
```
