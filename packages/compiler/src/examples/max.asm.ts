export default `module max

int defaultValue 0
int* in:1 &defaultValue
int* in:2 &defaultValue
int out 0

local int _in1
local int _in2

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

moduleEnd`;
