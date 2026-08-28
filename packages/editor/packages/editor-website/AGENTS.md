# Editor Website Package Guidelines

- Keep this package thin: HTML, hosting assets, deployment configuration, and mounting the default composition.
- Product behavior and integration wiring belong in `@8f4e/editor-default`.
- Reusable editor behavior belongs in `@8f4e/editor-core`.
- Run `npx nx run @8f4e/editor-website:build` after changing this package.
