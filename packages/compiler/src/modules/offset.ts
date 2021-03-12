import { i32load, i32const, i32store, ifelse, localSet, localGet } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '../consts';

const enum Memory {
	ZERO = 0x00,
	INPUT_POINTER = 0x04,
	OFFSET = 0x08,
	OUTPUT = 12,
}

const enum Locals {
	RESULT,
	__LENGTH,
}

const offset: ModuleGenerator = function (moduleId, offset, initialConfig) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(Memory.OUTPUT + offset),
			...[
				...i32const(Memory.INPUT_POINTER + offset),
				...i32load(),
				...i32load(),

				...i32const(Memory.OFFSET + offset),
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
		initialMemory: [0, Memory.ZERO + offset, initialConfig.offset, 0],
		memoryAddresses: [
			{ address: Memory.OUTPUT + offset, id: 'out' },
			{ address: Memory.OFFSET + offset, id: 'offset', default: initialConfig.offset },
			{ address: Memory.INPUT_POINTER + offset, id: 'in', isInputPointer: true, default: Memory.ZERO + offset },
		],
	};
};

export default offset;
