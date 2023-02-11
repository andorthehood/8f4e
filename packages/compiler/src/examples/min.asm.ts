export default `module min

private defaultValue 0
inputPointer in:1 &defaultValue
inputPointer in:2 &defaultValue
output out 0

local input1
local input2

push &out
 push in:1
 localSet input1

 push in:2
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
