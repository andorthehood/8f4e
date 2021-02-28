import { i32load, localGet, localSet, i32const, ifelse, i32store } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

const enum Memory {
	ZERO = 0x00,
	OUTPUT = 0x04,
	CLOCK_POINTER = 0x08,
	PREVIOUS_CLOCK = 0x0c,
	COUNTER = 0x10,
	INPUT_POINTER_1 = 0x14,
	INPUT_POINTER_2 = 0x18,
	INPUT_POINTER_3 = 0x1c,
	INPUT_POINTER_4 = 0x20,
}

const enum Locals {
	COUNTER,
	CLOCK,
	__LENGTH,
}

const sequentialSwitch: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(Memory.COUNTER + offset),
			...i32load(),
			...localSet(Locals.COUNTER),

			...i32const(Memory.CLOCK_POINTER + offset),
			...i32load(),
			...i32load(),
			...localSet(Locals.CLOCK),

			...i32const(Memory.PREVIOUS_CLOCK + offset),
			...i32load(),
			...localGet(Locals.CLOCK),
			Instruction.I32_GT_S,
			...ifelse(Type.VOID, [
				...localGet(Locals.COUNTER),
				...i32const(4),
				Instruction.I32_ADD,
				...i32const(16),
				Instruction.I32_REM_S,
				...localSet(Locals.COUNTER),
			]),

			...i32const(Memory.PREVIOUS_CLOCK + offset),
			...localGet(Locals.CLOCK),
			...i32store(),

			...i32const(Memory.OUTPUT + offset),
			...i32const(Memory.INPUT_POINTER_1 + offset),
			...localGet(Locals.COUNTER),
			Instruction.I32_ADD,
			...i32load(),
			...i32load(),
			...i32store(),

			// Save counter
			...i32const(Memory.COUNTER + offset),
			...localGet(Locals.COUNTER),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [
			0,
			0,
			Memory.ZERO + offset,
			0,
			0,
			Memory.ZERO + offset,
			Memory.ZERO + offset,
			Memory.ZERO + offset,
			Memory.ZERO + offset,
		],
		memoryAddresses: [
			{ address: Memory.INPUT_POINTER_1 + offset, id: 'in1', isInputPointer: true },
			{ address: Memory.INPUT_POINTER_2 + offset, id: 'in2', isInputPointer: true },
			{ address: Memory.INPUT_POINTER_3 + offset, id: 'in3', isInputPointer: true },
			{ address: Memory.INPUT_POINTER_4 + offset, id: 'in4', isInputPointer: true },
			{ address: Memory.CLOCK_POINTER + offset, id: 'clock', isInputPointer: true },
			{ address: Memory.OUTPUT + offset, id: 'out' },
		],
	};
};

export default sequentialSwitch;
