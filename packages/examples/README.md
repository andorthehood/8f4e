# @8f4e/examples

Example modules and projects used by the editor and tooling. Exports example modules under `modules/` and full projects under `projects/`.

## Contents

- `modules/`: reusable example modules.
- `projects/`: complete example projects.
- `src/benchmarks/bytecode-size/`: benchmark cases for measuring emitted bytecode size.

## Hosted Examples

- Modules are deployed to Cloudflare R2 at `https://static.8f4e.com/example-modules/` with `registry.json`.
- The product website bundles project `.8f4e` sources as downloadable assets for its homepage and examples gallery.
  The website gallery owns the project catalog; projects need no separate deployment or precompiled WASM files.
- `generate-module-registry.mjs` generates `dist/registries/example-modules.json` for the editor’s built-in module browser.

The package build generates example modules and their registry. The editor compiles project sources when they are loaded.
