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

This package does not own:

- Project include resolution or file loading policy.
- Source parsing, semantic validation, memory planning, or code generation.
- Runtime host behavior.

Callers should use the manifest to discover available standard-library includes and load the exported source files through their own environment-specific resolver.
