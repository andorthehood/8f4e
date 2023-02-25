export default `module stepSequencer

 memory defaultValue 0
 memory trigger &defaultValue
 memory triggerPreviousValue 0
 array steps 16 0
 memory stepPointer &steps
 memory stepLength 4
 memory out 0

 local _stepPointer

 push stepPointer
 localSet _stepPointer

 push *trigger
 push triggerPreviousValue
 greaterThan
 if void
 push _stepPointer
 pointerForward
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
