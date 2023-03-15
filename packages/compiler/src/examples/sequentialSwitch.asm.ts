export default `module sequentialSwitch

memory int defaultValue 0
memory int out 0
memory int* in:clock &defaultValue
memory int previousClock 0
memory int counter 0
memory int* in:1 &defaultValue
memory int* in:2 &defaultValue
memory int* in:3 &defaultValue
memory int* in:4 &defaultValue

local clock
local _counter

push counter
localSet _counter

push *in:clock
localSet clock

push previousClock
push clock
greaterThan
if void
 push _counter
 push WORD_SIZE
 add
 push 16
 remainder
 localSet _counter
end

push &previousClock
push clock
store

push &out
push &in:1
push _counter
add
load
load
store

push &counter
push _counter
store
`;
