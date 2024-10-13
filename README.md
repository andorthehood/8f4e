[![Netlify Status](https://api.netlify.com/api/v1/badges/21e4864c-e37c-4039-85a0-baf88a997c6b/deploy-status)](https://app.netlify.com/sites/8f4e/deploys)

Welcome to what I refer to as my biggest “mental masturbation” project. This whole thing started because I like creating problems just to experience the satisfaction of solving them. All the code was written by hand, and I plan to maintain it the old-fashioned way because coding is fun!

# 8f4e

8f4e is a stack-oriented programming language with a semi-visual interface designed for making generative music on algorave events. One of its unique features is its representation of pointers using interconnected wires.

## Other distinctive features of the programming language:
- The syntax and commands of 8f4e were inspired by assembly languages, but instead of the typical cryptic mnemonics like `cndjmp`, 8f4e uses more descriptive operation names such as `branchIfTrue`.
- The code is organized into modules, each containing variable declarations and a sequence of commands.
- It supports real-time manual modification of variable values while the program is running, without needing recompilation.
- Variables declared sequentially in the code are allocated in adjacent memory locations. For example, if `int foo` is at byte 256, then the next `int bar` will be at byte 260 (assuming a 4-byte word size).
- Arrays are also stored in contiguous blocks, enabling straightforward and efficient iteration.
- All variables in 8f4e are inherently public, with no option to modify visibility. Also, it's not memory safe, pointers can point to anything within the memory space of the program, but the wires help developers to find where their pointers are pointing.
- Runtime memory allocation is not supported in 8f4e; developers must pre-plan their software's memory needs during the coding process.
- The language utilizes C-style pointer notations and introduces a new notation: `array&` that retrieves the address of the last word in an array.
- The execution order of the code modules is determined by their dependencies. If a module's output is needed as input for others, it is executed first. This creates a sequential flow, where each module executes only after receiving the necessary data from a preceding module's output.
- For performance reasons, 8f4e does not include transcendental functions in its standard library. Instead, it encourages the use of polynomial approximations for these functions.

## Runtimes

There are currently two browser-based runtimes, both integrated into the development editor. These runtimes are designed to handle specific types of real-time data processing, such as MIDI events and audio signals.

- **WebWorkerMIDIRuntime:** This runtime is for handling MIDI events, such as note on/off and control change messages. It is built on the WebWorker API and the built-in WebAssembly runtime. Please note that the sample rate is capped at 50Hz, and it requires permission from the user to access MIDI resources within the browser. Also, this runtime is not supported in Safari and iOS mobile browsers.

- **AudioWorkletRuntime:**  This runtime is for handling audio signal processing, ideal for creating synthesizers, audio effects, or real-time audio analysis tools. It supports two standard sample rates: 22050Hz and 44100Hz. It is based on the AudioWorklet API and the built-in WebAssembly runtime in browsers. Please note that due to browser security policies, access to Audio I/O requires a user action (such as a click or tap) to begin audio playback or processing.

## Future plans

- To write a runtime for microcontrollers.
- Unify the two browser runtimes for MIDI and Audio I/O.
- To write a JavaScript-based runtime for debugging the stack.
- To write a headless runtime in C++ for the ARM architecture using ALSA for audio playback.  
- Add collaborative editing features to the editor.
- Optimize rendering in the editor by offloading certain tasks from JavaScript to shaders.
- The compilation is already fast, but I want to re-write the compiler in Rust to make it even faster.

## Challenges

- The sample rate is capped at 50Hz in the `WebWorkerMIDIRuntime` because, as of now, web browsers lack a precise task scheduling API. Based on my measurements on an M1 MacBook running Chrome, 50Hz provided the least-noticeable time divergences. If you're using an older processor architecture and experience a lot of swinging in your MIDI projects, you may need to reduce the sample rate to improve precision.
- The `WebWorkerMIDIRuntime` is not supported on Safari or iOS mobile browsers due to Apple’s refusal to implement the Web MIDI API.
- Due to security and privacy concerns, browsers enforce strict controls over audio and MIDI resource access, therefore explicit user interaction or permission is required to use the `WebWorkerMIDIRuntime` and `AudioWorkletRuntime` browser runtimes. 

## Instructions

* [Arithmetic instructions](#arithmetic-instructions)
    * [abs](#abs)
    * [add](#add)
    * [div](#div)
    * [mul](#mul)
    * [pow2](#pow2)
    * [remainder](#remainder)
    * [round](#round)
    * [sqrt](#sqrt)
    * [sub](#sub)
* [Bitwise instructions](#bitwise-instructions)
    * [and](#and)
    * [or](#or)
    * [shiftRight](#shiftright)
    * [shiftRightUnsigned](#shiftrightunsigned)
    * [xor](#xor)
* [Comparison](#comparison)
    * [equalToZero](#equaltozero)
    * [greaterOrEqual](#greaterorequal)
    * [greaterOrEqualUnsigned](#greaterorequalunsigned)
    * [greaterThan](#greaterthan)
    * [lessOrEqual](#lessorequal)
    * [lessThan](#lessthan)
* [Control flow instructions](#control-flow-instructions)
    * [block](#block)
    * [branch](#branch)
    * [branchIfTrue](#branchiftrue)
    * [else](#else)
    * [end](#end)
    * [if](#if)
    * [loop](#loop)
    * [loopEnd](#loopend)
    * [skip](#skip)
* [Conversion](#conversion)
    * [castToFloat](#casttofloat)
    * [castToInt](#casttoint)
* [Memory instructions](#memory-instructions)
    * [load](#load)
* [Other](#other)
    * [const](#const)
 
## Arithmetic instructions

### abs

### add

The "add" instruction operates on two numbers of the same type that are retrieved from the stack. It performs addition on these numbers and then stores the result back onto the stack.

#### Examples

    push 1    # stack: [ 1 ]
    push 2    # stack: [ 1, 2 ]
    add       # stack: [ 3 ]

    push 0.5    # stack: [ 3, 0.5 ]
    push 0.7    # stack: [ 3, 0.5, 0.7 ]
    add         # stack: [ 3, 1.2 ]

### div

The "div" instruction retrieves two numbers of the same type from the stack and divides the first number by the second. The resulting quotient is then stored back onto the stack.

### mul

The "mul" instruction retrieves two numbers of the same type from the stack, multiplies them together, and then stores the result back onto the stack.

    push 1    # stack: [ 2 ]
    push 2    # stack: [ 2, 2 ]
    mul       # stack: [ 4 ]

    push 0.5    # stack: [ 4, 0.5 ]
    push 0.7    # stack: [ 4, 0.5, 0.7 ]
    add         # stack: [ 4, 0.35 ]

### pow2

### remainder

The "remainder" instruction retrieves two integer operands from the stack, divides the first operand by the second operand, and then computes the remainder of this division. It then stores the remainder back onto the stack. 

### round

### sqrt

### sub

The "sub" instruction operates on two numbers of the same type that are retrieved from the stack. It subtracts the second operand from the first operand, and then stores the result back onto the stack.

    push 1    # stack: [ 2 ]
    push 2    # stack: [ 2, 3 ]
    sub       # stack: [ -1 ]

    push 0.5    # stack: [ -1, 0.5 ]
    push 0.7    # stack: [ -1, 0.5, 0.7 ]
    add         # stack: [ -1, -0.2 ]

## Bitwise instructions

### and

The "and" instruction retrieves two integers from the stack and performs a bitwise AND operation on them. Specifically, each bit of the resulting value is computed by performing a logical AND between the corresponding bits of the two operands. The resulting value is then stored back onto the stack. 

    push 0b00001    # stack: [ 0b00001 ]
    push 0b00100    # stack: [ 0b00001, 0b00100 ]
    and             # stack: [ 0b00000 ]

    clearStack

    push 0b00001    # stack [ 0b00001 ]
    push 0b00001    # stack [ 0b00001, 0b00001 ]
    and             # stack [ 0b00001 ]

### or

The "or" instruction retrieves two integers from the stack and performs a bitwise OR operation on them. Specifically, each bit of the resulting value is computed by performing a logical OR between the corresponding bits of the two operands. The resulting value is then stored back onto the stack.

    push 0b00001    # stack: [ 0b00001 ]
    push 0b00100    # stack: [ 0b00001, 0b00100 ]
    and             # stack: [ 0b00101 ]

    clearStack

    push 0b00001    # stack [ 0b00001 ]
    push 0b00001    # stack [ 0b00001, 0b00001 ]
    and             # stack [ 0b00001 ]

### shiftRight

The "shiftRight" instruction retrieves two integer operands from the stack. It shifts the bits of the first operand to the right by the number of positions specified by the second operand, and then stores the resulting value back onto the stack. This instruction is typically used to perform bit shifting operations in a program, such as dividing an integer by a power of 2, or extracting specific bits from an integer. Note that if the second operand is greater than or equal to the number of bits in the first operand, the result will be 0.

### shiftRightUnsigned

The "shiftRightUnsigned" instruction retrieves two integer operands from the stack. It shifts the bits of the first operand to the right by the number of positions specified by the second operand, filling the leftmost bits with zeros, and then stores the resulting value back onto the stack. This instruction is similar to the "shiftRight" instruction, but treats the first operand as an unsigned integer. This means that no sign extension occurs during the shift, and the leftmost bits are always filled with zeros, even if the original leftmost bit was 

### xor

The "xor" instruction retrieves two integers from the stack and performs a bitwise XOR (exclusive OR) operation on them. Specifically, each bit of the resulting value is computed by performing a logical XOR between the corresponding bits of the two operands. The resulting value is then stored back onto the stack.

## Comparison

### equalToZero

The equalToZero instruction retrieves a value from the stack, verifies if it equals zero, and then pushes a 1 onto the stack if it is true, or 0 if it is false.

### greaterOrEqual

The greaterOrEqual instruction obtains two values from the stack, checks if the first value is greater than or equal to the second value, and then pushes 1 onto the stack if it is true, or 0 if it is false.

### greaterOrEqualUnsigned

The greaterOrEqualUnsigned instruction retrieves two unsigned values from the stack, checks if the first value is greater than or equal to the second value without considering their signs, and then pushes 1 onto the stack if it is true, or 0 if it is false.

### greaterThan

The greaterThan instruction retrieves two values from the stack, checks if the first value is strictly greater than the second value, and then pushes 1 onto the stack if it is true, or 0 if it is false.

### lessOrEqual

The lessOrEqual instruction takes two values from the stack, checks if the first value is less than or equal to the second value, and then pushes 1 onto the stack if it is true, or 0 if it is false.

### lessThan

The lessThan instruction retrieves two values from the stack, checks if the first value is strictly less than the second value, and then pushes 1 onto the stack if it is true, or 0 if it is false.

## Control flow instructions

### block

### branch

### branchIfTrue

### else

### end

### if

### loop

### loopEnd

### skip

## Conversion

### castToFloat

The castToFloat instruction takes an integer from the stack, converts it to a floating-point number, and then places the resulting value back onto the stack.

### castToInt

The castToInt instruction takes a value from the stack, converts it to an integer, and then places the resulting integer back onto the stack.

## Memory instructions

### load

## Other

### const

## Questions that no one actually asked

### Why the stack-oriented design?

The natural environment for 8f4e are virtual machines like WebAssembly, which often use a stack machine architecture. Stack machines have fewer hardware dependencies than register-based machines, making them easier to port to different platforms.
A programming language that is designed with a stack-oriented approach can perform operations on the stack in a manner that is both efficient and natural, with instructions that can be easily mapped to those of the stack machine.

### What do you mean by semi-visual interface?

Visual programming languages use graphical elements, such as icons, symbols, and flowcharts, to represent programming concepts and logic, instead of traditional text-based code. 8f4e combines these graphical elements with text-based code.

### Where does the name 8f4e come from?

Okay, this one is actually asked a lot. I wrote a script to hunt down the shortest available .com domains, and 8f4e was one that caught my eye because it only included digits and letters from the hexadecimal system. When I registered it, I still had no idea what I would use it for. The project came later, and I picked this domain name for the website. Later, I found out that it's the UTF-8 code for the Chinese character "轎," which means "litter" (a human-powered vehicle, not cat litter or rubbish).
