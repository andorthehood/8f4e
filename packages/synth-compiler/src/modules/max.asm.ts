export default `
	private defaultValue 0
	inputPointer in:1 defaultValue
	inputPointer in:2 defaultValue
	output out 0

	local _in1
	local _in2

	pushRef out
		push in:1
		localSet _in1

		push in:2
		localSet _in2

		push _in1
		push _in2
		greaterThan
		if 
			localGet _in1
		else
			localGet _in2
		end
	store
`;
