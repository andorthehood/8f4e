# Bytecode Size Benchmarks

Benchmark cases for measuring compiler bytecode output size.

This directory is intended for `.8f4e` programs whose emitted bytecode size can be tracked over time. Keep cases small, focused, and named after the compiler behavior or project idiom they measure.

Run `npx nx run @8f4e/examples:log-bytecode-size` from the workspace root to append per-benchmark results to `logs/bytecode-size/`.
