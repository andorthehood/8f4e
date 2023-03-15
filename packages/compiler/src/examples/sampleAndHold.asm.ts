export default `module sampleAndHold

memory int defaultValue 0
memory int* in &defaultValue
memory int* in:trigger &defaultValue
memory int triggerPreviousValue 0
memory int out 0

local triggerInput

push *in:trigger
localSet triggerInput

push triggerInput
push triggerPreviousValue
sub
push 1000
greaterOrEqual
if void
 push &out
 push *in
 store
end

push &triggerPreviousValue
push triggerInput
store
`;
