import { i32const, i32load, i32store } from '../wasm/instructions';
import { createFunctionBody } from '../wasm/sections';
import { Instruction } from '../wasm/enums';
import { ModuleGenerator } from './types';

const enum Memory {
	ZERO = 0x00,
	INPUT_POINTER = 0x04,
	DIVISOR = 0x08,
	OUT = 0x0c,
}

const attenuator: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(Memory.OUT + offset),
			...i32const(Memory.INPUT_POINTER + offset),
			...i32load(),
			...i32load(),
			...i32const(Memory.DIVISOR + offset),
			...i32load(),
			Instruction.I32_DIV_S,
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [0, Memory.ZERO + offset, 10, 0],
		memoryAddresses: [
			{ address: Memory.OUT + offset, id: 'out' },
			{ address: Memory.INPUT_POINTER + offset, id: 'in', isInputPointer: true },
		],
	};
};

export default attenuator;
