# 8f4e VS Code Extension

Local VS Code custom editor for opening `.8f4e` files with the bundled 8f4e editor.

This package is intended for local development and testing. It is not hardened for publishing to the public VS Code Marketplace.

## Build and Install Locally

From the repository root:

```sh
npx nx run @8f4e/vscode-extension:install
```

After installation, reload VS Code manually and open a `.8f4e` file with the `8f4e Editor` custom editor.

## Runtime Behavior in VS Code

VS Code webviews are not currently cross-origin isolated in this local setup. That means `SharedArrayBuffer` is unavailable, shared `WebAssembly.Memory` cannot be created, and normal `WebAssembly.Memory` cannot be sent to workers or audio worklets with `postMessage`.

For that reason, this extension includes local runtime fallbacks:

- `WebWorkerRuntime` falls back to a main-thread loop when shared memory is unavailable.
- `AudioWorkletRuntime` falls back to a `ScriptProcessorNode` that runs inside the same webview context as the editor.

The audio fallback instantiates the compiled WASM with the same memory used by the editor, calls the compiled `buffer()` export during audio processing, and copies configured memory buffers into the audio output channels. This is why audio output and editor views such as oscilloscopes can stay in sync without cross-thread memory sharing.

The tradeoff is that `ScriptProcessorNode` is older and runs on the main thread, so it is less robust under heavy UI load than a real `AudioWorklet`. It is kept here because it works well for local testing inside VS Code's webview constraints.

## Security Notice

The webview Content Security Policy is deliberately relaxed for local testing. Use this extension at your own risk, especially when opening untrusted `.8f4e` files.

The current webview policy allows:

- external resources from any origin for network, image, media, font, frame, style, script, and worker loading
- `data:` and `blob:` resources
- inline scripts through `'unsafe-inline'`
- eval-like script execution through `'unsafe-eval'`
- WebAssembly compilation through `'wasm-unsafe-eval'`

These settings make the extension easier to test with arbitrary editor assets and generated runtime code, but they also remove protections that a production extension should normally keep.

For a public or shared extension, tighten the CSP again, avoid inline/eval/script wildcards, and only allow the specific origins and resource types the editor truly needs.
