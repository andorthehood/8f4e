import {
	Instruction,
	Type,
	i32load,
	i32const,
	i32store,
	localSet,
	localGet,
	ifelse,
	createFunctionBody,
	createLocalDeclaration,
} from 'bytecode-utils';
import { MemoryTypes, ModuleGenerator } from '../types';

export enum Memory {
	DEFAULT_VALUE,
	INPUT_POINTER,
	OUTPUT,
}

enum Locals {
	INPUT,
	__LENGTH,
}

const abs: ModuleGenerator<unknown, Memory> = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset.byte(Memory.OUTPUT)),
			...i32const(offset.byte(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.INPUT),

			...localGet(Locals.INPUT),
			...i32const(0),
			Instruction.I32_LT_S,
			...ifelse(
				Type.I32,
				[...i32const(0), ...localGet(Locals.INPUT), Instruction.I32_SUB],
				[...localGet(Locals.INPUT)]
			),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		byteAddress: offset.byte(0),
		wordAddress: offset.word(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.DEFAULT_VALUE, default: 0 },
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.INPUT_POINTER,
				id: 'in',
				default: offset.byte(Memory.DEFAULT_VALUE),
			},
			{ type: MemoryTypes.OUTPUT, address: Memory.OUTPUT, id: 'out', default: 0 },
		],
	};
};

export default abs;
