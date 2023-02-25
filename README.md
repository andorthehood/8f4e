[![Netlify Status](https://api.netlify.com/api/v1/badges/21e4864c-e37c-4039-85a0-baf88a997c6b/deploy-status)](https://app.netlify.com/sites/8f4e/deploys)

# 8f4e

8f4e is a semi-visual, stack-oriented programming language that runs on the WebAssembly Virtual Machine.

## Why the stack-oriented design?

The WebAssembly Virtual Machine uses a stack machine architecture, because stack machines are typically easier to port to different platforms than register-based machines, as they have a simpler instruction set and fewer hardware dependencies.

A programming language that is designed with a stack-oriented approach can perform operations on the stack in a manner that is both efficient and natural, with instructions that can be easily mapped to those of the stack machine. Therefore, a programming language with a stack-oriented design is a natural fit for the WebAssembly Virtual Machine.