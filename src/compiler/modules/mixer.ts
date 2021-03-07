import { i32load, i32const, i32store, localSet, localGet, ifelse } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '../consts';

const enum Memory {
	ZERO = 0x00,
	OUTPUT = 0x04,
	INPUT_POINTER_1 = 8,
	INPUT_POINTER_2 = 12,
	INPUT_POINTER_3 = 16,
	INPUT_POINTER_4 = 20,
}

const enum Locals {
	RESULT,
	__LENGTH,
}

const mixer: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(Memory.OUTPUT + offset),

			...[
				...i32const(Memory.INPUT_POINTER_1 + offset),
				...i32load(),
				...i32load(),

				...i32const(Memory.INPUT_POINTER_2 + offset),
				...i32load(),
				...i32load(),

				Instruction.I32_ADD,

				...i32const(Memory.INPUT_POINTER_3 + offset),
				...i32load(),
				...i32load(),

				Instruction.I32_ADD,

				...i32const(Memory.INPUT_POINTER_4 + offset),
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
		initialMemory: [0, 0, Memory.ZERO + offset, Memory.ZERO + offset, Memory.ZERO + offset, Memory.ZERO + offset],
		memoryAddresses: [
			{ address: Memory.INPUT_POINTER_1 + offset, id: 'in1', isInputPointer: true },
			{ address: Memory.INPUT_POINTER_2 + offset, id: 'in2', isInputPointer: true },
			{ address: Memory.INPUT_POINTER_3 + offset, id: 'in3', isInputPointer: true },
			{ address: Memory.INPUT_POINTER_4 + offset, id: 'in4', isInputPointer: true },
			{ address: Memory.OUTPUT + offset, id: 'out' },
		],
	};
};

export default mixer;
