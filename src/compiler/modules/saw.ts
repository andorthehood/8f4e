import {
	i32const,
	i32loadAddress,
	i32loadLocal,
	i32load,
	i32storeLocal,
	ifelse,
	localGet,
	localSet,
} from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from '../wasm/enums';
import { ModuleGenerator } from './types';

const enum Memory {
	COUNTER = 0x00,
	RATE_ADDRESS = 0x04,
	RATE_SELF = 0x08,
	LIMIT_ADDRESS = 12,
	LIMIT_SELF = 16,
}

const enum Locals {
	COUNTER = 0,
	RATE = 1,
	LIMIT = 2,
}

type InitialMemory = [
	COUNTER: number,
	RATE_ADDRESS: number,
	RATE_SELF: number,
	LIMIT_ADDRESS: number,
	LIMIT_SELF: number
];

/**
 *
 * @param memoryStartAddress
 */
const saw: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, 3)],
		[
			// Load data from memory into local variables.
			...i32load(Memory.RATE_ADDRESS + offset),
			...i32loadLocal(Locals.RATE),
			...i32load(Memory.LIMIT_ADDRESS + offset),
			...i32loadLocal(Locals.LIMIT),
			...i32loadLocal(Locals.COUNTER, Memory.COUNTER + offset),

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
			...i32storeLocal(Locals.COUNTER, Memory.COUNTER + offset),
		]
	);

	const initialMemory: InitialMemory = [0, offset + Memory.RATE_SELF, 1, offset + Memory.LIMIT_SELF, 10];

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory,
		outputs: [{ address: Memory.COUNTER + offset, id: 'output' }],
		inputs: [{ address: Memory.RATE_ADDRESS + offset, id: 'rate' }],
	};
};

export default saw;
