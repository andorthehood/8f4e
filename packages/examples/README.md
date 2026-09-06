# @8f4e/examples

Example modules and projects used by the editor and tooling. Exports example modules under `modules/` and full projects under `projects/`.

## Contents

- `modules/`: reusable example modules.
- `projects/`: complete example projects.
- `src/benchmarks/bytecode-size/`: benchmark cases for measuring emitted bytecode size.

## Hosted Examples

- Modules are deployed to Cloudflare R2 at `https://static.8f4e.com/example-modules/` with `registry.json`.
- Projects are deployed as individual `.8f4e` and `.wasm` files to Cloudflare R2 at `https://static.8f4e.com/example-projects/`.
  The website gallery owns the project catalog; no project registry is generated or published.
- `generate-module-registry.mjs` generates `dist/registries/example-modules.json` for the editor’s built-in module browser.
