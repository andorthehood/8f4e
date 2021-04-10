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
} from '../../../byteCodeUtils/src';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER, I16_SIGNED_SMALLEST_NUMBER } from '../consts';

export enum Memory {
	DEFAULT_VALUE,
	OUTPUT,
	INPUT_POINTER_1,
	INPUT_POINTER_2,
	INPUT_POINTER_3,
	INPUT_POINTER_4,
}

enum Locals {
	RESULT,
	__LENGTH,
}

const mixer: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset(Memory.OUTPUT)),

			...[
				...i32const(offset(Memory.INPUT_POINTER_1)),
				...i32load(),
				...i32load(),

				...i32const(offset(Memory.INPUT_POINTER_2)),
				...i32load(),
				...i32load(),

				Instruction.I32_ADD,

				...i32const(offset(Memory.INPUT_POINTER_3)),
				...i32load(),
				...i32load(),

				Instruction.I32_ADD,

				...i32const(offset(Memory.INPUT_POINTER_4)),
				...i32load(),
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
		initialMemory: [
			0,
			0,
			offset(Memory.DEFAULT_VALUE),
			offset(Memory.DEFAULT_VALUE),
			offset(Memory.DEFAULT_VALUE),
			offset(Memory.DEFAULT_VALUE),
		],
		memoryAddresses: [
			{ address: offset(Memory.INPUT_POINTER_1), id: 'in:1' },
			{ address: offset(Memory.INPUT_POINTER_2), id: 'in:2' },
			{ address: offset(Memory.INPUT_POINTER_3), id: 'in:3' },
			{ address: offset(Memory.INPUT_POINTER_4), id: 'in:4' },
			{ address: offset(Memory.OUTPUT), id: 'out' },
		],
	};
};

export default mixer;
