import { i32load, i32const, i32store } from '../wasm/instructions';
import { createFunctionBody } from '../wasm/sections';
import { Instruction } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

export const enum Memory {
	ZERO,
	INPUT_1_POINTER,
	INPUT_2_POINTER,
	OUTPUT,
}

const bitwiseOr: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(offset(Memory.OUTPUT)),
			...i32const(offset(Memory.INPUT_1_POINTER)),
			...i32load(),
			...i32load(),
			...i32const(offset(Memory.INPUT_2_POINTER)),
			...i32load(),
			...i32load(),
			Instruction.I32_OR,
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, offset(Memory.ZERO), offset(Memory.ZERO), 0],
		memoryAddresses: [
			{ address: offset(Memory.OUTPUT), id: 'out' },
			{
				address: offset(Memory.INPUT_1_POINTER),
				id: 'in:1',
				default: offset(Memory.ZERO),
			},
			{
				address: offset(Memory.INPUT_2_POINTER),
				id: 'in:2',
				default: offset(Memory.ZERO),
			},
		],
	};
};

export default bitwiseOr;
