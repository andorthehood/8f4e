export default `module offset

int defaultValue 0
int* in &defaultValue
int offset 0
int out 0

const HIGH I16_SIGNED_LARGEST_NUMBER
const LOW I16_SIGNED_SMALLEST_NUMBER

local int result

push &out
 push *in
 push offset
 add
 localSet result

 push result
 push HIGH
 greaterOrEqual
 if 
  push HIGH
 else
  push result
 end
 localSet result
 
 push result
 push LOW
 lessOrEqual
 if 
  push LOW
 else 
  push result
 end
store

moduleEnd`;
