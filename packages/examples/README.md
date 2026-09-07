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
untouched. The minBLEP pipeline uses BigInt fixed-point arithmetic for its window, FFT, logarithm,
exponential, interpolation, and normalization. It keeps sixty decimal places internally and emits
floating-point source literals rounded to eighteen decimal places only at the final step. The generator
does not use platform-dependent `Math` functions or a source-fingerprint manifest.

`npx nx run @8f4e/examples:test` tests the fixed-point math and generation workflow, then compares all
generated modules with their saved sources before running embedded module tests. The generator's `--check`
mode performs that comparison without rewriting files. After changing a generator, run
`npx nx run @8f4e/examples:build --skip-nx-cache` and commit the generator and regenerated modules together.
