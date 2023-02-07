import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from './consts';

export default `
	module mixer

	private defaultValue 0
	output out 0
	inputPointer in:1 defaultValue
	inputPointer in:2 defaultValue
	inputPointer in:3 defaultValue
	inputPointer in:4 defaultValue

	const HIGH ${I16_SIGNED_LARGEST_NUMBER}
	const LOW ${I16_SIGNED_SMALLEST_NUMBER}

	local result

	push &out
		push in:1
		push in:2
		add
		push in:3
		add
		push in:4
		add
		localSet result

		push result
		push HIGH
		greaterOrEqual
		if
			push HIGH
		else
			push result
		end
		localSet result

		push result
		push LOW
		lessOrEqual
		if
			push LOW
		else
			push result
		end	
	store
`;
