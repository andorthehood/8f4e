export default `module min

int defaultValue 0
int* in:1 &defaultValue
int* in:2 &defaultValue
int out 0

local int input1
local int input2

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

end
`;
