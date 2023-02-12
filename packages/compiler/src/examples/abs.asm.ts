export default `module abs

# memory
memory defaultValue 0
memory in &defaultValue
memory out 0

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
