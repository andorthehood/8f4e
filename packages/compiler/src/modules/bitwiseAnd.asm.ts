export default `
	private default1 0
	private default2 0
	inputPointer in:1 default1
	inputPointer in:2 default2
	output out 0
		
	const out
	load in:1
	load
	load in:2
	load
	and
	store
`;
