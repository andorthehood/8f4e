import { compile } from '@8f4e/module-compiler';
import { ModuleGenerator, ModuleStateInserter, ModuleStateExtractor } from '../types';

export enum Memory {
	ZERO,
	INPUT_POINTER,
	DIVISOR,
	OUT,
}

interface AttenuatorState {
	divisor: number;
}

export const insertState: ModuleStateInserter<AttenuatorState> = function (state, memoryBuffer, moduleAddress) {
	memoryBuffer[moduleAddress + Memory.DIVISOR] = state.divisor;
};

export const extractState: ModuleStateExtractor<AttenuatorState> = function (memoryBuffer, moduleAddress) {
	return { divisor: memoryBuffer[moduleAddress + Memory.DIVISOR] };
};

const attenuator: ModuleGenerator<unknown> = function (moduleId, offset) {
	return compile(
		`private zero 0
		inputPointer in zero
		public divisor 1
		output out 0
		const out
		load in
		load
		load divisor
		div
		store`,
		moduleId,
		offset.byte(0)
	);
};

export default attenuator;
