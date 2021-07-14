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
import { MemoryTypes, ModuleGenerator } from '../types';
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

const mixer: ModuleGenerator<unknown, Memory> = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset.byte(Memory.OUTPUT)),

			...[
				...i32const(offset.byte(Memory.INPUT_POINTER_1)),
				...i32load(),
				...i32load(),

				...i32const(offset.byte(Memory.INPUT_POINTER_2)),
				...i32load(),
				...i32load(),

				Instruction.I32_ADD,

				...i32const(offset.byte(Memory.INPUT_POINTER_3)),
				...i32load(),
				...i32load(),

				Instruction.I32_ADD,

				...i32const(offset.byte(Memory.INPUT_POINTER_4)),
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
		offset: offset.byte(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.DEFAULT_VALUE, default: 0 },
			{ type: MemoryTypes.OUTPUT, address: Memory.OUTPUT, id: 'out', default: 0 },
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.INPUT_POINTER_1,
				id: 'in:1',
				default: offset.byte(Memory.DEFAULT_VALUE),
			},
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.INPUT_POINTER_2,
				id: 'in:2',
				default: offset.byte(Memory.DEFAULT_VALUE),
			},
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.INPUT_POINTER_3,
				id: 'in:3',
				default: offset.byte(Memory.DEFAULT_VALUE),
			},
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.INPUT_POINTER_4,
				id: 'in:4',
				default: offset.byte(Memory.DEFAULT_VALUE),
			},
		],
	};
};

export default mixer;
