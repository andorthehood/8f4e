import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from './consts';

export default `
	private defaultValue 0
	output out 0
	inputPointer in:1 defaultValue
	inputPointer in:2 defaultValue
	inputPointer in:3 defaultValue
	inputPointer in:4 defaultValue

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
		push ${I16_SIGNED_LARGEST_NUMBER}
		greaterOrEqual
		if
			push ${I16_SIGNED_LARGEST_NUMBER}
		else
			push result
		end
		localSet result

		push result
		push ${I16_SIGNED_SMALLEST_NUMBER}
		lessOrEqual
		if
			push ${I16_SIGNED_SMALLEST_NUMBER}
		else
			push result
		end	
	store
`;
