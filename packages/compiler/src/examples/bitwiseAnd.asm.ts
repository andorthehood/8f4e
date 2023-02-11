export default `module bitwiseAnd

private default1 0
private default2 0
inputPointer in:1 &default1
inputPointer in:2 &default2
output out 0

push &out
push in:1
push in:2
and
store
`;
