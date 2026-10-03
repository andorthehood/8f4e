# Sprite Atlas Extender

- Package: `@8f4e/sprite-atlas-extender`. Source lives in `src/`; output lives in `dist/`.
- Keep the package generic: composition definitions belong to consumers such as web-ui.
- Use glugglugglug's existing public API for baking. Do not add renderer APIs for atlas extension.
- Run tasks through Nx: `npx nx run @8f4e/sprite-atlas-extender:build|test|typecheck|test:browser`.
- Unit tests cover packing, identifier collisions, input preservation, and resource cleanup.
- Browser tests verify actual WebGL-to-canvas pixels, transparency, and orientation.
- Use Biome for TypeScript formatting and lint fixes.
