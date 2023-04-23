export default `module invert

int default 0
int* in &default
int out 0

push &out
push *in
push -1
mul
store
end
`;
