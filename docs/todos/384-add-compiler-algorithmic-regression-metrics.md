---
title: 'TODO: Add compiler algorithmic regression metrics'
priority: Medium
effort: 1-2 days
created: 2026-04-28
status: Open
completed: null
---

# TODO: Add compiler algorithmic regression metrics

## Problem Description

The compiler has snapshot coverage for many structural outputs, but there is no release-level signal for algorithmic regressions.

Raw compile duration is a weak primary metric because it varies by machine, runner load, CPU governor, and Node/V8 version. What we need instead is a way to detect when compiler cost grows faster than input size for representative compiler workloads.

This should catch cases such as:

- a lookup path accidentally becoming quadratic
- macro expansion or semantic normalization doing repeated full-program scans
- memory or function resolution retaining more data than expected
- a helper suddenly dominating V8 CPU profile samples

## Proposed Solution

Add a compiler complexity benchmark script that runs deterministic generated fixtures at multiple sizes and records curve-shape metrics.

Use machine-independent or mostly machine-independent signals as the primary dashboard inputs:

- peak heap used
- heap used delta
- sampled allocation size from V8 heap profiling, if practical
- GC count
- CPU profile sample counts and top sampled functions

Timing can be captured as secondary context, but the dashboard should focus on ratios across input sizes in the same run rather than absolute milliseconds.

## Fixture Families

Start with generated fixtures that stress different compiler paths:

- `linear-instructions` - many independent instructions for baseline throughput
- `many-locals` - many local declarations and reads to catch local lookup regressions
- `many-functions` - many functions and calls to catch function resolution regressions
- `nested-macros` - macro expansion pressure
- `memory-heavy` - many memory declarations and accesses
- `large-real-example` - one real project fixture to keep synthetic coverage grounded

Each generated fixture should run at multiple sizes, for example `100`, `1_000`, `10_000`, and `50_000` instructions or declarations where practical.

## Implementation Plan

### Step 1: Add deterministic fixture generators

- Create fixture generators under a compiler benchmark or scripts folder.
- Keep generated source deterministic and small enough to run in CI.
- Use named fixture families so historical logs remain stable.

### Step 2: Add an isolated benchmark runner

- Run each fixture size in a fresh Node process.
- Prefer `--expose-gc` so the runner can collect before/after heap baselines.
- Capture `process.memoryUsage()` and `v8.getHeapStatistics()` around the compile call.
- Optionally collect V8 CPU profiles with `--cpu-prof` for top sampled functions.

### Step 3: Log release metrics

- Append records to `logs/compiler-complexity/@8f4e/compiler.json`.
- Store only graph-oriented numeric data plus stable fixture names.
- Include commit, version, recorded timestamp, Node version, and V8 version for interpretation.

Suggested record shape:

```json
{
	"schemaVersion": 1,
	"recordedAt": "2026-04-28T00:00:00.000Z",
	"commit": "abc123",
	"packageName": "@8f4e/compiler",
	"version": "0.1.4",
	"node": "v22.15.1",
	"v8": "12.4.254.21-node.24",
	"fixtures": [
		{
			"name": "many-locals",
			"size": 10000,
			"inputBytes": 420000,
			"peakHeapUsedBytes": 18000000,
			"heapUsedDeltaBytes": 6500000,
			"gcCount": 3,
			"cpuProfileSamples": 1250
		}
	]
}
```

### Step 4: Add derived dashboard signals

- Graph raw per-size metrics per fixture family.
- Graph ratios between adjacent fixture sizes.
- Highlight regressions where input doubles but memory, allocation, or sample count grows far beyond `2x`.
- Keep wall-clock timing separate and clearly labeled as CI-environment dependent if added.

## Validation Checkpoints

- `npx nx run @8f4e/compiler:build`
- `node --expose-gc scripts/<compiler-complexity-script>.mjs`
- Verify the same fixture family produces stable size labels across runs.
- Verify ratio calculations are based on metrics within the same run, not across different machines.

## Success Criteria

- [ ] Compiler complexity metrics are logged per release without relying on absolute wall-clock time as the primary signal.
- [ ] Generated fixture families cover linear instructions, locals, functions, macros, memory-heavy programs, and one real project.
- [ ] Logs contain enough V8/Node metadata to explain runtime differences.
- [ ] The metrics dashboard can graph fixture-size curves and adjacent-size ratios.
- [ ] Obvious superlinear regressions are visible from the dashboard without opening profiler artifacts manually.

## Affected Components

- `packages/compiler` - benchmarked compiler entry points and fixture source shapes
- `scripts/` - benchmark runner and log appender
- `logs/compiler-complexity/` - historical release metrics
- `packages/metrics-dashboard` - future charts for compiler complexity curves
- `.github/workflows/release.yml` - optional release-time collection once the script is stable

## Risks & Considerations

- **Runner noise**: use ratios across fixture sizes in the same run instead of absolute duration as the main signal.
- **V8 drift**: Node/V8 upgrades can change heap behavior and profiler sampling; log versions with every record.
- **Profiler overhead**: CPU and heap profiling can perturb execution. Treat profile data as diagnostic context, not the only regression signal.
- **CI cost**: large generated fixtures should be sized so release runs stay reasonable.
- **False confidence**: synthetic fixture families should be complemented by at least one real project fixture.

## Related Items

- **Related**: `054` Benchmark Unrolled vs Normal Loop in Audio Buffer Filler
- **Related**: `305` Reuse WASM instance across incremental compiles
- **Related**: `383` Extend CLI `run` with tracing and derived debug signals

## References

- [Node.js V8 API](https://nodejs.org/api/v8.html)
- [Node.js CPU and heap profiling CLI flags](https://nodejs.org/download/release/v22.12.0/docs/api/cli.html)
- [Node.js perf_hooks API](https://nodejs.org/api/perf_hooks.html)
