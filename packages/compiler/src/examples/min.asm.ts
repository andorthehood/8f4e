export default `module min

memory defaultValue 0
memory in:1 &defaultValue
memory in:2 &defaultValue
memory out 0

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
