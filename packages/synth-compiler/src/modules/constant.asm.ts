import { ModuleStateExtractor, ModuleStateInserter } from '../types';

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
	output out 0
`;
