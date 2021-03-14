import { i32load, i32const, i32store, ifelse, br, localSet, localGet } from '../wasm/instructions';
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

const min: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset(Memory.OUTPUT)),
			...[
				...i32const(offset(Memory.INPUT_1_POINTER)),
				...i32load(),
				...i32load(),
				...localSet(Locals.INPUT_1),

				...i32const(offset(Memory.INPUT_2_POINTER)),
				...i32load(),
				...i32load(),
				...localSet(Locals.INPUT_2),

				...localGet(Locals.INPUT_1),
				...localGet(Locals.INPUT_2),
				Instruction.I32_LE_S,
				...ifelse(Type.I32, [...localGet(Locals.INPUT_1)], [...localGet(Locals.INPUT_2)]),
			],

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
				id: 'in1',
				default: offset(Memory.ZERO),
				isInputPointer: true,
			},
			{
				address: offset(Memory.INPUT_2_POINTER),
				id: 'in2',
				default: offset(Memory.ZERO),
				isInputPointer: true,
			},
		],
	};
};

export default min;
