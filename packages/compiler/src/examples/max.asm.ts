export default `module max

memory defaultValue 0
memory in:1 &defaultValue
memory in:2 &defaultValue
memory out 0

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
