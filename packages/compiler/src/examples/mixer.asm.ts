export default `module mixer

int defaultValue 0
int out 0
int* in:1 &defaultValue
int* in:2 &defaultValue
int* in:3 &defaultValue
int* in:4 &defaultValue

const HIGH I16_SIGNED_LARGEST_NUMBER
const LOW I16_SIGNED_SMALLEST_NUMBER

local int result

push &out
 push *in:1
 push *in:2
 add
 push *in:3
 add
 push *in:4
 add
 localSet result

 push result
 push HIGH
 greaterOrEqual
 if
  push HIGH
 else
  push result
 ifEnd
 localSet result

 push result
 push LOW
 lessOrEqual
 if
  push LOW
 else
  push result
 ifEnd
store

moduleEnd`;
