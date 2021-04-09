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
} from '../../../byteCodeUtils/src';
import { ModuleGenerator } from '../types';

const enum Memory {
	ZERO,
	INPUT_POINTER,
	OUTPUT,
	COUNTER,
	RATE,
	BUFFER_POINTER,
	BUFFER_START,
}

const enum Locals {
	BUFFER_POINTER,
	COUNTER,
	INPUT,
	__LENGTH,
}

const BUFFER_LENGTH = Int32Array.BYTES_PER_ELEMENT * 49;

const scope: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			// Load input value from memory, store it in a register.
			...i32const(offset(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.INPUT),

			// Save input to the memory.
			...i32const(offset(Memory.OUTPUT)),
			...localGet(Locals.INPUT),
			...i32store(),

			// Load counter.
			...i32const(offset(Memory.COUNTER)),
			...i32load(),
			...localSet(Locals.COUNTER),

			...localGet(Locals.COUNTER),
			...i32const(offset(Memory.RATE)),
			...i32load(),
			Instruction.I32_GE_S,
			...ifelse(
				Type.VOID,
				[...i32const(offset(Memory.COUNTER)), ...i32const(0), ...i32store()],
				[
					...localGet(Locals.COUNTER),
					...i32const(1),
					Instruction.I32_ADD,
					...localSet(Locals.COUNTER),

					...i32const(offset(Memory.COUNTER)),
					...localGet(Locals.COUNTER),
					...i32store(),
					...br(1),
				]
			),

			// Load buffer pointer and store it in a register.
			...i32const(offset(Memory.BUFFER_POINTER)),
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
			...i32const(offset(Memory.BUFFER_START) + BUFFER_LENGTH),
			Instruction.I32_GE_U,
			...ifelse(Type.VOID, [...i32const(offset(Memory.BUFFER_START)), ...localSet(Locals.BUFFER_POINTER)]),

			// Store the buffer pointer in the memory.
			...i32const(offset(Memory.BUFFER_POINTER)),
			...localGet(Locals.BUFFER_POINTER),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [
			0,
			offset(Memory.ZERO),
			0,
			0,
			0,
			offset(Memory.BUFFER_START),
			...new Array(BUFFER_LENGTH / Int32Array.BYTES_PER_ELEMENT).fill(0),
		],
		memoryAddresses: [
			{ address: offset(Memory.OUTPUT), id: 'out' },
			{ address: offset(Memory.INPUT_POINTER), id: 'in' },
			{ address: offset(Memory.BUFFER_START), id: 'buffer' },
			{ address: offset(Memory.BUFFER_POINTER), id: 'bufferPointer' },
		],
	};
};

export default scope;
