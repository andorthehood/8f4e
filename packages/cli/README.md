# @8f4e/cli

CLI for compiling `.8f4e` project files into runtime-ready exports.

## Usage

```bash
cli path/to/project.8f4e --wasm-output path/to/module.wasm
```

```bash
cli path/to/project.8f4e --trace-output path/to/instruction-flow.json
```

```bash
cli path/to/project.8f4e --wasm-output path/to/module.wasm --trace-output path/to/instruction-flow.json
```

## Output

When `--wasm-output` is used, the CLI writes a decoded WebAssembly binary (`.wasm`) file.

When `--trace-output` is used, the CLI writes a separate JSON file containing per-instruction flow data:

- stack types before/after each instruction (`int`, `float32`, `float64`)
- emitted bytecode for each instruction
- line number, instruction id, and parsed arguments

## Notes

- Config blocks are compiled from `config project` blocks only.
- No schema validation is performed.
- At least one of `--wasm-output` or `--trace-output` is required.
