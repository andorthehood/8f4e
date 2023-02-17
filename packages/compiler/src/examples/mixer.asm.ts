export default `module mixer

memory defaultValue 0
memory out 0
memory in:1 &defaultValue
memory in:2 &defaultValue
memory in:3 &defaultValue
memory in:4 &defaultValue

const HIGH I16_SIGNED_LARGEST_NUMBER
const LOW I16_SIGNED_SMALLEST_NUMBER

local result

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
`;
