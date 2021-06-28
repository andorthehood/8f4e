import { Instruction, i32const, i32load, i32store, createFunctionBody } from 'bytecode-utils';
import { ModuleGenerator, ModuleStateInserter, ModuleStateExtractor } from '../types';

enum Memory {
	ZERO,
	INPUT_POINTER,
	DIVISOR,
	OUT,
}

interface AttenuatorState {
	divisor: number;
}

export const insertState: ModuleStateInserter<AttenuatorState> = function (state, memoryBuffer, moduleAddress) {
	memoryBuffer[moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.DIVISOR] = state.divisor;
};

export const extractState: ModuleStateExtractor<AttenuatorState> = function (memoryBuffer, moduleAddress) {
	return { divisor: memoryBuffer[moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.DIVISOR] };
};

const attenuator: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(offset(Memory.OUT)),
			...i32const(offset(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...i32const(offset(Memory.DIVISOR)),
			...i32load(),
			Instruction.I32_DIV_S,
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, offset(Memory.ZERO), 1, 0],
		memoryAddresses: [
			{ address: offset(Memory.OUT), id: 'out' },
			{ address: offset(Memory.DIVISOR), id: 'divisor' },
			{ address: offset(Memory.INPUT_POINTER), id: 'in' },
		],
	};
};

export default attenuator;
