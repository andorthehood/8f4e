# Subscription notification benchmark

Issue: [#555](https://github.com/8f4e/8f4e/issues/555).
Baseline: `990396b56a9297df9904bfd97f6e193d39dc66a0` (upstream/main on 2026-10-22).

`notifications.mjs` exercises only the public `createStateManager`, `subscribe`,
`subscribeToValue`, `set`, `getState`, and `dispose` API against TypeScript-built JS.
Each group registers two ancestor subscriptions, one leaf subscription, one primitive
matcher and one predicate matcher on `tree.branch.node.leaf.value`. Group counts
1, 8, and 32 give 5, 40, and 160 matching subscriptions; 16 unrelated subscriptions
are always present. Values alternate between 0 and 1. Each mode/group has its own
manager, 10,000 warmup updates, then seven samples of 20,000 updates. Timed loops
include callbacks, but exclude subscription setup and assertions. Every sample
checks the exact callback count (80,000 / 640,000 / 2,560,000) and final state.
Parent replacement alternates two preallocated trees to isolate notification work.

## Reproduction

Use Node v24.16.0 (`nvm use`) and installed workspace dependencies. Capture a
baseline build in a clean checkout at the baseline commit before applying the change:

```sh
export NX_DAEMON=false NX_ISOLATE_PLUGINS=false NX_NO_CLOUD=true NX_TUI=false
npx nx run @8f4e/state-manager:build
mkdir -p /tmp/8f4e-555-baseline
cp -R packages/editor/packages/editor-core/packages/state-manager/dist /tmp/8f4e-555-baseline/
```

After applying the change, build the optimized version. From the repository root,
run the same script against each build in separate processes, without concurrent
builds/tests. Reverse the order for the repeat:

```sh
npx nx run @8f4e/state-manager:build
node packages/editor/packages/editor-core/packages/state-manager/benchmarks/notifications.mjs /tmp/8f4e-555-baseline/dist/index.js > /tmp/8f4e-555-before.json
node packages/editor/packages/editor-core/packages/state-manager/benchmarks/notifications.mjs > /tmp/8f4e-555-after.json
node packages/editor/packages/editor-core/packages/state-manager/benchmarks/notifications.mjs > /tmp/8f4e-555-after-repeat.json
node packages/editor/packages/editor-core/packages/state-manager/benchmarks/notifications.mjs /tmp/8f4e-555-baseline/dist/index.js > /tmp/8f4e-555-before-repeat.json
```

The original baseline was measured before changing the implementation. Its compiled
output was saved and reused for the repeat. The results below combine the two runs
per version: median of all 14 samples, with minimum–maximum in parentheses.
Raw samples, run order, environment and callback counts are in [results.json](results.json).

## Results

2026-10-22, Apple M2, macOS arm64, Node v24.16.0. Milliseconds per 20,000 updates;
reduction is `100 * (1 - after / before)` using pooled medians.

| Update | Matching subscriptions | Before ms (range) | After ms (range) | Time reduction |
| --- | ---: | ---: | ---: | ---: |
| Leaf | 5 | 10.672 (10.311–11.191) | 8.299 (8.046–8.615) | 22.2% |
| Leaf | 40 | 60.033 (58.766–62.286) | 43.277 (40.337–90.785) | 27.9% |
| Leaf | 160 | 220.129 (214.774–262.547) | 149.369 (140.424–180.243) | 32.1% |
| Parent replacement | 5 | 10.042 (9.499–12.818) | 7.677 (7.262–9.580) | 23.6% |
| Parent replacement | 40 | 58.448 (55.275–72.975) | 41.148 (35.371–48.537) | 29.6% |
| Parent replacement | 160 | 212.608 (201.908–246.565) | 124.231 (122.598–157.006) | 41.6% |

Each separate run also has a lower optimized median in all six scenarios. The
benefit is consistent with eliminating one selector split per matching subscription;
the update selector is still tokenized once and subscriptions are still scanned.

This is a local microbenchmark, not an editor/frame-time or browser benchmark.
Callback work is deliberately minimal. JIT, GC, scheduling, CPU frequency and
other machine activity affect timing; the 40-subscription leaf case has visible
outliers. Reversing process order reduces order bias but does not provide statistical
confidence intervals or establish performance on other engines/hardware. No timing
thresholds are enforced in unit tests.
