[![Netlify Status](https://api.netlify.com/api/v1/badges/21e4864c-e37c-4039-85a0-baf88a997c6b/deploy-status)](https://app.netlify.com/sites/8f4e/deploys)

Welcome to what I refer to as my biggest “mental masturbation” project. This whole thing started because I like creating problems just to experience the satisfaction of solving them. It doesn't really serve a bigger purpose or offer much to the public, and honestly, there's probably better stuff out there for the same job.

# 8f4e

8f4e is a stack-oriented programming language with a semi-visual interface designed for making generative music on algorave events. One of its unique features is its representation of pointers using interconnected wires.

## Other distinctive features:
- The syntax and commands of 8f4e were inspired by assembly languages, but instead of the typical cryptic mnemonics like `cndjmp`, 8f4e uses more descriptive operation names such as `branchIfTrue`.
- The code is organized into modules, each containing variable declarations and a sequence of commands.
- It supports real-time manual modification of variable values while the program is running, without needing recompilation.
- In 8f4e, variables which are declared one after another in the code are allocated at memory addresses that follow each other. For example, if an `int foo` is at the 256th byte, then the `int bar` declared next will be at the 260th byte, assuming a word size of 4 bytes.
- Arrays in 8f4e always occupy contiguous spaces in memory, allowing for straightforward and efficient iteration.
- All variables in 8f4e are inherently public, with no option to modify visibility.
- Runtime memory allocation is not supported in 8f4e; developers must pre-plan their software's memory needs during the coding process. This design choice, favoring performance and efficiency, also ensures that memory addresses remain predictable.
- The language utilizes C-style pointer notations and introduces a new notation: `array&` that retrieves the address of the last word in an array.
- It's not memory safe, pointers can point to anything within the memory space of the program, but the wires help developers to find where their pointers are pointing.
- The execution order of various code modules is determined by their dependencies. If a module's output is needed as input for others, it is executed first. This creates a sequential flow, where each module executes only after receiving the necessary data from a preceding module's output. This dependency-based ordering ensures that each module gets the necessary data at the right time for the entire system to function effectively.
- For performance reasons, 8f4e does not include transcendental functions in its standard library. Instead, it encourages the use of polynomial approximations for these functions.
- It's Turing complete, but good luck implementing anything like trigonometric functions.

## Questions that no one actually asked

### Why the stack-oriented design?

The natural environment for 8f4e are virtual machines like WebAssembly, which often use a stack machine architecture. Stack machines have fewer hardware dependencies than register-based machines, making them easier to port to different platforms.
A programming language that is designed with a stack-oriented approach can perform operations on the stack in a manner that is both efficient and natural, with instructions that can be easily mapped to those of the stack machine.

### What do you mean by semi-visual interface?

Visual programming languages use graphical elements, such as icons, symbols, and flowcharts, to represent programming concepts and logic, instead of traditional text-based code. 8f4e combines these graphical elements with text-based code.

### Where does the name 8f4e come from?

I wrote a script to hunt down the shortest available .com domains, and 8f4e was one that caught my eye because it only had digits and letters from the hexadecimal system. When I registered it, I still had no idea what I would use it for. The project was basically named after this domain name, which doesn't really mean anything. Well, actually, it does mean something, it's the UTF-8 code for the Chinese character "轎", which means "litter" (a human-powered vehicle, not cat litter or rubbish), but this has nothing to do with the project.
