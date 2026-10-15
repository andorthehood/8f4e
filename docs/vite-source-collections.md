# Lazy source collections in Vite

`@8f4e/vite-plugin-sources` discovers a directory's matching files and exposes them as a typed
`ReadonlyMap<string, () => Promise<string>>` through `virtual:8f4e-sources/<name>`. Its
[package README](../packages/vite-plugin-sources/README.md) documents configuration and application usage.

The default editor config resolves the stdlib package directory through the exported `manifest.json` entry and
registers a collection matching `std/**/*.8f4e`. IDs such as `std/math/fract` are relative to that directory, with
the filename extension removed. The browser resolver looks up a loader by ID; Vite loads the source text on demand.
The manifest remains available to other tooling, and a test checks that the collection covers its include IDs.

The plugin package owns discovery and Vite integration. Consumers supply source roots and patterns and retain
ownership of parsing and compilation. The plugin has no dependency on stdlib, compiler, editor, or gallery packages.
Example/test galleries continue using their existing file URLs.

Build tooling must depend on the plugin package and on the package containing its sources. Nx builds the plugin
before building the default editor; the existing stdlib dependency includes source changes in that build's inputs.
Run the plugin's `build`, `test`, and `typecheck` Nx targets when changing discovery or generated imports. Its tests
exercise synthetic directories in production, consuming builds, development, and build watch.
