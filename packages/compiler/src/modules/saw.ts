import {
	Instruction,
	Type,
	createFunctionBody,
	createLocalDeclaration,
	i32const,
	i32load,
	i32store,
	ifelse,
	localGet,
	localSet,
} from 'bytecode-utils';
import { ModuleGenerator, ModuleStateInserter, ModuleStateExtractor, MemoryTypes } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

enum Memory {
	COUNTER,
	RATE_POINTER,
	RATE_SELF,
	LIMIT_POINTER,
	LIMIT_SELF,
}

enum Locals {
	COUNTER,
	LIMIT,
	RATE,
	__LENGTH,
}

interface SawState {
	rate: number;
}

export const insertState: ModuleStateInserter<SawState> = function (state, memoryBuffer, moduleAddress) {
	memoryBuffer[moduleAddress + Memory.RATE_SELF] = state.rate;
};

export const extractState: ModuleStateExtractor<SawState> = function (memoryBuffer, moduleAddress) {
	return { rate: memoryBuffer[moduleAddress + Memory.RATE_SELF] };
};

const saw: ModuleGenerator<{ rate?: number }> = function (moduleId, offset, { rate = 1 } = {}) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			// Load data from memory into local variables.
			...i32const(offset.byte(Memory.RATE_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.RATE),

			...i32const(offset.byte(Memory.LIMIT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.LIMIT),

			...i32const(offset.byte(Memory.COUNTER)),
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
			...i32const(offset.byte(Memory.COUNTER)),
			...localGet(Locals.COUNTER),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		byteAddress: offset.byte(0),
		wordAddress: offset.word(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.COUNTER, default: 0, id: 'out' },
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.RATE_POINTER,
				default: offset.byte(Memory.RATE_SELF),
				id: 'in:rate',
			},
			{ type: MemoryTypes.PRIVATE, address: Memory.RATE_SELF, default: rate, id: 'rate' },
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.LIMIT_POINTER,
				default: offset.byte(Memory.LIMIT_SELF),
				id: 'in:limit',
			},
			{ type: MemoryTypes.PRIVATE, address: Memory.LIMIT_SELF, default: I16_SIGNED_LARGEST_NUMBER },
		],
	};
};

export default saw;
