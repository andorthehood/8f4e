[![Netlify Status](https://api.netlify.com/api/v1/badges/21e4864c-e37c-4039-85a0-baf88a997c6b/deploy-status)](https://app.netlify.com/sites/8f4e/deploys)

# 8f4e

8f4e is stack-oriented programming language with a semi-visual interface specifically designed for generating and processing real-time audio signals. While its primary environment is the WebAssembly Virtual Machine and AudioWorklet, we plan to develop compatibility with microcontroller platforms by providing appropriate glue code in the future.

This programming language is aimed towards sound designers who want to integrate complex interactive and/or generative audio elements into their web applications in the most efficient way possible.

## Why the stack-oriented design?

The WebAssembly Virtual Machine uses a stack machine architecture, which offers several advantages for cross-platform compatibility. Stack machines have a simpler instruction set and fewer hardware dependencies than register-based machines, making them easier to port to different platforms.

A programming language that is designed with a stack-oriented approach can perform operations on the stack in a manner that is both efficient and natural, with instructions that can be easily mapped to those of the stack machine. Therefore, a programming language with a stack-oriented design is a natural fit for the WebAssembly Virtual Machine.

tl;dr: Using a stack-oriented programming language makes it possible to create more efficient software for the WebAssembly Virtual Machine.

## What does semi-visual mean?

Visual programming languages use graphical elements, such as icons, symbols, and flowcharts, to represent programming concepts and logic, instead of traditional text-based code. 8f4e combines these graphical elements with text-based code.
