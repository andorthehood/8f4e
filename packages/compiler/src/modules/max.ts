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

export enum Memory {
	ZERO,
	INPUT_1_POINTER,
	INPUT_2_POINTER,
	OUTPUT,
}

enum Locals {
	INPUT_1,
	INPUT_2,
	__LENGTH,
}

const max: ModuleGenerator<unknown, Memory> = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset(Memory.OUTPUT)),
			...[
				...i32const(offset(Memory.INPUT_1_POINTER)),
				...i32load(),
				...i32load(),
				...localSet(Locals.INPUT_1),

				...i32const(offset(Memory.INPUT_2_POINTER)),
				...i32load(),
				...i32load(),
				...localSet(Locals.INPUT_2),

				...localGet(Locals.INPUT_1),
				...localGet(Locals.INPUT_2),
				Instruction.I32_GT_S,
				...ifelse(Type.I32, [...localGet(Locals.INPUT_1)], [...localGet(Locals.INPUT_2)]),
			],

			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.ZERO, default: 0 },

			{
				type: MemoryTypes.INPUT_POINTER,
				address: offset(Memory.INPUT_1_POINTER),
				id: 'in:1',
				default: offset(Memory.ZERO),
			},
			{
				type: MemoryTypes.INPUT_POINTER,
				address: offset(Memory.INPUT_2_POINTER),
				id: 'in:2',
				default: offset(Memory.ZERO),
			},

			{ type: MemoryTypes.OUTPUT, address: offset(Memory.OUTPUT), id: 'out', default: 0 },
		],
	};
};

export default max;
