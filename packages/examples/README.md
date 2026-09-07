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

## Generated Modules

Builds regenerate the lookup tables in `src/modules/` from `src/module-generators/`, leaving matching files
untouched. The minBLEP generator
serializes values to eight decimal places to suppress low-bit floating-point drift, with a maximum rounding
error of `5e-9`. Its table includes the final zero and the extra zero used as an interpolation guard.

`npx nx run @8f4e/examples:test` checks that every generated module matches its saved source before running
the embedded module tests. The generator's `--check` mode compares files without rewriting them.
After changing a generator, run `npx nx run @8f4e/examples:build --skip-nx-cache` and commit both the generator
and its regenerated modules.
