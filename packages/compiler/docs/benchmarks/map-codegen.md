# Map Code Generation Benchmark

Reverse-order map lowering preserves first-match-wins results while allocating two temporary locals instead of four.
Each row now emits a comparison and a selection without maintaining a matched flag or saving the comparison result.

## Results

Measured on 2026-10-09 using Node v24.16.0 on arm64 macOS 14.7.7. The baseline was compiled from revision
`950b705be4fd7add74e4296c1b29ba050e6720e0`; the optimized variant used the same source fixtures and compiler options.
Sizes include the complete WebAssembly program, not just the lookup body.

| Rows | Baseline bytes | Optimized bytes | Run 1 baseline → optimized | Run 2 baseline → optimized | Speedup range |
| ---- | -------------- | --------------- | -------------------------- | -------------------------- | ------------- |
| 4 | 233 | 163 | 7.082 → 6.814 ms | 7.185 → 6.854 ms | 1.04–1.05× |
| 16 | 557 | 309 | 19.895 → 9.365 ms | 20.210 → 9.757 ms | 2.07–2.12× |
| 64 | 1,863 | 895 | 55.820 → 23.292 ms | 57.202 → 23.158 ms | 2.40–2.47× |

These timings isolate calls to an exported integer lookup function. They are not whole-application speedups or test
thresholds. Small maps mainly benefit from smaller output; JavaScript call and loop overhead limits their timing gain.

## Method

The retained [benchmark script](../../../../scripts/benchmark-map-codegen.mjs) generates 4-, 16-, and 64-row integer maps.
The final row duplicates the first key with a different value; each map has an explicit fallback of `-7`. Inputs cycle
through matching and nonmatching keys. Before timing, both programs must validate as WebAssembly and return the expected
first-source-match results for every input. Every timed sample also checks the result checksum.

Each sample calls the exported lookup one million times. The script alternates baseline/optimized execution order,
discards three warmup rounds, and reports the median of nine measured rounds. Two complete runs produced the results
above. Compilation and instantiation are outside the timed section.

Separate compiler runtime tests cover all nine input/output combinations of `int`, `float`, and `float64`, empty and
one-row maps, implicit and explicit defaults, duplicate keys, NaN/infinite inputs, signed-zero keys/results, and distinct
source keys that round to the same float32 value. Those tests passed before and after the optimization.

## Reproduce

Use the repository's Node version (`nvm use`) and build the compiler through Nx. In the baseline checkout, copy the
benchmark script into `scripts/` if that revision predates it, then capture the generated binaries and source:

```sh
npx nx run @8f4e/compiler:build
node scripts/benchmark-map-codegen.mjs --capture /tmp/8f4e-map-baseline
```

In the optimized checkout, build again and compare against that same directory:

```sh
npx nx run @8f4e/compiler:build
node scripts/benchmark-map-codegen.mjs --baseline /tmp/8f4e-map-baseline
```

The script verifies that both variants compile identical fixture source. Keep the same Node version and machine for
both captures and comparisons, and run timing comparisons when other builds or tests are idle.
