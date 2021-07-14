import {
	Instruction,
	Type,
	br,
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

enum Memory {
	ZERO,
	INPUT_POINTER,
	OUTPUT,
	COUNTER,
	RATE,
	BUFFER_POINTER,
	BUFFER_START,
}

enum Locals {
	BUFFER_POINTER,
	COUNTER,
	INPUT,
	__LENGTH,
}

const BUFFER_LENGTH = Int32Array.BYTES_PER_ELEMENT * 49;

const scope: ModuleGenerator<unknown, Memory> = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			// Load input value from memory, store it in a register.
			...i32const(offset.byte(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.INPUT),

			// Save input to the memory.
			...i32const(offset.byte(Memory.OUTPUT)),
			...localGet(Locals.INPUT),
			...i32store(),

			// Load counter.
			...i32const(offset.byte(Memory.COUNTER)),
			...i32load(),
			...localSet(Locals.COUNTER),

			...localGet(Locals.COUNTER),
			...i32const(offset.byte(Memory.RATE)),
			...i32load(),
			Instruction.I32_GE_S,
			...ifelse(
				Type.VOID,
				[...i32const(offset.byte(Memory.COUNTER)), ...i32const(0), ...i32store()],
				[
					...localGet(Locals.COUNTER),
					...i32const(1),
					Instruction.I32_ADD,
					...localSet(Locals.COUNTER),

					...i32const(offset.byte(Memory.COUNTER)),
					...localGet(Locals.COUNTER),
					...i32store(),
					...br(1),
				]
			),

			// Load buffer pointer and store it in a register.
			...i32const(offset.byte(Memory.BUFFER_POINTER)),
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
			...i32const(offset.byte(Memory.BUFFER_START) + BUFFER_LENGTH),
			Instruction.I32_GE_U,
			...ifelse(Type.VOID, [...i32const(offset.byte(Memory.BUFFER_START)), ...localSet(Locals.BUFFER_POINTER)]),

			// Store the buffer pointer in the memory.
			...i32const(offset.byte(Memory.BUFFER_POINTER)),
			...localGet(Locals.BUFFER_POINTER),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset.byte(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.ZERO, default: 0 },
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.INPUT_POINTER,
				id: 'in',
				default: offset.byte(Memory.ZERO),
			},
			{ type: MemoryTypes.OUTPUT, address: Memory.OUTPUT, id: 'out', default: 0 },
			{ type: MemoryTypes.PRIVATE, address: Memory.COUNTER, default: 0 },
			{ type: MemoryTypes.PRIVATE, address: Memory.RATE, default: 0 },
			{
				type: MemoryTypes.NUMBER,
				address: Memory.BUFFER_POINTER,
				id: 'bufferPointer',
				default: offset.byte(Memory.BUFFER_START),
			},
			{
				type: MemoryTypes.STATIC_ARRAY,
				address: Memory.BUFFER_START,
				id: 'buffer',
				size: BUFFER_LENGTH / Int32Array.BYTES_PER_ELEMENT,
				default: new Array(BUFFER_LENGTH / Int32Array.BYTES_PER_ELEMENT).fill(0),
			},
		],
	};
};

export default scope;
