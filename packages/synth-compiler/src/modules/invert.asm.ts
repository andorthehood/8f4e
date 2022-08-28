export default `
	private default 0
	inputPointer in default
	output out 0
		
	pushRef out
	push in
	push -1
	mul
	store
`;
