import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

export default `
	private defaultValue 0
	inputPointer in:1 defaultValue
	inputPointer in:2 defaultValue
	output out 0

	push in:1
	push 0
	greaterThan
	if void
		push in:2
		push 0
		greaterThan
		if void
			pushRef out
			push ${I16_SIGNED_LARGEST_NUMBER}
			store
			break 2
		end
	end

	pushRef out
	push 0
	store
`;
