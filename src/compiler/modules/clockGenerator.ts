import { i32const, i32storeLocal, ifelse, localGet, localSet, i32loadLocal } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from '../wasm/enums';
import { ModuleGenerator } from './types';

const enum Memory {
	COUNTER = 0x00,
	OUTPUT = 0x04,
}

const enum Locals {
	COUNTER = 0,
	OUTPUT = 1,
}

type InitialMemory = [COUNTER: number, OUTPUT: number];

/**
 *
 * @param memoryStartAddress
 */
const clock: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, 2)],
		[
			// Load variables from the memory
			...i32loadLocal(Locals.OUTPUT, Memory.OUTPUT + offset),
			...i32loadLocal(Locals.COUNTER, Memory.COUNTER + offset),

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
			...ifelse(Type.I32, [...i32const(0)], [...localGet(Locals.COUNTER), ...i32const(1000), Instruction.I32_ADD]),
			...localSet(Locals.COUNTER),

			// Store variables
			...i32storeLocal(Locals.OUTPUT, Memory.OUTPUT + offset),
			...i32storeLocal(Locals.COUNTER, Memory.COUNTER + offset),
		]
	);

	const initialMemory: InitialMemory = [0, 0];

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory,
		memoryAddresses: [{ address: Memory.OUTPUT + offset, id: 'out' }],
	};
};

export default clock;
