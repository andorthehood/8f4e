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
import { MemoryTypes, ModuleGenerator } from '../types';

export enum Memory {
	DEFAULT_VALUE,
	INPUT_POINTER,
	TRIGGER_INPUT_POINTER,
	TRIGGER_PREVIOUS_VALUE,
	OUTPUT,
}

enum Locals {
	TRIGGER_INPUT,
	__LENGTH,
}

const sampleAndHold: ModuleGenerator<unknown, Memory> = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset.byte(Memory.TRIGGER_INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.TRIGGER_INPUT),

			// Determining wether the signal is high
			...localGet(Locals.TRIGGER_INPUT),
			...i32const(offset.byte(Memory.TRIGGER_PREVIOUS_VALUE)),
			...i32load(),
			Instruction.I32_SUB,
			...i32const(1000),
			Instruction.I32_GE_S,
			...ifelse(Type.VOID, [
				...i32const(offset.byte(Memory.OUTPUT)),
				...i32const(offset.byte(Memory.INPUT_POINTER)),
				...i32load(),
				...i32load(),
				...i32store(),
			]),

			...i32const(offset.byte(Memory.TRIGGER_PREVIOUS_VALUE)),
			...localGet(Locals.TRIGGER_INPUT),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset.byte(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.DEFAULT_VALUE, default: 0 },
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.INPUT_POINTER,
				default: offset.byte(Memory.DEFAULT_VALUE),
				id: 'in',
			},
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.TRIGGER_INPUT_POINTER,
				default: offset.byte(Memory.DEFAULT_VALUE),
				id: 'in:trigger',
			},
			{ type: MemoryTypes.PRIVATE, address: Memory.TRIGGER_PREVIOUS_VALUE, default: 0 },
			{ type: MemoryTypes.OUTPUT, address: Memory.OUTPUT, default: 0, id: 'out' },
		],
	};
};

export default sampleAndHold;
