[![Netlify Status](https://api.netlify.com/api/v1/badges/21e4864c-e37c-4039-85a0-baf88a997c6b/deploy-status)](https://app.netlify.com/sites/8f4e/deploys)

# 8f4e 

8f4e is a stack oriented programming language that I created to perform generative music at algorave events. I wanted an efficient and portable tool for real time audio signal generation and processing. This monorepo contains the compiler, runtimes, and a browser based visual code editor I designed specifically for the 8f4e language.

More details about the language design and documentation can be found at [./docs/README.md](./docs/README.md)

## Package Architecture

The 8f4e project is organized as an Nx monorepo with the following package hierarchy:

<pre>
8f4e/
└── packages/
    ├── <a href="./packages/cli/README.md">cli</a> (CLI for compiling 8f4e project JSON files)
    ├── <a href="./packages/compiler/README.md">compiler</a> (The core compiler that transforms 8f4e code into WebAssembly)
    ├── <a href="./packages/compiler-worker/README.md">compiler-worker</a> (Web Worker wrapper around the compiler for live coding)
    ├── <a href="./packages/config/README.md">config</a> (Shared tooling and configuration helpers for the workspace)
    ├── <a href="./packages/editor/README.md">editor</a> (The main editor package with UI components and state management)
    │   └── packages/
    │       ├── <a href="./packages/editor/packages/editor-state/README.md">editor-state</a> (Editor state management)
    │       ├── <a href="./packages/editor/packages/glugglug/README.md">glugglug</a> (2D WebGL graphics utilities)
    │       ├── <a href="./packages/editor/packages/sprite-generator/README.md">sprite-generator</a> (All UI graphics are generative)
    │       ├── <a href="./packages/editor/packages/state-manager/README.md">state-manager</a> (State manager with subscriptions)
    │       └── <a href="./packages/editor/packages/web-ui/README.md">web-ui</a> (WebGL rendering for the editor interface)
    ├── <a href="./packages/examples/README.md">examples</a> (Example modules and projects)
    ├── <a href="./packages/pmml28f4e/README.md">pmml28f4e</a> (tool to convert PMML neural networks to 8f4e projects)
    ├── <a href="./packages/runtime-audio-worklet/README.md">runtime-audio-worklet</a>     ┐ 
    ├── <a href="./packages/runtime-main-thread-logic/README.md">runtime-main-thread-logic</a> │ (Various runtime environments 
    ├── <a href="./packages/runtime-web-worker-logic/README.md">runtime-web-worker-logic</a>  │ for different execution contexts)
    ├── <a href="./packages/runtime-web-worker-midi/README.md">runtime-web-worker-midi</a>   ┘
    ├── <a href="./packages/stack-config-compiler/README.md">stack-config-compiler</a> (Stack-machine-inspired config language compiler)
    └── <a href="./packages/website-background/README.md">website-background</a> (Website background assets built from an editor project)
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
