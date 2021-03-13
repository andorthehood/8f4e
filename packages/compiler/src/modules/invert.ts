import { i32load, i32const, i32store } from '../wasm/instructions';
import { createFunctionBody } from '../wasm/sections';
import { Instruction } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

export const enum Memory {
	DEFAULT_VALUE,
	INPUT_POINTER,
	OUTPUT,
}

const invert: ModuleGenerator = function (moduleId, offset, initialConfig, bytes = 4) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(Memory.OUTPUT * bytes + offset),
			...i32const(Memory.INPUT_POINTER * bytes + offset),
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
		initialMemory: [0, Memory.DEFAULT_VALUE * bytes + offset, Memory.DEFAULT_VALUE * bytes + offset, 0],
		memoryAddresses: [
			{ address: Memory.OUTPUT * bytes + offset, id: 'out' },
			{
				address: Memory.INPUT_POINTER * bytes + offset,
				id: 'in',
				default: Memory.DEFAULT_VALUE * bytes + offset,
				isInputPointer: true,
			},
		],
	};
};

export default invert;
