import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from './consts';
import { ModuleStateExtractor, ModuleStateInserter } from './types';

interface OffsetState {
	offset: number;
}

export const insertState: ModuleStateInserter<OffsetState> = function (state, memoryBuffer, moduleAddress) {
	memoryBuffer[moduleAddress + 2] = state.offset;
};

export const extractState: ModuleStateExtractor<OffsetState> = function (memoryBuffer, moduleAddress) {
	return { offset: memoryBuffer[moduleAddress + 2] };
};

export default `
	module offset

	private defaultValue 0
	inputPointer in defaultValue
	public offset 0
	output out 0

	const HIGH ${I16_SIGNED_LARGEST_NUMBER}
	const LOW ${I16_SIGNED_SMALLEST_NUMBER}

	local result

	push &out
		push in
		push offset
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
