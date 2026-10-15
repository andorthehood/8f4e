# Default Editor Package Guidelines

- This package owns the standard editor composition: compiler integration, runtime selection, the example module registry,
  standard-library resolution, and browser persistence.
- Export composition APIs without mounting as an import side effect.
- Keep generic editor behavior in `@8f4e/editor-core` and website/deployment concerns in `@8f4e/editor-website`.
- Run `npx nx run @8f4e/editor-default:build|test|typecheck` after changing this package.
- The Vite build uses standard TypeScript and asset handling; project-authored GLSL effects are not supported.
- Stdlib discovery uses `@8f4e/vite-plugin-sources` in `vite.config.ts`. Resolve the stdlib package root through its
  exported manifest; keep the source collection's IDs relative to that root. The resolver imports the generated
  `virtual:8f4e-sources/stdlib` collection. Its tests must register the same plugin.
