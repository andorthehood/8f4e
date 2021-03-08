import { i32const, i32load, i32store, ifelse, localGet, localSet } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

const enum Memory {
	COUNTER = 0x00,
	RATE_POINTER = 0x04,
	RATE_SELF = 0x08,
	LIMIT_POINTER = 0xc,
	LIMIT_SELF = 0x10,
}

const enum Locals {
	COUNTER,
	LIMIT,
	RATE,
	__LENGTH,
}

const saw: ModuleGenerator = function (moduleId, offset, initialConfig) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			// Load data from memory into local variables.
			...i32const(Memory.RATE_POINTER + offset),
			...i32load(),
			...i32load(),
			...localSet(Locals.RATE),

			...i32const(Memory.LIMIT_POINTER + offset),
			...i32load(),
			...i32load(),
			...localSet(Locals.LIMIT),

			...i32const(Memory.COUNTER + offset),
			...i32load(),
			...localSet(Locals.COUNTER),

			...localGet(Locals.COUNTER),
			...localGet(Locals.LIMIT),
			Instruction.I32_GE_S,
			...ifelse(
				Type.I32,
				[...i32const(0), ...localGet(Locals.LIMIT), Instruction.I32_SUB],
				[...localGet(Locals.RATE), ...localGet(Locals.COUNTER), Instruction.I32_ADD]
			),
			...localSet(Locals.COUNTER),

			// Save data to memory.
			...i32const(Memory.COUNTER + offset),
			...localGet(Locals.COUNTER),
			...i32store(),
		]
	);

	const initialMemory = [
		0,
		offset + Memory.RATE_SELF,
		initialConfig.rate,
		offset + Memory.LIMIT_SELF,
		I16_SIGNED_LARGEST_NUMBER,
	];

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory,
		memoryAddresses: [
			{ address: Memory.COUNTER + offset, id: 'out' },
			{ address: Memory.RATE_POINTER + offset, id: 'ratein', isInputPointer: true, default: Memory.RATE_SELF + offset },
			{ address: Memory.RATE_SELF + offset, id: 'rate', default: initialConfig.rate },
		],
	};
};

export default saw;
