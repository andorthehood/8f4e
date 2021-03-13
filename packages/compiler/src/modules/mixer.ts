import { i32load, i32const, i32store, localSet, localGet, ifelse } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '../consts';

export const enum Memory {
	DEFAULT_VALUE,
	OUTPUT,
	INPUT_POINTER_1,
	INPUT_POINTER_2,
	INPUT_POINTER_3,
	INPUT_POINTER_4,
}

const enum Locals {
	RESULT,
	__LENGTH,
}

const mixer: ModuleGenerator = function (moduleId, offset, initialConfig, bytes = 4) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(Memory.OUTPUT * bytes + offset),

			...[
				...i32const(Memory.INPUT_POINTER_1 * bytes + offset),
				...i32load(),
				...i32load(),

				...i32const(Memory.INPUT_POINTER_2 * bytes + offset),
				...i32load(),
				...i32load(),

				Instruction.I32_ADD,

				...i32const(Memory.INPUT_POINTER_3 * bytes + offset),
				...i32load(),
				...i32load(),

				Instruction.I32_ADD,

				...i32const(Memory.INPUT_POINTER_4 * bytes + offset),
				...i32load(),
				...i32load(),

				Instruction.I32_ADD,
				...localSet(Locals.RESULT),

				// Limit
				...localGet(Locals.RESULT),
				...i32const(I16_SIGNED_LARGEST_NUMBER),
				Instruction.I32_GE_S,
				...ifelse(Type.I32, [...i32const(I16_SIGNED_LARGEST_NUMBER)], [...localGet(Locals.RESULT)]),
				...localSet(Locals.RESULT),

				...localGet(Locals.RESULT),
				...i32const(I16_SIGNED_SMALLEST_NUMBER),
				Instruction.I32_LE_S,
				...ifelse(Type.I32, [...i32const(I16_SIGNED_SMALLEST_NUMBER)], [...localGet(Locals.RESULT)]),
			],

			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [
			0,
			0,
			Memory.DEFAULT_VALUE * bytes + offset,
			Memory.DEFAULT_VALUE * bytes + offset,
			Memory.DEFAULT_VALUE * bytes + offset,
			Memory.DEFAULT_VALUE * bytes + offset,
		],
		memoryAddresses: [
			{ address: Memory.INPUT_POINTER_1 * bytes + offset, id: 'in1', isInputPointer: true },
			{ address: Memory.INPUT_POINTER_2 * bytes + offset, id: 'in2', isInputPointer: true },
			{ address: Memory.INPUT_POINTER_3 * bytes + offset, id: 'in3', isInputPointer: true },
			{ address: Memory.INPUT_POINTER_4 * bytes + offset, id: 'in4', isInputPointer: true },
			{ address: Memory.OUTPUT * bytes + offset, id: 'out' },
		],
	};
};

export default mixer;
