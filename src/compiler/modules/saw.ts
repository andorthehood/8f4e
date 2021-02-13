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
	RATE_POINTER = 0x04,
	RATE_SELF = 0x08,
	LIMIT_POINTER = 12,
	LIMIT_SELF = 16,
}

const enum Locals {
	COUNTER,
	RATE,
	LIMIT,
	__LENGTH,
}

type InitialMemory = [
	COUNTER: number,
	RATE_POINTER: number,
	RATE_SELF: number,
	RATE_POINTER: number,
	LIMIT_SELF: number
];

/**
 *
 * @param memoryStartAddress
 */
const saw: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			// Load data from memory into local variables.
			...i32load(Memory.RATE_POINTER + offset),
			...i32loadLocal(Locals.RATE),
			...i32load(Memory.LIMIT_POINTER + offset),
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

	const initialMemory: InitialMemory = [0, offset + Memory.RATE_SELF, 1000, offset + Memory.LIMIT_SELF, 32767];

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory,
		memoryAddresses: [
			{ address: Memory.COUNTER + offset, id: 'out' },
			{ address: Memory.RATE_POINTER + offset, id: 'rate', isInputPointer: true },
		],
	};
};

export default saw;
