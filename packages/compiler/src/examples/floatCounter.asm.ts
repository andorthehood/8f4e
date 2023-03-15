export default `module constant
memory int test
memory float out 0.1

push &out
push out
push 0.1
add
store
`;
