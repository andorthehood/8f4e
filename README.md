# 8f4e 

8f4e is a stack oriented programming language and live code editor that I created to perform generative music at algorave events. This monorepo contains the compiler, specialised runtimes, and the code of a browser-based visual code editor I designed specifically for the 8f4e language.
The editor and runtime stack follows a REPL-style coding loop (edit, compile/evaluate, and observe output), but it is UI-driven rather than a terminal prompt workflow.

More details about the language design and documentation can be found at [./docs/README.md](./docs/README.md)

## Package Architecture

The 8f4e project is organized as an Nx monorepo with the following package hierarchy:

<pre>
8f4e/
└── packages/
    ├── <a href="./packages/compiler/README.md">compiler</a> (The core compiler that transforms 8f4e code into WebAssembly)
    │   └── packages/
    │       ├── <a href="./packages/compiler/packages/language-spec/README.md">language-spec</a> (Shared language contracts and target-independent compiler facts)
    │       ├── <a href="./packages/compiler/packages/project-preparser/README.md">project-preparser</a> (Parses .8f4e project documents into compiler input)
    │       ├── <a href="./packages/compiler/packages/tokenizer/README.md">tokenizer</a> (Parses source blocks into validated ASTs)
    │       ├── <a href="./packages/compiler/packages/constant-resolver/README.md">constant-resolver</a> (Resolves const declarations and namespace imports)
    │       ├── <a href="./packages/compiler/packages/memory-planner/README.md">memory-planner</a> (Plans module and memory declaration layout)
    │       ├── <a href="./packages/compiler/packages/memory-reference-resolver/README.md">memory-reference-resolver</a> (Resolves memory layout references)
    │       ├── <a href="./packages/compiler/packages/memory-default-resolver/README.md">memory-default-resolver</a> (Resolves memory defaults and pointer metadata)
    │       ├── <a href="./packages/compiler/packages/semantic-reference-resolver/README.md">semantic-reference-resolver</a> (Resolves semantic value references)
    │       ├── <a href="./packages/compiler/packages/stack-analyzer/README.md">stack-analyzer</a> (Validates and reports stack effects)
    │       ├── <a href="./packages/compiler/packages/semantic-utils/README.md">semantic-utils</a> (Shared target-independent semantic helpers)
    │       ├── <a href="./packages/compiler/packages/wasm-codegen/README.md">wasm-codegen</a> (WebAssembly code generation)
    │       ├── <a href="./packages/compiler/packages/wasm-utils/README.md">wasm-utils</a> (Low-level WebAssembly byte construction helpers)
    │       └── <a href="./packages/compiler/packages/stdlib/README.md">stdlib</a> (Standard-library include source files)
    ├── <a href="./packages/editor/README.md">editor</a> (The main editor package)
    │   └── packages/
    │       ├── <a href="./packages/editor/packages/editor-state/README.md">editor-state</a> (Editor state management)
    │       ├── editor-state-types (Shared public editor-state model types)
    │       ├── <a href="./packages/editor/packages/editor-state-testing/README.md">editor-state-testing</a> (Framework-agnostic editor-state test helpers)
    │       ├── <a href="./packages/editor/packages/glugglug/README.md">glugglug</a> (2D WebGL graphics utilities)
    │       ├── <a href="./packages/editor/packages/sprite-generator/README.md">sprite-generator</a> (All UI graphics are generative)
    │       ├── <a href="./packages/editor/packages/state-manager/README.md">state-manager</a> (State manager with subscriptions)
    │       └── <a href="./packages/editor/packages/web-ui/README.md">web-ui</a> (WebGL rendering for the editor interface)
    ├── <a href="./packages/examples/README.md">examples</a> (Example modules and projects)
    ├── <a href="./packages/runtime-audio-worklet/README.md">runtime-audio-worklet</a>     ┐ 
    ├── <a href="./packages/runtime-main-thread/README.md">runtime-main-thread</a> │ (Various runtime environments 
    ├── <a href="./packages/runtime-web-worker/README.md">runtime-web-worker</a>  ┘ for different execution contexts)
    ├── <a href="./packages/cli/README.md">cli</a> (CLI for compiling 8f4e project files)
    ├── <a href="./packages/compiler-worker/README.md">compiler-worker</a> (Web Worker wrapper around the compiler for live coding)
    ├── <a href="./packages/vscode-extension/README.md">vscode-extension</a> (Local VS Code custom editor for .8f4e files)
    ├── metrics-dashboard (Local dashboard for release metrics)
    └── <a href="./packages/config/README.md">config</a> (Shared tooling and configuration helpers for the workspace)
</pre>

You can use `npx nx graph` to explore the relationship between the packages.

## Development

### Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build all packages:**
   ```bash
   npx nx run app:build
   ```

3. **Start the development server:**
   ```bash
   npx nx run app:dev
   ```
   The app will be available at http://localhost:3000
