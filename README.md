[![Netlify Status](https://api.netlify.com/api/v1/badges/21e4864c-e37c-4039-85a0-baf88a997c6b/deploy-status)](https://app.netlify.com/sites/8f4e/deploys)

# 8f4e

8f4e is a stack-oriented programming language with a semi-visual interface specifically designed for generating and processing real-time audio signals. One of its unique features is its representation of pointers using interconnected wires.

The goal of this programming language is to help sound designers in integrating complex interactive and/or generative audio components into their web applications with maximum efficiency.

## Other distinctive features:
- The syntax and commands of 8f4e were inspired by assembly languages, but unlike the typical cryptic operation names like `cndjmp`, 8f4e uses more descriptive commands such as `branchIfTrue`.
- The code is organized into modules, each containing variable declarations and a sequence of commands.
- It allows for the modification of variable values in real-time, while the program is running, without requiring recompilation.
- In 8f4e, variables declared one after another in the code are allocated at memory addresses that follow each other. For example, if an `int foo` is at the 256th byte, then the `int bar` declared next will be at the 260th byte, assuming a word size of 4 bytes.
- Buffers in 8f4e always occupy contiguous spaces in memory, allowing for straightforward and efficient iteration.
- Runtime memory allocation is not supported in 8f4e; developers must pre-plan their software's memory needs during the coding process. This design choice, favoring performance and efficiency, also ensures that memory addresses remain predictable.
- The language utilizes C-style pointer notations and introduces a new notation: `buffer&` that retrieves the address of the last word in a buffer.
- The execution order of various code modules is determined by their dependencies. If a module's output is needed as input for others, it is executed first. This creates a sequential flow, where each module executes only after receiving the necessary data from a preceding module's output. This dependency-based ordering ensures that each module gets the necessary data at the right time for the entire system to function effectively.
- For performance reasons, 8f4e does not include transcendental functions in its standard library. Instead, it encourages the use of polynomial approximations for these functions.

## Why the stack-oriented design?

The natural environment for 8f4e are virtual machines like WebAssembly, which often use a stack machine architecture. Stack machines have fewer hardware dependencies than register-based machines, making them easier to port to different platforms.
A programming language that is designed with a stack-oriented approach can perform operations on the stack in a manner that is both efficient and natural, with instructions that can be easily mapped to those of the stack machine.

## What do you mean by semi-visual interface?

Visual programming languages use graphical elements, such as icons, symbols, and flowcharts, to represent programming concepts and logic, instead of traditional text-based code. 8f4e combines these graphical elements with text-based code.

## Why is this better than exporting a Max/Msp algorithm to JavaScript?

Although Max/Masp may be easier to learn, 8f4e offers superior flexibility, efficiency, and the ability to test audio algorithms in the browser with live-edit capability thanks to its fast compilation time.