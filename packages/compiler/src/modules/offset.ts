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
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '../consts';

export enum Memory {
	ZERO,
	INPUT_POINTER,
	OFFSET,
	OUTPUT,
}

enum Locals {
	RESULT,
	__LENGTH,
}

interface OffsetState {
	offset: number;
}

export const insertState: ModuleStateInserter<OffsetState> = function (state, memoryBuffer, moduleAddress) {
	memoryBuffer[moduleAddress + Memory.OFFSET] = state.offset;
};

export const extractState: ModuleStateExtractor<OffsetState> = function (memoryBuffer, moduleAddress) {
	return { offset: memoryBuffer[moduleAddress + Memory.OFFSET] };
};

const offset: ModuleGenerator<{ offset?: number }> = function (moduleId, offset, { offset: valueOffset = 0 } = {}) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset.byte(Memory.OUTPUT)),
			...[
				...i32const(offset.byte(Memory.INPUT_POINTER)),
				...i32load(),
				...i32load(),

				...i32const(offset.byte(Memory.OFFSET)),
				...i32load(),

				Instruction.I32_ADD,
				...localSet(Locals.RESULT),

				// Limit
				...localGet(Locals.RESULT),
				...i32const(I16_SIGNED_LARGEST_NUMBER),
				Instruction.I32_GE_S,
				...ifelse(Type.I32, [...i32const(I16_SIGNED_LARGEST_NUMBER)], [...localGet(Locals.RESULT)]),
				...localSet(Locals.RESULT),

				...localGet(Locals.RESULT),
				...i32const(I16_SIGNED_SMALLEST_NUMBER),
				Instruction.I32_LE_S,
				...ifelse(Type.I32, [...i32const(I16_SIGNED_SMALLEST_NUMBER)], [...localGet(Locals.RESULT)]),
			],
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		byteAddress: offset.byte(0),
		wordAddress: offset.word(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.ZERO, default: 0 },
			{ type: MemoryTypes.INPUT_POINTER, address: Memory.INPUT_POINTER, default: offset.byte(Memory.ZERO), id: 'in' },
			{ type: MemoryTypes.NUMBER, address: Memory.OFFSET, default: valueOffset, id: 'offset' },
			{ type: MemoryTypes.OUTPUT, address: Memory.OUTPUT, default: 0, id: 'out' },
		],
	};
};

export default offset;
