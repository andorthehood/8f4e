import { I16_SIGNED_LARGEST_NUMBER } from './consts';

export default `
	module logucOr

	private defaultValue 0
	inputPointer in:1 defaultValue
	inputPointer in:2 defaultValue
	output out 0

	const HIGH ${I16_SIGNED_LARGEST_NUMBER}

	push in:1
	push 0
	greaterThan
	if void
		push &out
		push HIGH
		store
		branch 1
	end

	push in:2
	push 0
	greaterThan
	if void
		push &out
		push HIGH
		store
		branch 1
	end

	push out
	push 0
	store
`;
