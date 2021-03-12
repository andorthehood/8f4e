import { i32load, i32const, i32store } from '../wasm/instructions';
import { createFunctionBody } from '../wasm/sections';
import { Instruction } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

const enum Memory {
	ZERO = 0x00,
	INPUT_POINTER = 0x04,
	OUTPUT = 0x08,
}

const invert: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(Memory.OUTPUT + offset),
			...i32const(Memory.INPUT_POINTER + offset),
			...i32load(),
			...i32load(),
			...i32const(-1),
			Instruction.I32_MUL, // TODO: replace MUL with bitwise operation
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [0, Memory.ZERO + offset, Memory.ZERO + offset, 0],
		memoryAddresses: [
			{ address: Memory.OUTPUT + offset, id: 'out' },
			{ address: Memory.INPUT_POINTER + offset, id: 'in', default: Memory.ZERO + offset, isInputPointer: true },
		],
	};
};

export default invert;
