export default `module attenuator

memory int zero 0
memory int* in &zero
memory int divisor 1
memory int out 0

push &out
push *in
push divisor
div
store
`;
