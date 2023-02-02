import { I16_SIGNED_LARGEST_NUMBER } from './consts';

export default `
	private defaultValue 0
	inputPointer in defaultValue
	output out 0

	push &out
	push in
	push 0
	greaterThan
	if
		push 0
	else 
		push ${I16_SIGNED_LARGEST_NUMBER}
	end

	store
`;
