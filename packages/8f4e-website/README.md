# 8f4e Website

`@8f4e/8f4e-website` is a minimal product page with an embedded default editor. The website controls the canvas size
and leaves wheel scrolling to the surrounding document. Its embedded editors start in edit mode with mode switching
disabled.

From the workspace root:

```bash
npx nx run @8f4e/8f4e-website:dev
npx nx run @8f4e/8f4e-website:build
npx nx run @8f4e/8f4e-website:serve
```

The development server runs at `http://localhost:3001` so it can run alongside `@8f4e/editor-website`.

Set the canvas's `data-project-url` attribute in `src/index.html` to choose the project loaded when the editor mounts.

## Examples gallery

The separate `/examples/` page lists curated projects from `src/examples/projects.ts`. Each entry supplies a stable ID,
title, short description, and a path relative to `https://static.8f4e.com/example-projects/`. The homepage footer links
to the gallery. Vite builds both pages.

`projectCategories` in the same file defines category headings and their order. Projects are grouped by their
containing directory, with Amiga MODs listed separately from other audio examples. Category headings use `h2`
and individual example headings use `h3` on both desktop and mobile.

Above 800px, the list scrolls with the document while the selected editor stays fixed in the right column. At 800px
and below, the same panels become an accordion: the selected editor appears beneath its title and can be collapsed.
Resizing keeps the active editor instance. Without a selected example in the URL, mobile starts collapsed and desktop
opens the first example.

Each example has a shareable hash URL using its stable ID, such as `/examples/#granular-sampler`. Selecting an example
updates the address and page title; Back and Forward restore selections. Direct links also expand the matching mobile
accordion and scroll it into view. Collapsing a mobile example removes the selection from the URL. Unknown IDs fall back
to the default desktop selection or the collapsed mobile list.

Selecting a different example creates a fresh editor and disposes the previous instance. Mounts are serialized to
handle rapid selections, and each example uses its own session storage namespace. The gallery leaves wheel scrolling
to the page and provides a link to the full editor. Loading failures offer a retry.

## Typography

Departure Mono is a pixel font. Use font sizes in whole multiples of 14px (14px, 28px, 42px, and so on).
The examples gallery uses 14px text; the homepage uses 28px text. Keep these sizes explicit when adjusting typography.
