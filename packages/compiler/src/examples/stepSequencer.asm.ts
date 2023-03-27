export default `module stepSequencer

 int defaultValue 0
 int* trigger &defaultValue
 int triggerPreviousValue 0
 int[] steps 16 0
 int stepPointer &steps
 int stepLength 4
 int out 0

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
