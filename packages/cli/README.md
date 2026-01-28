# @8f4e/cli

CLI for compiling 8f4e project JSON files into runtime-ready exports.

## Usage

```bash
cli path/to/project.json -o path/to/project-runtime-ready.json
```

## Output

The CLI overwrites/sets these fields on the output JSON:

- `compiledProjectConfig` (merged with defaults)
- `compiledModules`
- `compiledWasm` (base64)

## Notes

- Config blocks are compiled from `config project` blocks only.
- No schema validation is performed.
- Any existing compiled fields in the input are replaced.
