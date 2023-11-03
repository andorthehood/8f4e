export default `module logucOr

int defaultValue 0
int* in:1 &defaultValue
int* in:2 &defaultValue
int out 0

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
moduleEnd`;
