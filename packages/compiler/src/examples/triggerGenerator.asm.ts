export default `module triggerGenerator

memory int counter 0
memory int rate 0
memory int out 0
memory int defaultValue 0
memory int* reset &defaultValue

local _counter
local _output
local _rate

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

# Resets the output to 0
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
`;
