import { i32storeLocal, i32load, i32loadLocal, localGet, localSet, i32const } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from '../wasm/enums';
import { ModuleGenerator } from './types';

const enum Memory {
	ZERO = 0x00,
	INPUT_POINTER = 0x04,
	OUTPUT = 0x08,

	BEST_MACHING_VALUE = 12,
	SMALLEST_DIFFERENCE = 16,
}

const enum Locals {
	INPUT = 0,
}

const STEP = 32676 / 10 / 12;
const NOTES = new Array(12 * 10).map((note, index) => index);
const NOTE_RANGES = NOTES.map((note, index) => [STEP * index + 1, STEP * (index + 1)]);
const NOTE_VALUES = NOTE_RANGES.map(range => range[0] + (range[1] - range[0]) / 2);

const quantizer: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, 1)],
		[
			...i32load(Memory.INPUT_POINTER + offset),
			...i32loadLocal(Locals.INPUT),

			...localGet(Locals.INPUT),
			...i32const(100),

			Instruction.I32_SUB,
			...i32storeLocal(Locals.INPUT, Memory.OUTPUT + offset),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [0, Memory.ZERO + offset, 0, 0, 0, 0],
		memoryAddresses: [
			{ address: Memory.OUTPUT + offset, id: 'out' },
			{ address: Memory.INPUT_POINTER + offset, id: 'in', isInputPointer: true },
		],
	};
};

export default quantizer;
