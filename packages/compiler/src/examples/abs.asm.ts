export default `module abs

# memory
int defaultValue 0
int* in &defaultValue
int out 0

# locals
local input

# code
push &out
push *in
localSet input
push input
push 0
lessThan
if 
 push 0
 push input
 sub
else
 push input
end
store
`;
