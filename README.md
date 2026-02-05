[![Netlify Status](https://api.netlify.com/api/v1/badges/21e4864c-e37c-4039-85a0-baf88a997c6b/deploy-status)](https://app.netlify.com/sites/8f4e/deploys)

# 8f4e 

8f4e is a stack oriented programming language that I created to perform generative music at algorave events. I wanted an efficient and portable tool for real time audio signal generation and processing. This monorepo contains the compiler, runtimes, and a browser based visual code editor I designed specifically for the 8f4e language.

More details about the language design and documentation can be found at [./docs/README.md](./docs/README.md)

## Package Architecture

The 8f4e project is organized as an Nx monorepo with the following package hierarchy:

<pre>
8f4e/
└── packages/
    ├── [cli](./packages/cli/README.md) (CLI for compiling 8f4e project JSON files)
    ├── [compiler](./packages/compiler/README.md) (The core compiler that transforms 8f4e code into WebAssembly)
    ├── [compiler-worker](./packages/compiler-worker/README.md) (Web Worker wrapper around the compiler for live coding)
    ├── [config](./packages/config/README.md) (Shared tooling and configuration helpers for the workspace)
    ├── [editor](./packages/editor/README.md) (The main editor package with UI components and state management)
    │   └── packages/
    │       ├── [editor-state](./packages/editor/packages/editor-state/README.md) (Editor state management)
    │       ├── [glugglug](./packages/editor/packages/glugglug/README.md) (2D WebGL graphics utilities)
    │       ├── [sprite-generator](./packages/editor/packages/sprite-generator/README.md) (All UI graphics are generative)
    │       ├── [state-manager](./packages/editor/packages/state-manager/README.md) (State manager with subscriptions)
    │       └── [web-ui](./packages/editor/packages/web-ui/README.md) (WebGL rendering for the editor interface)
    ├── [examples](./packages/examples/README.md) (Example modules and projects)
    ├── [pmml28f4e](./packages/pmml28f4e/README.md) (PMML neural network conversion to 8f4e projects)
    ├── [runtime-audio-worklet](./packages/runtime-audio-worklet/README.md)     ┐ 
    ├── [runtime-main-thread-logic](./packages/runtime-main-thread-logic/README.md) │ (Various runtime environments 
    ├── [runtime-web-worker-logic](./packages/runtime-web-worker-logic/README.md)  │ for different execution contexts)
    ├── [runtime-web-worker-midi](./packages/runtime-web-worker-midi/README.md)   ┘
    ├── [stack-config-compiler](./packages/stack-config-compiler/README.md) (Stack-machine-inspired config language compiler)
    └── [website-background](./packages/website-background/README.md) (Website background assets built from an editor project)
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
