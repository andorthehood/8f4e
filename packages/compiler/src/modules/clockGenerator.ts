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
import { MemoryTypes, ModuleGenerator, ModuleStateExtractor, ModuleStateInserter } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

enum Memory {
	COUNTER,
	RATE_SELF,
	OUTPUT,
}

enum Locals {
	COUNTER,
	OUTPUT,
	RATE,
	__LENGTH,
}

interface ClockGeneratorState {
	rate: number;
}

export const insertState: ModuleStateInserter<ClockGeneratorState> = function (state, memoryBuffer, moduleAddress) {
	memoryBuffer[moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.RATE_SELF] = state.rate;
};

export const extractState: ModuleStateExtractor<ClockGeneratorState> = function (memoryBuffer, moduleAddress) {
	return { rate: memoryBuffer[moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.RATE_SELF] };
};

const clock: ModuleGenerator<{ rate?: number }, Memory> = function (moduleId, offset, { rate = 1 } = {}) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			// Load variables from the memory
			...i32const(offset.byte(Memory.OUTPUT)),
			...i32load(),
			...localSet(Locals.OUTPUT),

			...i32const(offset.byte(Memory.COUNTER)),
			...i32load(),
			...localSet(Locals.COUNTER),

			...i32const(offset.byte(Memory.RATE_SELF)),
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
			...i32const(offset.byte(Memory.OUTPUT)),
			...localGet(Locals.OUTPUT),
			...i32store(),

			...i32const(offset.byte(Memory.COUNTER)),
			...localGet(Locals.COUNTER),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset.byte(0),
		memoryMap: [
			{ type: MemoryTypes.NUMBER, address: Memory.COUNTER, default: 0 },
			{ type: MemoryTypes.NUMBER, address: Memory.RATE_SELF, id: 'rate', default: rate, reclaimable: true },
			{ type: MemoryTypes.OUTPUT, address: Memory.OUTPUT, id: 'out', default: 0 },
		],
	};
};

export default clock;
