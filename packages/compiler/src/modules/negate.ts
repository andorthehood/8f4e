import { i32load, i32const, i32store, ifelse } from '../wasm/instructions';
import { createFunctionBody } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

export const enum Memory {
	DEFAULT_VALUE,
	INPUT_POINTER,
	OUTPUT,
}

const negate: ModuleGenerator = function (moduleId, offset, initialConfig, bytes = 4) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(Memory.OUTPUT * bytes + offset),
			...i32const(Memory.INPUT_POINTER * bytes + offset),
			...i32load(),
			...i32load(),
			...i32const(0),
			Instruction.I32_GT_S,
			...ifelse(Type.I32, [...i32const(0)], [...i32const(I16_SIGNED_LARGEST_NUMBER)]),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [0, Memory.DEFAULT_VALUE * bytes + offset, 0],
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

export default negate;
