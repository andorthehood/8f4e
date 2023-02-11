export default `module attenuator
private zero 0
inputPointer in &zero
public divisor 1
output out 0
push &out
push in
push divisor
div
store
`;
