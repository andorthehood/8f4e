# 8f4e Website

`@8f4e/8f4e-website` is a minimal product page with an embedded default editor. The website controls the canvas size
and leaves wheel scrolling to the surrounding document.

From the workspace root:

```bash
npx nx run @8f4e/8f4e-website:dev
npx nx run @8f4e/8f4e-website:build
npx nx run @8f4e/8f4e-website:serve
```

The development server runs at `http://localhost:3001` so it can run alongside `@8f4e/editor-website`.

Set the canvas's `data-project-url` attribute in `src/index.html` to choose the project loaded when the editor mounts.
