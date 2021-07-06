import {
	createFunctionBody,
	createLocalDeclaration,
	i32const,
	i32load,
	i32store,
	ifelse,
	Instruction,
	localGet,
	localSet,
	Type,
} from 'bytecode-utils';
import { ModuleGenerator } from '../types';

export enum Memory {
	ZERO,
	TRIGGER_INPUT_POINTER,
	TRIGGER_PREVIOUS_VALUE,
	OUTPUT,
	PATTERN_POINTER,
	PATTERN_MEMORY_SIZE,
	PATTERN_START,
}

enum Locals {
	TRIGGER_INPUT,
	PATTERN_POINTER,
	__LENGTH,
}

const triggerSequencer: ModuleGenerator = function (moduleId, offset) {
	const patternLength = 1;
	const pattern = new Array(patternLength).fill(0);

	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset(Memory.OUTPUT)),
			...i32const(0),
			...i32store(),

			...i32const(offset(Memory.PATTERN_POINTER)),
			...i32load(),
			...localSet(Locals.PATTERN_POINTER),

			...i32const(offset(Memory.TRIGGER_INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.TRIGGER_INPUT),

			// Determining wether the signal is high
			...i32const(offset(Memory.TRIGGER_PREVIOUS_VALUE)),
			...i32load(),
			...localGet(Locals.TRIGGER_INPUT),
			Instruction.I32_GT_S,
			...ifelse(Type.VOID, [
				// Increment pattern pointer
				...localGet(Locals.PATTERN_POINTER),
				...i32const(4),
				Instruction.I32_ADD,
				...i32const(offset(Memory.PATTERN_MEMORY_SIZE)),
				...i32load(),
				Instruction.I32_REM_S,
				...localSet(Locals.PATTERN_POINTER),

				// Set output to high if pattern is set
				...i32const(offset(Memory.PATTERN_START)),
				...localGet(Locals.PATTERN_POINTER),
				Instruction.I32_ADD,
				...i32load(),
				...i32const(1),
				Instruction.I32_EQ,
				...ifelse(Type.VOID, [...i32const(offset(Memory.OUTPUT)), ...i32const(30000), ...i32store()]),

				// Save pattern pointer
				...i32const(offset(Memory.PATTERN_POINTER)),
				...localGet(Locals.PATTERN_POINTER),
				...i32store(),
			]),

			...i32const(offset(Memory.TRIGGER_PREVIOUS_VALUE)),
			...localGet(Locals.TRIGGER_INPUT),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, offset(Memory.ZERO), 0, 0, 0, patternLength, ...pattern],
		memoryAddresses: [
			{ address: offset(Memory.OUTPUT), id: 'out' },
			{
				address: offset(Memory.TRIGGER_INPUT_POINTER),
				id: 'in:trigger',
				default: offset(Memory.ZERO),
			},
		],
	};
};

export default triggerSequencer;
