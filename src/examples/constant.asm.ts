import { ModuleStateExtractor, ModuleStateInserter } from './types';

interface ConstantState {
	out: number;
}

export const insertState: ModuleStateInserter<ConstantState> = function (state, memoryBuffer, moduleAddress) {
	memoryBuffer[moduleAddress + 0] = state.out;
};

export const extractState: ModuleStateExtractor<ConstantState> = function (memoryBuffer, moduleAddress) {
	return { out: memoryBuffer[moduleAddress + 0] };
};

export default `
	module constant
	output out 0
`;
