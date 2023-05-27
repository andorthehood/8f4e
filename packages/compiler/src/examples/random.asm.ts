export default () => `module random

int seed 69420
int out 0

local int random
local int feedback

push out
localSet random

localGet random
; The zero state is illegal because the counter would remain locked-up.
equalToZero
if 
 push seed
else
 push random
end
localSet random

push random
push 0b000001
and
push 0
shiftRight
push feedback
xor
localSet feedback

push random
push 0b000100
and
push 2
shiftRight
push feedback
xor
localSet feedback

push random
push 0b001000
and
push 3
shiftRight
push feedback
xor
localSet feedback

push random
push 0b100000
and
push 5
shiftRight
push feedback
xor
localSet feedback

push random
push 1
shiftRightUnsigned
localSet random

push feedback
equalToZero
if 
 push random
else
 push random
 push 0b10000000000000000000000000000000
 or
end
localSet random

push &out
push random
push I16_SIGNED_LARGEST_NUMBER
remainder
store

end
`;
