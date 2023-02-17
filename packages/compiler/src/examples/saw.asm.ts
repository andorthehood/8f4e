export default `module saw

memory LIMIT_SELF I16_SIGNED_LARGEST_NUMBER
memory rate 1
memory in:rate &rate
memory in:limit &LIMIT_SELF
memory out 0
memory defaultValue 0
memory reset &defaultValue

local _rate
local limit
local counter

push *in:rate
localSet _rate

push *in:limit
localSet limit

push out
localSet counter

push reset
push 0
greaterThan
if void
 push 0
 localSet counter
end

push counter
push limit
greaterOrEqual
if
 push 0
 push limit
 sub
else
 push _rate
 push counter
 add
end
localSet counter

push &out
push counter
store
`;
