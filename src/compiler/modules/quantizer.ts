import {
	i32storeLocal,
	i32load,
	i32loadLocal,
	localGet,
	localSet,
	i32const,
	call,
	ifelse,
	loop,
	br_if,
} from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from '../wasm/enums';
import { ModuleGenerator } from './types';

const enum Helper {
	ABS = 0,
}

const enum Memory {
	ZERO = 0x00,
	INPUT_POINTER = 0x04,
	OUTPUT = 0x08,
	NOTES_START_ADDRESS = 12,
}

const enum Locals {
	INPUT = 0,
	BEST_MACHING_VALUE = 1,
	SMALLEST_DIFFERENCE = 2,
	DIFFERENCE = 3,
	COUNTER = 4,
	NOTE_VALUE = 5,
}

const quantizer: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, 6)],
		[
			...i32load(Memory.INPUT_POINTER + offset),
			...i32loadLocal(Locals.INPUT),

			...i32const(0x7fff),
			...localSet(Locals.SMALLEST_DIFFERENCE),

			...i32const(0),
			...localSet(Locals.COUNTER),

			...loop(Type.VOID, [
				...localGet(Locals.COUNTER),
				...i32const(10 * 4),
				Instruction.I32_GE_U,
				...br_if(1),

				// Load note value from the memory
				...localGet(Locals.COUNTER),
				...i32const(Memory.NOTES_START_ADDRESS + offset),
				Instruction.I32_ADD,
				...i32load(),
				...localSet(Locals.NOTE_VALUE),

				// Calculate difference between input and note
				...localGet(Locals.NOTE_VALUE),
				...localGet(Locals.INPUT),
				Instruction.I32_SUB,
				...call(Helper.ABS),
				...localSet(Locals.DIFFERENCE),

				// Compare with the smallest difference
				...localGet(Locals.DIFFERENCE),
				...localGet(Locals.SMALLEST_DIFFERENCE),
				Instruction.I32_LE_S,
				...ifelse(Type.VOID, [
					...localGet(Locals.DIFFERENCE),
					...localSet(Locals.SMALLEST_DIFFERENCE),
					...localGet(Locals.NOTE_VALUE),
					...localSet(Locals.BEST_MACHING_VALUE),
				]),

				// Increment counter
				...localGet(Locals.COUNTER),
				...i32const(4),
				Instruction.I32_ADD,
				...localSet(Locals.COUNTER),

				...i32storeLocal(Locals.BEST_MACHING_VALUE, Memory.OUTPUT + offset),
			]),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [249, Memory.ZERO + offset, 0, 0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100],
		memoryAddresses: [
			{ address: Memory.OUTPUT + offset, id: 'out' },
			{ address: Memory.INPUT_POINTER + offset, id: 'in', isInputPointer: true },
		],
	};
};

export default quantizer;
