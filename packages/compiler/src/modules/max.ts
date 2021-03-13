import { i32load, i32const, i32store, ifelse, localSet, localGet } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

export const enum Memory {
	ZERO,
	INPUT_1_POINTER,
	INPUT_2_POINTER,
	OUTPUT,
}

const enum Locals {
	INPUT_1,
	INPUT_2,
	__LENGTH,
}

const max: ModuleGenerator = function (moduleId, offset, initialConfig, bytes = 4) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(Memory.OUTPUT * bytes + offset),
			...[
				...i32const(Memory.INPUT_1_POINTER * bytes + offset),
				...i32load(),
				...i32load(),
				...localSet(Locals.INPUT_1),

				...i32const(Memory.INPUT_2_POINTER * bytes + offset),
				...i32load(),
				...i32load(),
				...localSet(Locals.INPUT_2),

				...localGet(Locals.INPUT_1),
				...localGet(Locals.INPUT_2),
				Instruction.I32_GT_S,
				...ifelse(Type.I32, [...localGet(Locals.INPUT_1)], [...localGet(Locals.INPUT_2)]),
			],

			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [0, Memory.ZERO * bytes + offset, Memory.ZERO * bytes + offset, 0],
		memoryAddresses: [
			{ address: Memory.OUTPUT * bytes + offset, id: 'out' },
			{
				address: Memory.INPUT_1_POINTER * bytes + offset,
				id: 'in1',
				default: Memory.ZERO * bytes + offset,
				isInputPointer: true,
			},
			{
				address: Memory.INPUT_2_POINTER * bytes + offset,
				id: 'in2',
				default: Memory.ZERO * bytes + offset,
				isInputPointer: true,
			},
		],
	};
};

export default max;
