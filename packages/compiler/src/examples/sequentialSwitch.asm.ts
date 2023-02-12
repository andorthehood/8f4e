export default `module sequentialSwitch

memory defaultValue 0
memory out 0
memory in:clock &defaultValue
memory previousClock 0
memory counter 0
memory in:1 &defaultValue
memory in:2 &defaultValue
memory in:3 &defaultValue
memory in:4 &defaultValue

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
 pointerForward
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
