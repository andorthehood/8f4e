import {
	Instruction,
	Type,
	createFunctionBody,
	i32const,
	i32load,
	i32store,
	ifelse,
	localSet,
	createLocalDeclaration,
	localGet,
} from '@8f4e/bytecode-utils';
import { MemoryTypes, ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

export enum Memory {
	ZERO,
	TRIGGER_INPUT_POINTER,
	GATE_LENGTH_INPUT_POINTER,
	GATE_LENGTH,
	TRIGGER_PREVIOUS_VALUE,
	COUNTER,
	OUTPUT,
}

enum Locals {
	TRIGGER_INPUT,
	COUNTER,
	__LENGTH,
}

const triggerToGate: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset.byte(Memory.TRIGGER_INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.TRIGGER_INPUT),

			...i32const(offset.byte(Memory.COUNTER)),
			...i32load(),
			...localSet(Locals.COUNTER),

			...localGet(Locals.TRIGGER_INPUT),
			...i32const(offset.byte(Memory.TRIGGER_PREVIOUS_VALUE)),
			...i32load(),
			Instruction.I32_GT_S,
			...ifelse(Type.VOID, [
				...i32const(offset.byte(Memory.OUTPUT)),
				...i32const(I16_SIGNED_LARGEST_NUMBER),
				...i32store(),
			]),

			...i32const(offset.byte(Memory.OUTPUT)),
			...i32load(),
			...i32const(0),
			Instruction.I32_GT_S,
			...ifelse(Type.VOID, [
				...localGet(Locals.COUNTER),
				...i32const(1),
				Instruction.I32_ADD,
				...localSet(Locals.COUNTER),
			]),

			...localGet(Locals.COUNTER),
			...i32const(offset.byte(Memory.GATE_LENGTH_INPUT_POINTER)),
			...i32load(),
			...i32load(),
			Instruction.I32_GT_S,
			...ifelse(Type.VOID, [
				...i32const(0),
				...localSet(Locals.COUNTER),
				...i32const(offset.byte(Memory.OUTPUT)),
				...i32const(0),
				...i32store(),
			]),

			// Store previous trigger value
			...i32const(offset.byte(Memory.TRIGGER_PREVIOUS_VALUE)),
			...localGet(Locals.TRIGGER_INPUT),
			...i32store(),

			...i32const(offset.byte(Memory.COUNTER)),
			...localGet(Locals.COUNTER),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		byteAddress: offset.byte(0),
		wordAddress: offset.word(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.ZERO, default: 0 },
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.TRIGGER_INPUT_POINTER,
				id: 'in:trigger',
				default: offset.byte(Memory.ZERO),
			},
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.GATE_LENGTH_INPUT_POINTER,
				id: 'in:gateLength',
				default: offset.byte(Memory.GATE_LENGTH),
			},
			{ type: MemoryTypes.NUMBER, address: Memory.GATE_LENGTH, id: 'gateLength', default: 2 },
			{
				type: MemoryTypes.PRIVATE,
				address: Memory.TRIGGER_PREVIOUS_VALUE,
				default: 0,
			},
			{ type: MemoryTypes.PRIVATE, address: Memory.COUNTER, default: 0 },
			{
				type: MemoryTypes.OUTPUT,
				address: Memory.OUTPUT,
				id: 'out',
				default: 0,
			},
		],
	};
};

export default triggerToGate;
