import { i32load, i32const, i32store, ifelse, br, localSet, localGet } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

const enum Memory {
	ZERO = 0x00,
	INPUT_1_POINTER = 0x04,
	INPUT_2_POINTER = 0x08,
	OUTPUT = 0x0c,
}

const enum Locals {
	INPUT_1,
	INPUT_2,
	__LENGTH,
}

const max: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(Memory.OUTPUT + offset),
			...[
				...i32const(Memory.INPUT_1_POINTER + offset),
				...i32load(),
				...i32load(),
				...localSet(Locals.INPUT_1),

				...i32const(Memory.INPUT_2_POINTER + offset),
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
		initialMemory: [0, Memory.ZERO + offset, Memory.ZERO + offset, 0],
		memoryAddresses: [
			{ address: Memory.OUTPUT + offset, id: 'out' },
			{ address: Memory.INPUT_1_POINTER + offset, id: 'in1', default: Memory.ZERO + offset, isInputPointer: true },
			{ address: Memory.INPUT_2_POINTER + offset, id: 'in2', default: Memory.ZERO + offset, isInputPointer: true },
		],
	};
};

export default max;
