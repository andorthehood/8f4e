export default `module stepSequencer

 memory int defaultValue 0
 memory int* trigger &defaultValue
 memory int triggerPreviousValue 0
 buffer int steps 16 0
 memory int stepPointer &steps
 memory int stepLength 4
 memory int out 0

 local _stepPointer

 push stepPointer
 localSet _stepPointer

 push *trigger
 push triggerPreviousValue
 greaterThan
 if void
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
 store

 push &triggerPreviousValue
 push *trigger
 store
`;
