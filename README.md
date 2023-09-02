[![Netlify Status](https://api.netlify.com/api/v1/badges/21e4864c-e37c-4039-85a0-baf88a997c6b/deploy-status)](https://app.netlify.com/sites/8f4e/deploys)

# 8f4e

8f4e is stack-oriented programming language with a semi-visual interface specifically designed for generating and processing real-time audio signals. One if its unique features is to change variable values on-the-fly, without needing to recompile the code, and its representation of pointers using interconnected wires.

The objective of this programming language is to help sound designers in integrating complex interactive and/or generative audio components into their web applications with maximum efficiency.

## Why the stack-oriented design?

The WebAssembly Virtual Machine uses a stack machine architecture, which offers several advantages for cross-platform compatibility. Stack machines have a simpler instruction set and fewer hardware dependencies than register-based machines, making them easier to port to different platforms.

A programming language that is designed with a stack-oriented approach can perform operations on the stack in a manner that is both efficient and natural, with instructions that can be easily mapped to those of the stack machine. Therefore, a programming language with a stack-oriented design is a natural fit for the WebAssembly Virtual Machine.

## What does semi-visual mean?

Visual programming languages use graphical elements, such as icons, symbols, and flowcharts, to represent programming concepts and logic, instead of traditional text-based code. 8f4e combines these graphical elements with text-based code.

## Why is this better than exporting a Max/Msp algorithm to JavaScript?

Although Max/Masp may be easier to learn, 8f4e offers superior flexibility, efficiency, and the ability to test audio algorithms in the browser with live-edit capability thanks to its fast compilation time.
