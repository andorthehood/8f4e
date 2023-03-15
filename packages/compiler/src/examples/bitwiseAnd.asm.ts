export default `module bitwiseAnd

memory int default1 0
memory int default2 0
memory int* in:1 &default1
memory int* in:2 &default2
memory int out 0

push &out
push *in:1
push *in:2
and
store
`;
