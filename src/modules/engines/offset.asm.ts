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
	private defaultValue 0
	inputPointer in defaultValue
	public offset 0
	output out 0

	local result

	pushRef out
		push in
		push offset
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
