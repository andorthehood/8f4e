import { I16_SIGNED_LARGEST_NUMBER } from './consts';

export default `
	private defaultValue 0
	inputPointer in:1 defaultValue
	inputPointer in:2 defaultValue
	output out 0

	block void
		push in:1
		push 0
		greaterThan
		if void
			push in:2
			push 0
			greaterThan
			branchIfTrue 1
		else
			push in:2
			push 0
			lessOrEqual 
			branchIfTrue 1
		end

		push &out
		push ${I16_SIGNED_LARGEST_NUMBER}
		store
		branch 1
	end

	push &out
	push 0
	store
`;
