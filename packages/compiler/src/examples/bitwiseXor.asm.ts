export default `module bitwiseXor

memory default1 0
memory default2 0
memory in:1 &default1
memory in:2 &default2
memory out 0

push &out
push *in:1
push *in:2
xor
store
`;
