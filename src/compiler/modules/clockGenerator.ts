import { i32const, i32storeLocal, ifelse, localGet, localSet, i32loadLocal } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

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
			...i32loadLocal(Locals.OUTPUT, Memory.OUTPUT + offset),
			...i32loadLocal(Locals.COUNTER, Memory.COUNTER + offset),
			...i32loadLocal(Locals.RATE, Memory.RATE_SELF + offset),

			// Set output
			...i32const(12000),
			...localGet(Locals.COUNTER),
			Instruction.I32_GE_S,
			...ifelse(Type.I32, [...i32const(32000)], [...i32const(0)]),
			...localSet(Locals.OUTPUT),

			// Increment counter
			...localGet(Locals.COUNTER),
			...i32const(32000),
			Instruction.I32_GE_S,
			...ifelse(
				Type.I32,
				[...i32const(0)],
				[...localGet(Locals.COUNTER), ...localGet(Locals.RATE), Instruction.I32_ADD]
			),
			...localSet(Locals.COUNTER),

			// Store variables
			...i32storeLocal(Locals.OUTPUT, Memory.OUTPUT + offset),
			...i32storeLocal(Locals.COUNTER, Memory.COUNTER + offset),
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
