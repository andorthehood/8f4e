export default `module logicAnd

memory int defaultValue 0
memory int* in:1 &defaultValue
memory int* in:2 &defaultValue
memory int out 0

push *in:1
push 0
greaterThan
if void
 push *in:2
 push 0
 greaterThan
 if void
  push &out
  push I16_SIGNED_LARGEST_NUMBER
  store
  branch 2
 end
end

push &out
push 0
store
`;
