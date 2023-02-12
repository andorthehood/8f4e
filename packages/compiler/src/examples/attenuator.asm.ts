export default `module attenuator

memory zero 0
memory in &zero
memory divisor 1
memory out 0

push &out
push *in
push divisor
div
store
`;
