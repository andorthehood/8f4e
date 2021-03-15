import { i32load, i32const, i32store, localSet, localGet, ifelse } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

export const enum Memory {
	DEFAULT_VALUE,
	INPUT_POINTER,
	OUTPUT,
}

const enum Locals {
	INPUT,
	__LENGTH,
}

const abs: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset(Memory.OUTPUT)),
			...i32const(offset(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.INPUT),

			...localGet(Locals.INPUT),
			...i32const(0),
			Instruction.I32_LT_S,
			...ifelse(
				Type.I32,
				[...i32const(0), ...localGet(Locals.INPUT), Instruction.I32_SUB],
				[...localGet(Locals.INPUT)]
			),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, offset(Memory.DEFAULT_VALUE), offset(Memory.DEFAULT_VALUE), 0],
		memoryAddresses: [
			{ address: offset(Memory.OUTPUT), id: 'out' },
			{
				address: offset(Memory.INPUT_POINTER),
				id: 'in',
				default: offset(Memory.DEFAULT_VALUE),
			},
		],
	};
};

export default abs;
