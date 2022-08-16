import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

export default `
	private defaultValue 0
	inputPointer in:1 defaultValue
	inputPointer in:2 defaultValue
	output out 0

	load in:1
	load
	const 0
	greaterThan
	if void
		load in:2
		load
		const 0
		greaterThan
		if void
			const out
			const ${I16_SIGNED_LARGEST_NUMBER}
			store
			break 2
		end
	end

	const out
	const 0
	store
`;
