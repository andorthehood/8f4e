import { i32const, i32load, i32store, ifelse, localGet, localSet } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

const enum Memory {
	COUNTER = 0x00,
	RATE_SELF = 0x04,
	OUTPUT = 0x08,
}

const enum Locals {
	COUNTER,
	OUTPUT,
	RATE,
	__LENGTH,
}

const clock: ModuleGenerator = function (moduleId, offset, initialConfig) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			// Load variables from the memory
			...i32const(Memory.OUTPUT + offset),
			...i32load(),
			...localSet(Locals.OUTPUT),

			...i32const(Memory.COUNTER + offset),
			...i32load(),
			...localSet(Locals.COUNTER),

			...i32const(Memory.RATE_SELF + offset),
			...i32load(),
			...localSet(Locals.RATE),

			// Set output
			...i32const(12000),
			...localGet(Locals.COUNTER),
			Instruction.I32_GE_S,
			...ifelse(Type.I32, [...i32const(I16_SIGNED_LARGEST_NUMBER)], [...i32const(0)]),
			...localSet(Locals.OUTPUT),

			// Increment counter
			...localGet(Locals.COUNTER),
			...i32const(I16_SIGNED_LARGEST_NUMBER),
			Instruction.I32_GE_S,
			...ifelse(
				Type.I32,
				[...i32const(0)],
				[...localGet(Locals.COUNTER), ...localGet(Locals.RATE), Instruction.I32_ADD]
			),
			...localSet(Locals.COUNTER),

			// Store variables
			...i32const(Memory.OUTPUT + offset),
			...localGet(Locals.OUTPUT),
			...i32store(),

			...i32const(Memory.COUNTER + offset),
			...localGet(Locals.COUNTER),
			...i32store(),
		]
	);

	const initialMemory = [0, initialConfig.rate, 0];

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory,
		memoryAddresses: [
			{ address: Memory.OUTPUT + offset, id: 'out' },
			{ address: Memory.RATE_SELF + offset, id: 'rate' },
		],
	};
};

export default clock;
