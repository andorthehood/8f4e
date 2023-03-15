export default `module saw

memory int LIMIT_SELF I16_SIGNED_LARGEST_NUMBER
memory int rate 1
memory int* in:rate &rate
memory int* in:limit &LIMIT_SELF
memory int out 0
memory int defaultValue 0
memory int* reset &defaultValue

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
