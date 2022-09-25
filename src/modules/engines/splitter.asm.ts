export default `
	private zero 0
	inputPointer in zero
	output out:1 zero
	output out:2 zero
	output out:3 zero
	output out:4 zero

	local input

	push in
	localSet input

	pushRef out:1
	push input
	store

	pushRef out:2
	push input
	store

	pushRef out:3
	push input
	store

	pushRef out:4
	push input
	store
`;
