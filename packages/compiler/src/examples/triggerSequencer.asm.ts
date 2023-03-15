export default `module triggerSequencer

memory int defaultValue 0
memory int* trigger &defaultValue
memory int* reset &defaultValue
memory int triggerPreviousValue 0
memory int stepMinusOne 0
buffer int steps 16 0
memory int stepPointer &stepMinusOne
memory int stepLength 4
memory int didTrigger 0
memory int out 0

local _stepPointer

push stepPointer
localSet _stepPointer

push *reset
push 0
greaterThan
if void
 push &stepMinusOne
 localSet _stepPointer
end

push *trigger
push triggerPreviousValue
greaterThan
if void
 push &didTrigger
 push 0
 store

 push _stepPointer
 push WORD_SIZE
 add
 localSet _stepPointer

 push _stepPointer
 push stepLength
 push 4
 mul
 push &steps
 add
 greaterOrEqual
 if void
  push &steps
  localSet _stepPointer
 end
end
push &stepPointer
push _stepPointer
store

push &out
push _stepPointer
load
push 0
greaterThan
if
 push didTrigger
 push 0
 greaterThan
 if
  push 0
 else
  push &didTrigger
  push 1
  store

  push I16_SIGNED_LARGEST_NUMBER
 end
else
 push 0
end
store

push &triggerPreviousValue
push *trigger
store
`;
