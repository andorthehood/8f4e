import { i32load, localGet, localSet, i32const, ifelse, i32store } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

const enum Memory {
	ZERO,
	OUTPUT,
	CLOCK_POINTER,
	PREVIOUS_CLOCK,
	COUNTER,
	INPUT_POINTER_1,
	INPUT_POINTER_2,
	INPUT_POINTER_3,
	INPUT_POINTER_4,
}

const enum Locals {
	CLOCK,
	COUNTER,
	__LENGTH,
}

const sequentialSwitch: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset(Memory.COUNTER)),
			...i32load(),
			...localSet(Locals.COUNTER),

			...i32const(offset(Memory.CLOCK_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.CLOCK),

			...i32const(offset(Memory.PREVIOUS_CLOCK)),
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

			...i32const(offset(Memory.PREVIOUS_CLOCK)),
			...localGet(Locals.CLOCK),
			...i32store(),

			...i32const(offset(Memory.OUTPUT)),
			...i32const(offset(Memory.INPUT_POINTER_1)),
			...localGet(Locals.COUNTER),
			Instruction.I32_ADD,
			...i32load(),
			...i32load(),
			...i32store(),

			// Save counter
			...i32const(offset(Memory.COUNTER)),
			...localGet(Locals.COUNTER),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [
			0,
			0,
			offset(Memory.ZERO),
			0,
			0,
			offset(Memory.ZERO),
			offset(Memory.ZERO),
			offset(Memory.ZERO),
			offset(Memory.ZERO),
		],
		memoryAddresses: [
			{ address: offset(Memory.INPUT_POINTER_1), id: 'in1', isInputPointer: true },
			{ address: offset(Memory.INPUT_POINTER_2), id: 'in2', isInputPointer: true },
			{ address: offset(Memory.INPUT_POINTER_3), id: 'in3', isInputPointer: true },
			{ address: offset(Memory.INPUT_POINTER_4), id: 'in4', isInputPointer: true },
			{ address: offset(Memory.CLOCK_POINTER), id: 'clock', isInputPointer: true },
			{ address: offset(Memory.OUTPUT), id: 'out' },
		],
	};
};

export default sequentialSwitch;
