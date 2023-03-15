export default `module max

memory int defaultValue 0
memory int* in:1 &defaultValue
memory int* in:2 &defaultValue
memory int out 0

local _in1
local _in2

push &out
 push *in:1
 localSet _in1

 push *in:2
 localSet _in2

 push _in1
 push _in2
 greaterThan
 if 
  localGet _in1
 else
  localGet _in2
 end
store
`;
