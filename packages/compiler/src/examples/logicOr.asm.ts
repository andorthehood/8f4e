export default `module logucOr

memory defaultValue 0
memory in:1 &defaultValue
memory in:2 &defaultValue
memory out 0

const HIGH I16_SIGNED_LARGEST_NUMBER

push *in:1
push 0
greaterThan
if void
 push &out
 push HIGH
 store
 branch 1
end

push *in:2
push 0
greaterThan
if void
 push &out
 push HIGH
 store
 branch 1
end

push out
push 0
store
`;
