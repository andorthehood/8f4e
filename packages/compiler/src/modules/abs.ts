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

const abs: ModuleGenerator = function (moduleId, offset, initialConfig, bytes = 4) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(Memory.OUTPUT * bytes + offset),
			...i32const(Memory.INPUT_POINTER * bytes + offset),
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
		offset,
		initialMemory: [0, Memory.DEFAULT_VALUE * bytes + offset, Memory.DEFAULT_VALUE + offset, 0],
		memoryAddresses: [
			{ address: Memory.OUTPUT * bytes + offset, id: 'out' },
			{
				address: Memory.INPUT_POINTER * bytes + offset,
				id: 'in',
				default: Memory.DEFAULT_VALUE + offset,
				isInputPointer: true,
			},
		],
	};
};

export default abs;
