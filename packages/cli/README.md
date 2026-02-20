# @8f4e/cli

CLI for compiling 8f4e project JSON files into runtime-ready exports.

## Usage

```bash
cli path/to/project.json -o path/to/project-runtime-ready.json
```

```bash
cli path/to/project.json -o path/to/project-runtime-ready.json --trace-output path/to/instruction-flow.json
```

## Output

The CLI overwrites/sets these fields on the output JSON:

- `compiledProjectConfig` (merged with defaults)
- `compiledModules`
- `compiledWasm` (base64)

When `--trace-output` is used, the CLI writes a separate JSON file containing per-instruction flow data:

- stack types before/after each instruction (`int`, `float32`, `float64`)
- emitted bytecode for each instruction
- line number, instruction id, and parsed arguments

## Notes

- Config blocks are compiled from `config project` blocks only.
- No schema validation is performed.
- Any existing compiled fields in the input are replaced.
