# `@8f4e/project-preview`

Generates GIF preview images from 8f4e project files with the production editor renderer.

## Icon previews

The `icon` format finds the first valid `@home` code block, or falls back to the first root code block, places its
top-left corner at the image origin, hides editor-only overlays, and captures a 64 by 64 pixel image.

```sh
npx nx run @8f4e/project-preview:build
node packages/project-preview/bin/8f4e-preview.js icon path/to/project.8f4e --out path/to/icon.gif
```

GIF output is silently quantized to an optimized palette of at most 256 colors with dithering disabled. When `--out`
is omitted, the image is written next to the project as `<project-name>.icon.gif`.

The package also exports `generateProjectPreview` for programmatic use.
