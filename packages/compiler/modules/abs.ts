import { i32load, i32const, i32store, localSet, localGet, ifelse } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

const enum Memory {
	ZERO = 0x00,
	INPUT_POINTER = 0x04,
	OUTPUT = 0x08,
}

const enum Locals {
	INPUT,
	__LENGTH,
}

const abs: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(Memory.OUTPUT + offset),
			...i32const(Memory.INPUT_POINTER + offset),
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
		initialMemory: [0, Memory.ZERO + offset, Memory.ZERO + offset, 0],
		memoryAddresses: [
			{ address: Memory.OUTPUT + offset, id: 'out' },
			{ address: Memory.INPUT_POINTER + offset, id: 'in', default: Memory.ZERO + offset, isInputPointer: true },
		],
	};
};

export default abs;
