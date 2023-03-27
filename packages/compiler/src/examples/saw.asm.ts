export default `module saw

int LIMIT_SELF I16_SIGNED_LARGEST_NUMBER
int rate 1
int* in:rate &rate
int* in:limit &LIMIT_SELF
int out 0
int defaultValue 0
int* reset &defaultValue

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
