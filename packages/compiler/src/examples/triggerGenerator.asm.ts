export default `module triggerGenerator

int counter 0
int rate 0
int out 0
int defaultValue 0
int* reset &defaultValue

local int _counter
local int _output
local int _rate

push out
localSet _output

push counter
localSet _counter

push rate
localSet _rate

push *reset
push 0
greaterThan
if void
 push 0
 localSet _counter
 push 0
 localSet _output
end

; Resets the output to 0
push _output
push I16_SIGNED_LARGEST_NUMBER
greaterOrEqual
if void
 push 0
 localSet _output
end

push _counter
push _rate
greaterOrEqual
if
 push I16_SIGNED_LARGEST_NUMBER
 localSet _output

 push 0
else
 push _counter
 push 1
 add
end

localSet _counter

push &out
push _output
store

push &counter
push _counter
store

moduleEnd`;
