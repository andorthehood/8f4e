export default `module min

memory int defaultValue 0
memory int* in:1 &defaultValue
memory int* in:2 &defaultValue
memory int out 0

local input1
local input2

push &out
 push *in:1
 localSet input1

 push *in:2
 localSet input2

 push input1
 push input2
 lessOrEqual
 if 
  push input1
 else
  push input2
 end
store
`;
