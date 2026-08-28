# Default Editor Package Guidelines

- This package owns the standard editor composition: compiler integration, runtime selection, example registries,
  standard-library resolution, and browser persistence.
- Export composition APIs without mounting as an import side effect.
- Keep generic editor behavior in `@8f4e/editor-core` and website/deployment concerns in `@8f4e/editor-website`.
- Run `npx nx run @8f4e/editor-default:build|test|typecheck` after changing this package.
