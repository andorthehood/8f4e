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
import { ModuleGenerator, ModuleStateExtractor, ModuleStateInserter } from '../types';
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
	memoryBuffer[moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.OFFSET] = state.offset;
};

export const extractState: ModuleStateExtractor<OffsetState> = function (memoryBuffer, moduleAddress) {
	return { offset: memoryBuffer[moduleAddress / memoryBuffer.BYTES_PER_ELEMENT + Memory.OFFSET] };
};

const offset: ModuleGenerator<{ offset?: number }> = function (moduleId, offset, { offset: valueOffset = 0 } = {}) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset(Memory.OUTPUT)),
			...[
				...i32const(offset(Memory.INPUT_POINTER)),
				...i32load(),
				...i32load(),

				...i32const(offset(Memory.OFFSET)),
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
		offset: offset(0),
		initialMemory: [0, offset(Memory.ZERO), valueOffset, 0],
		memoryAddresses: [
			{ address: offset(Memory.OUTPUT), id: 'out' },
			{ address: offset(Memory.OFFSET), id: 'offset', default: valueOffset },
			{ address: offset(Memory.INPUT_POINTER), id: 'in', default: offset(Memory.ZERO) },
		],
	};
};

export default offset;
