import { i32storeLocal, i32load, localGet, localSet, i32const, i32store, ifelse, br } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from '../wasm/enums';
import { ModuleGenerator } from './types';

const enum Memory {
	ZERO = 0x00,
	INPUT_POINTER = 0x04,
	OUTPUT = 0x08,
	COUNTER = 0x0c,
	RATE = 0x10,
	BUFFER_POINTER = 0x14,
	BUFFER_START = 0x18,
}

const enum Locals {
	INPUT,
	BUFFER_POINTER,
	COUNTER,
	__LENGTH,
}

const BUFFER_LENGTH = Int32Array.BYTES_PER_ELEMENT * 80;

const scope: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			// Load input value from memory, store it in a register.
			...i32const(Memory.INPUT_POINTER + offset),
			...i32load(),
			...i32load(),
			...localSet(Locals.INPUT),

			// Save input to the memory.
			...i32const(Memory.OUTPUT + offset),
			...localGet(Locals.INPUT),
			...i32store(),

			// Load counter.
			...i32const(Memory.COUNTER + offset),
			...i32load(),
			...localSet(Locals.COUNTER),

			...localGet(Locals.COUNTER),
			...i32const(Memory.RATE + offset),
			...i32load(),
			Instruction.I32_GE_S,
			...ifelse(
				Type.VOID,
				[...i32const(Memory.COUNTER + offset), ...i32const(0), ...i32store()],
				[
					...localGet(Locals.COUNTER),
					...i32const(1),
					Instruction.I32_ADD,
					...localSet(Locals.COUNTER),

					...i32const(Memory.COUNTER + offset),
					...localGet(Locals.COUNTER),
					...i32store(),
					...br(1),
				]
			),

			// Load buffer pointer and store it in a register.
			...i32const(Memory.BUFFER_POINTER + offset),
			...i32load(),
			...localSet(Locals.BUFFER_POINTER),

			// Store the input value in the memory where the buffer pointer points.
			...localGet(Locals.BUFFER_POINTER),
			...localGet(Locals.INPUT),
			...i32store(),

			// Increment the value of the the buffer pointer.
			...localGet(Locals.BUFFER_POINTER),
			...i32const(Int32Array.BYTES_PER_ELEMENT),
			Instruction.I32_ADD,
			...localSet(Locals.BUFFER_POINTER),

			// Prevent the buffer pointer access out of bounds memory.
			...localGet(Locals.BUFFER_POINTER),
			...i32const(Memory.BUFFER_START + BUFFER_LENGTH + offset),
			Instruction.I32_GE_U,
			...ifelse(Type.VOID, [...i32const(Memory.BUFFER_START + offset), ...localSet(Locals.BUFFER_POINTER)]),

			// Store the buffer pointer in the memory.
			...i32const(Memory.BUFFER_POINTER + offset),
			...localGet(Locals.BUFFER_POINTER),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [
			0,
			Memory.ZERO + offset,
			0,
			0,
			0,
			Memory.BUFFER_START + offset,
			...new Array(BUFFER_LENGTH / Int32Array.BYTES_PER_ELEMENT).fill(0),
		],
		memoryAddresses: [
			{ address: Memory.OUTPUT + offset, id: 'out' },
			{ address: Memory.INPUT_POINTER + offset, id: 'in', isInputPointer: true },
			{ address: Memory.BUFFER_START + offset, id: 'buffer' },
		],
	};
};

export default scope;
