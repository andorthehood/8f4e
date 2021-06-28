import {
	Instruction,
	Type,
	createFunctionBody,
	createLocalDeclaration,
	i32const,
	i32load,
	i32store,
	ifelse,
	localGet,
	localSet,
} from 'bytecode-utils';
import { ModuleGenerator } from '../types';

export enum Memory {
	STEP_BACK_TRIGGER_INPUT_POINTER,
	STEP_BACK_TRIGGER_PREV_VALUE,
	STEP_FORWARD_TRIGGER_INPUT_POINTER,
	STEP_FORWARD_TRIGGER_PREV_VALUE,
	NOTE_MEMORY_POINTER,
	OUTPUT,
	NUMBER_OF_NOTES,
	FIRST_NOTE,
}

enum Local {
	STEP_BACK_TRIGGER,
	STEP_FORWARD_TRIGGER,
	NOTE_MEMORY_POINTER,
	__LENGTH,
}

const cvSequencer: ModuleGenerator = function (moduleId, offset, { allocatedNotes = 12 }) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Local.__LENGTH)],
		[
			// Looad note pointer into a local variable.
			...i32const(Memory.NOTE_MEMORY_POINTER),
			...i32load(),
			...localSet(Local.NOTE_MEMORY_POINTER),

			// Locad step forward trigger into a local variable.
			...i32const(Memory.STEP_FORWARD_TRIGGER_INPUT_POINTER),
			...i32load(),
			...i32load(),
			...localSet(Local.STEP_FORWARD_TRIGGER),

			// Compare step forward trigger with it's previous value.
			...localGet(Local.STEP_FORWARD_TRIGGER),
			...i32const(Memory.STEP_FORWARD_TRIGGER_PREV_VALUE),
			...i32load(),
			Instruction.I32_SUB,
			...i32const(1000),
			Instruction.I32_GE_S,
			...ifelse(Type.VOID, [
				// Increment note memory pointer if the step forward trigger is high.
				...localGet(Local.NOTE_MEMORY_POINTER),
				...i32const(Int32Array.BYTES_PER_ELEMENT),
				Instruction.I32_ADD,

				...localSet(Local.NOTE_MEMORY_POINTER),
			]),

			...i32const(Memory.STEP_FORWARD_TRIGGER_PREV_VALUE),
			...localGet(Local.STEP_FORWARD_TRIGGER),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, 0, 0, ...new Array(allocatedNotes).fill(0)],
		memoryAddresses: [
			{ address: offset(Memory.STEP_BACK_TRIGGER_INPUT_POINTER), id: 'in:stepBack' },
			{ address: offset(Memory.STEP_FORWARD_TRIGGER_INPUT_POINTER), id: 'in:stepForward' },
			{ address: offset(Memory.OUTPUT), id: 'out' },
			{ address: offset(Memory.NUMBER_OF_NOTES), id: 'numberOfNotes' },
			{ address: offset(Memory.FIRST_NOTE), id: 'notes' },
		],
	};
};

export default cvSequencer;
