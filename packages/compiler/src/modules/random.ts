import { localGet, localSet, i32const, i32load, i32store, ifelse } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

export const enum Memory {
	OUTPUT,
}

const enum Locals {
	RANDOM,
	FEEDBACK,
	__LENGTH,
}

/* Linear-feedback shift register style random generator. */
const random: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset(Memory.OUTPUT)),
			...[
				...i32const(offset(Memory.OUTPUT)),
				...i32load(),
				...localSet(Locals.RANDOM),

				...localGet(Locals.RANDOM),
				...i32const(1 << 0),
				Instruction.I32_AND,
				...localSet(Locals.FEEDBACK),

				...localGet(Locals.RANDOM),
				...i32const(1 << 3),
				Instruction.I32_AND,
				...i32const(3),
				Instruction.I32_SHR_S,
				...localGet(Locals.FEEDBACK),
				Instruction.I32_XOR,
				...localSet(Locals.FEEDBACK),

				...localGet(Locals.RANDOM),
				...i32const(1 << 4),
				Instruction.I32_AND,
				...i32const(4),
				Instruction.I32_SHR_S,
				...localGet(Locals.FEEDBACK),
				Instruction.I32_XOR,
				...localSet(Locals.FEEDBACK),

				...localGet(Locals.RANDOM),
				...i32const(1 << 6),
				Instruction.I32_AND,
				...i32const(6),
				Instruction.I32_SHR_S,
				...localGet(Locals.FEEDBACK),
				Instruction.I32_XOR,
				...localSet(Locals.FEEDBACK),

				...localGet(Locals.RANDOM),
				...i32const(1),
				Instruction.I32_SHR_U,
				...localSet(Locals.RANDOM),

				...localGet(Locals.FEEDBACK),
				0x45, // Instruction.I32_EQZ
				...ifelse(
					Type.I32,
					[...localGet(Locals.RANDOM)],
					[...localGet(Locals.RANDOM), ...i32const(0b10000000000000000000000000000000), Instruction.I32_OR]
				),
			],

			...i32const(I16_SIGNED_LARGEST_NUMBER),
			Instruction.I32_REM_S,
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [Date.now() % I16_SIGNED_LARGEST_NUMBER],
		memoryAddresses: [{ address: offset(Memory.OUTPUT), id: 'out' }],
	};
};

export default random;
