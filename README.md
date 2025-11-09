[![Netlify Status](https://api.netlify.com/api/v1/badges/21e4864c-e37c-4039-85a0-baf88a997c6b/deploy-status)](https://app.netlify.com/sites/8f4e/deploys)

# 8f4e 

8f4e is a stack-oriented programming language with a semi-visual interface that I originally designed to perform generative music on algorave events. It's meant to be an efficient, but at the same time portable tool for real-time audio signal generation and processing. One of its most unique features is its representation of pointers using interconnected wires.

## Package Architecture

The 8f4e project is organized as an Nx monorepo with the following package hierarchy:

```
8f4e/
└── packages/
    ├── compiler (The core compiler that transforms 8f4e code into WebAssembly)
    ├── compiler-worker (Web Worker wrapper around the compiler)
    ├── editor (The main editor package with UI components and state management)
    │   └── packages/
    │       ├── editor-state (Editor state management)
    │       ├── glugglug (2D WebGL graphics utilities)
    │       ├── sprite-generator (All UI graphics are generative)
    │       ├── state-manager (State manager with subscriptions)
    │       └── web-ui (WebGL rendering for the editor interface)
    ├── runtime-audio-worklet     ┐ 
    ├── runtime-main-thread-logic │ (Various runtime environments 
    ├── runtime-web-worker-logic  │ for different execution contexts)
    └── runtime-web-worker-midi   ┘
```

## Documentation

- [`docs/instructions.md`](./docs/instructions.md) - Language instruction reference
- [`docs/deployment.md`](./docs/deployment.md) - Editor bundle deployment to DigitalOcean Spaces
- [`docs/usage.md`](./docs/usage.md) - How to integrate the editor bundle in external websites
- [`docs/todo/`](./docs/todo/) - Technical debt and planned improvements (one file per TODO item)
- [`postmortems/`](./postmortems/) - Postmortem analyses of significant issues and lessons learned

## Development

### Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build all packages:**
   ```bash
   npm run build
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at http://localhost:3000

### Development Workflow

The project uses Nx for monorepo orchestration. All packages are built to their `dist/` directories, and the Vite development server consumes these compiled artifacts.

**Key commands:**

- `npm run dev` - Builds all packages once, then starts Vite dev server with HMR
- `npm run build` - Builds all packages and creates production bundle
- `npm run test` - Runs unit tests across all packages
- `npm run typecheck` - Type-checks all packages (runs in CI on push/PR to main and staging)
- `npm run lint` - Lints and auto-fixes all TypeScript files

**Working with packages:**

To rebuild a specific package during development:
```bash
npx nx run @8f4e/compiler:build
```

To watch a specific package for changes (in a separate terminal):
```bash
npx nx run @8f4e/compiler:dev
```

To watch all packages for changes (optional, for continuous rebuilding):
```bash
npm run dev:watch-packages
```
This uses `nx watch` to automatically rebuild packages when their source files change. Run this in a separate terminal alongside `npm run dev` for the best development experience with instant package hot-reload.

**Project graph:**

To visualize the project dependency graph:
```bash
npm run graph
```

### Testing

- **Unit tests:** `npm run test`
- **Screenshot tests:** `npm run test:screenshot`
- **Update screenshots:** `npm run test:screenshot:update`
- **Screenshot test UI:** `npm run test:screenshot:ui`

### Architecture Notes

- All packages output TypeScript-compiled JavaScript to their `dist/` directories
- The Vite app always imports from `dist/`, not `src/`, ensuring consistent behavior between dev and production
- Package dependencies are managed through Nx's task pipeline - building the app automatically builds all required packages
- Each package has a `dev` target for watch mode during active development

## Distinctive features of the programming language
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

## Browser runtimes

There are currently two browser-based runtimes, both integrated into the development editor. These runtimes are designed to handle specific types of real-time data processing, such as MIDI events and audio signals.

- **WebWorkerMIDIRuntime:** This runtime is for sending and receiving MIDI events, such as note on/off and control change messages. It is built on the WebWorker API and uses the borwser's WebAssembly runtime.
**Limitations:**
   - The sample rate is capped at 50Hz, and it requires permission from the user to access MIDI resources within the browser.
   - This runtime is not supported in Safari and iOS mobile browsers.

- **AudioWorkletRuntime:** This runtime handles audio signal processing, ideal for building synthesizers or doing real-time audio analysis. It supports standard sample rates like: 22,050 Hz and 44,100 Hz. It’s built on the AudioWorklet API and uses the browser’s WebAssembly runtime.
**Limitations:**
   - Because of browser security policies, you’ll need a user action (like a click or tap) to start audio playback or processing.
   - The input audio buffer is fine, but don’t expect studio-grade quality. As of 2024, it’s really meant for things like voice memos or audio messages.
   - If you’re using both input and output at the same time, the audio quality can take a noticeable hit in Chrome and Firefox. If you want to monitor the output while recording, Safari does a better job handling it (for now).
 
## Native runtimes

- **DaisyARMCortexM7:** Coming soon...
- **LinuxALSA:** Coming soon...
- **MacOSCoreAudio:** Work in progress...

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
