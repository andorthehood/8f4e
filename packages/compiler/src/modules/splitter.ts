import {
	Type,
	createFunctionBody,
	createLocalDeclaration,
	i32const,
	i32load,
	i32store,
	localGet,
	localSet,
} from 'bytecode-utils';
import { MemoryTypes, ModuleGenerator } from '../types';

enum Memory {
	ZERO,
	INPUT_POINTER,
	OUTPUT_1,
	OUTPUT_2,
	OUTPUT_3,
	OUTPUT_4,
}

enum Locals {
	INPUT,
	__LENGTH,
}

/**
 *
 * @param memoryStartAddress
 */
const splitter: ModuleGenerator<unknown, Memory> = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset.byte(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.INPUT),

			...i32const(offset.byte(Memory.OUTPUT_1)),
			...localGet(Locals.INPUT),
			...i32store(),

			...i32const(offset.byte(Memory.OUTPUT_2)),
			...localGet(Locals.INPUT),
			...i32store(),

			...i32const(offset.byte(Memory.OUTPUT_3)),
			...localGet(Locals.INPUT),
			...i32store(),

			...i32const(offset.byte(Memory.OUTPUT_4)),
			...localGet(Locals.INPUT),
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
			{ type: MemoryTypes.OUTPUT, address: Memory.OUTPUT_1, id: 'out:1', default: 0 },
			{ type: MemoryTypes.OUTPUT, address: Memory.OUTPUT_2, id: 'out:2', default: 0 },
			{ type: MemoryTypes.OUTPUT, address: Memory.OUTPUT_3, id: 'out:3', default: 0 },
			{ type: MemoryTypes.OUTPUT, address: Memory.OUTPUT_4, id: 'out:4', default: 0 },
			{ type: MemoryTypes.INPUT_POINTER, address: Memory.INPUT_POINTER, id: 'in', default: offset.byte(Memory.ZERO) },
		],
	};
};

export default splitter;
