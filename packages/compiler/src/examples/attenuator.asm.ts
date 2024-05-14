export default `module attenuator

int zero 0
int* in &zero
int divisor 1
int out 0

push &out
push *in
push divisor
ensureNonZero
div
store

moduleEnd
`;
