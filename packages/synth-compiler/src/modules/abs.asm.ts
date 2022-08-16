export default `
	# abs module

	# memory
	private DEFAULT_VALUE 0
	inputPointer in DEFAULT_VALUE
	output out 0

	# locals
	local input

	# code
	const out
	load in
	localSet input
	localGet input
	const 0
	lessThan
	if 
		const 0
		localGet input
		sub
	else
		localGet input
	end
	store
`;
