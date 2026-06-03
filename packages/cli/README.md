# @8f4e/cli

CLI for compiling `.8f4e` project files into WebAssembly artifacts and runtime inspection output.

## Usage

```bash
cli compile path/to/project.8f4e --wasm-output path/to/module.wasm
```

```bash
cli run path/to/project.8f4e --cycles 16 --dump main:counter
```

```bash
cli capture path/to/project.8f4e --buffer audioout:buffer --cycles 128 --repeat 100 --out path/to/audio.bin
```

## Output

When `--wasm-output` is used, the CLI writes a decoded WebAssembly binary (`.wasm`) file.

When `capture` is used, the CLI:

- compiles and initializes the project
- optionally applies `--set`, `--set-json`, and `--load-file`
- runs `cycle()` for the requested `--cycles` window
- reads the requested `--buffer`
- repeats that capture `--repeat` times
- writes the concatenated raw bytes to `--out`

## Notes

- No schema validation is performed.
- `compile` requires `--wasm-output`.
- `run` requires at least one `--dump`.
- `capture` requires `--buffer` and `--out`.
