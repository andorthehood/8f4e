import { i32load, i32const, i32store, ifelse, localSet, localGet } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from '../../../byteCodeUtils/src';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '../consts';

export const enum Memory {
	ZERO,
	INPUT_POINTER,
	OFFSET,
	OUTPUT,
}

const enum Locals {
	RESULT,
	__LENGTH,
}

const offset: ModuleGenerator = function (moduleId, offset, initialConfig) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset(Memory.OUTPUT)),
			...[
				...i32const(offset(Memory.INPUT_POINTER)),
				...i32load(),
				...i32load(),

				...i32const(offset(Memory.OFFSET)),
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
		offset: offset(0),
		initialMemory: [0, offset(Memory.ZERO), initialConfig.offset, 0],
		memoryAddresses: [
			{ address: offset(Memory.OUTPUT), id: 'out' },
			{ address: offset(Memory.OFFSET), id: 'offset', default: initialConfig.offset },
			{ address: offset(Memory.INPUT_POINTER), id: 'in', default: offset(Memory.ZERO) },
		],
	};
};

export default offset;
