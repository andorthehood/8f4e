# Project Preparser Package Guidelines

This file extends the root and compiler package guidance for `packages/compiler/packages/project-preparser`.

## Package Scope

- Package name: `@8f4e/project-preparser`.
- Source lives in `src/`; output lives in `dist/`.
- Owns parsing raw `.8f4e` project source into project blocks, classifying project blocks, reducing project conveniences such as includes, and preparing `CompileInput`.
- Does not know about editor state, grid positioning, rendering, browser storage, or VS Code/webview state.
- Does not load include files itself. Callers provide an async `resolveInclude` function so node, browser, editor, and test environments can load includes however they need.
- Groups are reserved project organization metadata. They are parsed only as project structure and are ignored when preparing compiler input.

## Commands

- From the repo root, prefer Nx:
  - `npx nx run @8f4e/project-preparser:test`
  - `npx nx run @8f4e/project-preparser:typecheck`
  - `npx nx run @8f4e/project-preparser:lint`
  - `npx nx run @8f4e/project-preparser:build`

## Architecture

- Pipeline: raw project source -> project blocks -> classified blocks -> reduced compiler blocks -> `CompileInput`.
- The compiler input consists only of basic blocks: entries/modules, constants, functions, and prototypes.
- Includes are not basic compiler blocks; reduce them into function blocks before calling the compiler.
- Keep compiler diagnostics block-relative. If project-level preparation reports an error from inside a block, attach the project block id and use the line number within that block.
