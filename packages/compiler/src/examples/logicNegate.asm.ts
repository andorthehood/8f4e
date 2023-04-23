export default `module logicNegate

int defaultValue 0
int* in &defaultValue
int out 0

push &out
push *in
push 0
greaterThan
if
 push 0
else 
 push I16_SIGNED_LARGEST_NUMBER
end

store
end
`;
