export default `module invert

memory int default 0
memory int* in &default
memory int out 0

push &out
push *in
push -1
mul
store
`;
