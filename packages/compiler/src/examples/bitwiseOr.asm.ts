export default `module bitwiseOr

int default1 0
int default2 0
int* in:1 &default1
int* in:2 &default2
int out 0

push &out
push *in:1
push *in:2
or
store

end
`;
