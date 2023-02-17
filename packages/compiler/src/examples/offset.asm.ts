export default `module offset

memory defaultValue 0
memory in &defaultValue
memory offset 0
memory out 0

const HIGH I16_SIGNED_LARGEST_NUMBER
const LOW I16_SIGNED_SMALLEST_NUMBER

local result

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
`;
