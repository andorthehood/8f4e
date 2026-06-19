# @8f4e/stdlib

`@8f4e/stdlib` contains standard-library `.8f4e` include source files.

The package exports:

- `./manifest.json`: generated include metadata.
- `./std/*`: standard-library source files.

The manifest is generated from the files under `std/`:

```sh
npx nx run @8f4e/stdlib:generate-manifest
```

This package owns:

- Standard-library include source files.
- Stable include ids such as `std/math/clamp` and `std/memory/loadAt`.
- Keeping `manifest.json` in sync with `std/`.
- Marking every public include function with `#export`.

This package does not own:

- Project include resolution or file loading policy.
- Source parsing, semantic validation, memory planning, or code generation.
- Runtime host behavior.

Callers should use the manifest to discover available standard-library includes and load the exported source files through their own environment-specific resolver.

## Include exports

Stdlib source files must explicitly mark their public include functions with `#export`:

```8f4e
function clamp
#export
param int value
param int minValue
param int maxValue
; ...
functionEnd int
```

In stdlib include context, `#export` means "make this function available to the including project." It is consumed by
the project preparser and does not create a WebAssembly export. Private helper functions should omit `#export`; the
preparser prefixes those helper names when expanding the include.
