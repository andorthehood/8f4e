# @8f4e/examples

Example modules and projects used by the editor and tooling. Exports example modules under `modules/` and full projects under `projects/`.

## Contents

- `modules/`: reusable example modules.
- `projects/`: complete example projects.
- `src/benchmarks/bytecode-size/`: benchmark cases for measuring emitted bytecode size.

## Loading Examples

- The default editor discovers `.8f4em` files with `@8f4e/vite-plugin-sources` and derives module titles and categories
  from their paths. Opening the module menu loads only catalog metadata; selecting a module loads its source chunk
  on demand. Module sources ship with each website build.
- The product website bundles project `.8f4e` sources as downloadable assets for its homepage and examples gallery.
  The website gallery owns the project catalog.

The package build runs the module generators before consumers discover the source files. The editor compiles project
sources when they are loaded.
