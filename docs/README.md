# Introduction to 8f4e

8f4e is a stack oriented programming language with a visual code editor that I created to perform generative music at algorave events.

Its primary target is the WebAssembly virtual machine, as I wanted an efficient yet portable tool for real time audio signal generation and processing.

## Table of Contents

- [Stack Oriented Execution Model](#stack-oriented-execution-model)
- [Memory Access and Pointers](#memory-access-and-pointers)
- [Endless Execution Loop](#endless-execution-loop)
- [Memory Layout and Allocation](#memory-layout-and-allocation)
- [Modules and Execution Order](#modules-and-execution-order)
- [Live Variable Editing](#live-variable-editing)
- [Visibility and Memory Safety](#visibility-and-memory-safety)

## Stack Oriented Execution Model

Stack oriented programming means that, instead of using registers, instructions take their operands from a stack and push their results back onto the same stack for the next instruction.

I chose this programming paradigm because the WebAssembly virtual machine is itself a stack machine.

Staying native to this execution model avoids costly abstractions and makes it possible to build a simpler and faster compiler.

```
push 2
push 3
; Pushing values 2 and 3 onto the stack
add
; After executing the add instruction,
; the stack will contain the value 5

push 10
mul
; Now the stack will contain the value 50

push 10
div
; Now 5 again
```

## Memory Access and Pointers

It is also possible to take values from the stack and store them in memory.

The language uses C style pointer notation.

```
int result

push &result
push 42
store
; The store instruction takes two values:
; a memory address and the value to store
```

## Endless Execution Loop

Programs in 8f4e run inside an endless loop. This reflects how real time audio systems operate, where processing consists of continuously reading from and writing to audio buffers.

8f4e removes this control flow boilerplate and allows programs to focus purely on signal generation and transformation.

## Memory Layout and Allocation

In 8f4e, variables declared sequentially in the code are allocated in adjacent memory locations.

```
int a 1
int b 1
; Memory address of b is a + word size
int c 1
; Memory address of c is b + word size
```

Runtime memory allocation is not supported. Developers must pre plan their software’s memory needs during coding.

## Modules and Execution Order

The code is organized into modules, each containing variable declarations and a sequence of commands.

The execution order of modules is determined by their dependencies. If a module’s output is needed as input for others, it is executed first.

```
module foo

int a 10
int b 20
int result

push &result
push a
push b
add
store
moduleEnd
```

## Live Variable Editing

```
8f4e supports real time manual modification of variable values while the program is running, without requiring recompilation.

int foo 10
; You can change these values in the editor
; while the program is running
int bar 20
; The editor traces them back in memory
; and updates their values without restarting
; or recompiling the program
```

## Visibility and Memory Safety

All variables in 8f4e are public. There is no concept of variable visibility.

The language is not memory safe. Pointers can reference any location within the program’s memory space, but the visual wires help developers see where pointers are pointing.

```
int* pointer

push &pointer
push pointer
push WORD_SIZE
add
store

; pointer will iterate through all
; possible memory addresses
```
