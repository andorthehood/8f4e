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

Builds regenerate a module in `src/modules/` only when its generator source changes or its output is missing.
The tracked `src/module-generators/generatedModules.json` manifest records each generator's source fingerprint
and its output fingerprint. Source fingerprints cover the self-contained generator and the shared
`generateModules.ts` writer; a writer change therefore invalidates every generated module.

Unchanged generators are not evaluated, so fresh checkouts retain the committed values even when JavaScript
math differs between environments. The minBLEP generator keeps its original eighteen decimal places.
The output fingerprint detects manual edits to generated files instead of silently accepting them.

`npx nx run @8f4e/examples:test` tests regeneration behavior and checks the saved fingerprints before running
the embedded module tests. The generator's `--check` mode verifies fingerprints and file presence without
running generators or rewriting files. After changing a generator, run
`npx nx run @8f4e/examples:build --skip-nx-cache` and commit the generator, regenerated module, and manifest
together. If a generated file was accidentally edited, restore it from Git; if it is missing, the next build
recreates it. A missing manifest causes a normal build to regenerate all modules and record their fingerprints.
