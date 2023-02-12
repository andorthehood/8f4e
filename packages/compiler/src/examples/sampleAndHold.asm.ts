export default `module sampleAndHold

memory defaultValue 0
memory in &defaultValue
memory in:trigger &defaultValue
memory triggerPreviousValue 0
memory out 0

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
