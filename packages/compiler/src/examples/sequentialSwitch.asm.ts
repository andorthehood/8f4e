export default `module sequentialSwitch

int defaultValue 0
int out 0
int* in:clock &defaultValue
int previousClock 0
int counter 0
int* in:1 &defaultValue
int* in:2 &defaultValue
int* in:3 &defaultValue
int* in:4 &defaultValue

local int clock
local int _counter

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

moduleEnd`;
