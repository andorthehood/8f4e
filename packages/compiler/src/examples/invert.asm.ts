export default `module invert

memory default 0
memory in &default
memory out 0

push &out
push *in
push -1
mul
store
`;
