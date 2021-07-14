import { Instruction, i32const, i32load, i32store, createFunctionBody } from 'bytecode-utils';
import { ModuleGenerator, ModuleStateInserter, ModuleStateExtractor, MemoryTypes } from '../types';

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

const attenuator: ModuleGenerator<unknown, Memory> = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(offset.byte(Memory.OUT)),
			...i32const(offset.byte(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...i32const(offset.byte(Memory.DIVISOR)),
			...i32load(),
			Instruction.I32_DIV_S,
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset.byte(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.ZERO, default: 0 },
			{ type: MemoryTypes.INPUT_POINTER, address: Memory.INPUT_POINTER, id: 'in', default: offset.byte(Memory.ZERO) },
			{ type: MemoryTypes.NUMBER, address: Memory.DIVISOR, id: 'divisor', default: 1, reclaimable: true },
			{ type: MemoryTypes.OUTPUT, address: Memory.OUT, id: 'out', default: 0 },
		],
	};
};

export default attenuator;
