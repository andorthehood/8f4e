import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

export default `
	private defaultValue 0
	inputPointer in defaultValue
	output out 0

	const out
	load in
	const 0
	greaterThan
	if
		const 0
	else 
		const ${I16_SIGNED_LARGEST_NUMBER}
	end

	store
`;
