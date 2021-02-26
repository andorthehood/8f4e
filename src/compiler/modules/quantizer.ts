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
	block,
} from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from './types';

const enum Helper {
	ABS = 0,
}

const enum Memory {
	INPUT_POINTER = 0x00,
	OUTPUT = 0x04,
	NOTES_START_ADDRESS = 0x08,
}

const enum Locals {
	INPUT,
	BEST_MACTHING_VALUE,
	SMALLEST_DIFFERENCE,
	DIFFERENCE,
	NOTE_MEMORY_POINTER,
	NOTE_VALUE,
	__LENGTH,
}

const NUMBER_OF_NOTES = 12;

const quantizer: ModuleGenerator = function (moduleId, offset, initialConfig) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			// Load the input value from the memory and put it into a register.
			...i32load(Memory.INPUT_POINTER + offset),
			...i32loadLocal(Locals.INPUT),

			// Set the smallest difference to the largest 16bit signed number.
			...i32const(0x7fff),
			...localSet(Locals.SMALLEST_DIFFERENCE),

			// Set the note memory pointer to 0
			...i32const(0),
			...localSet(Locals.NOTE_MEMORY_POINTER),

			...block(
				Type.VOID,
				loop(Type.VOID, [
					// Break if the memory pointer would overflow.
					...localGet(Locals.NOTE_MEMORY_POINTER),
					...i32const(NUMBER_OF_NOTES * Int32Array.BYTES_PER_ELEMENT),
					Instruction.I32_GE_U,
					...br_if(1),

					// Load a note value from the memory.
					...localGet(Locals.NOTE_MEMORY_POINTER),
					...i32const(Memory.NOTES_START_ADDRESS + offset),
					Instruction.I32_ADD,
					...i32load(),
					...localSet(Locals.NOTE_VALUE),

					// Calculate difference between input and the note.
					...localGet(Locals.NOTE_VALUE),
					...localGet(Locals.INPUT),
					Instruction.I32_SUB,
					...call(Helper.ABS),
					...localSet(Locals.DIFFERENCE),

					// Compare with the smallest difference.
					...localGet(Locals.DIFFERENCE),
					...localGet(Locals.SMALLEST_DIFFERENCE),
					Instruction.I32_LE_S,
					...ifelse(Type.VOID, [
						// If it's actually smaller than the previusly recorded
						// smallest difference, then overwirte it and save the
						// current note value.
						...localGet(Locals.DIFFERENCE),
						...localSet(Locals.SMALLEST_DIFFERENCE),
						...localGet(Locals.NOTE_VALUE),
						...localSet(Locals.BEST_MACTHING_VALUE),
					]),

					// Increment the note memory pointer by 4 (i32 is 4 bytes)
					...localGet(Locals.NOTE_MEMORY_POINTER),
					...i32const(Int32Array.BYTES_PER_ELEMENT),
					Instruction.I32_ADD,
					...localSet(Locals.NOTE_MEMORY_POINTER),
				])
			),

			// Save the best matching value to the memory.
			...i32storeLocal(Locals.BEST_MACTHING_VALUE, Memory.OUTPUT + offset),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [
			0,
			0,
			initialConfig.note1 || 0,
			initialConfig.note2 || 0,
			initialConfig.note3 || 0,
			initialConfig.note4 || 0,
			initialConfig.note5 || 0,
			initialConfig.note6 || 0,
			initialConfig.note7 || 0,
			initialConfig.note8 || 0,
			initialConfig.note9 || 0,
			initialConfig.note10 || 0,
			initialConfig.note11 || 0,
			initialConfig.note12 || 0,
		],
		memoryAddresses: [
			{ address: Memory.OUTPUT + offset, id: 'out' },
			{ address: Memory.INPUT_POINTER + offset, id: 'in', isInputPointer: true },
			{ address: Memory.NOTES_START_ADDRESS + offset + 0, id: 'note1' },
			{ address: Memory.NOTES_START_ADDRESS + offset + 4, id: 'note2' },
			{ address: Memory.NOTES_START_ADDRESS + offset + 8, id: 'note3' },
			{ address: Memory.NOTES_START_ADDRESS + offset + 12, id: 'note4' },
			{ address: Memory.NOTES_START_ADDRESS + offset + 16, id: 'note5' },
			{ address: Memory.NOTES_START_ADDRESS + offset + 20, id: 'note6' },
			{ address: Memory.NOTES_START_ADDRESS + offset + 24, id: 'note7' },
			{ address: Memory.NOTES_START_ADDRESS + offset + 28, id: 'note8' },
			{ address: Memory.NOTES_START_ADDRESS + offset + 32, id: 'note9' },
			{ address: Memory.NOTES_START_ADDRESS + offset + 36, id: 'note10' },
			{ address: Memory.NOTES_START_ADDRESS + offset + 40, id: 'note11' },
			{ address: Memory.NOTES_START_ADDRESS + offset + 44, id: 'note12' },
		],
	};
};

export default quantizer;
