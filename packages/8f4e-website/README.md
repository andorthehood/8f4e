# 8f4e Website

`@8f4e/8f4e-website` is an example product landing page with two independently mounted default editors. It tests
embedding multiple editor canvases in a normal scrolling document, with the website controlling each canvas's size.

From the workspace root:

```bash
npx nx run @8f4e/8f4e-website:dev
npx nx run @8f4e/8f4e-website:build
npx nx run @8f4e/8f4e-website:serve
```

The development server runs at `http://localhost:3001` so it can run alongside `@8f4e/editor-website`.
