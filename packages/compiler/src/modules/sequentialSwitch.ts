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

enum Memory {
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

enum Locals {
	CLOCK,
	COUNTER,
	__LENGTH,
}

const sequentialSwitch: ModuleGenerator<unknown, Memory> = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset.byte(Memory.COUNTER)),
			...i32load(),
			...localSet(Locals.COUNTER),

			...i32const(offset.byte(Memory.CLOCK_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.CLOCK),

			...i32const(offset.byte(Memory.PREVIOUS_CLOCK)),
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

			...i32const(offset.byte(Memory.PREVIOUS_CLOCK)),
			...localGet(Locals.CLOCK),
			...i32store(),

			...i32const(offset.byte(Memory.OUTPUT)),
			...i32const(offset.byte(Memory.INPUT_POINTER_1)),
			...localGet(Locals.COUNTER),
			Instruction.I32_ADD,
			...i32load(),
			...i32load(),
			...i32store(),

			// Save counter
			...i32const(offset.byte(Memory.COUNTER)),
			...localGet(Locals.COUNTER),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset.byte(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.ZERO, default: 0 },
			{ type: MemoryTypes.OUTPUT, address: Memory.OUTPUT, id: 'out', default: 0 },
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.CLOCK_POINTER,
				id: 'in:clock',
				default: offset.byte(Memory.ZERO),
			},
			{ type: MemoryTypes.PRIVATE, address: Memory.PREVIOUS_CLOCK, default: 0 },
			{ type: MemoryTypes.PRIVATE, address: Memory.COUNTER, default: 0 },
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.INPUT_POINTER_1,
				id: 'in:1',
				default: offset.byte(Memory.ZERO),
			},
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.INPUT_POINTER_2,
				id: 'in:2',
				default: offset.byte(Memory.ZERO),
			},
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.INPUT_POINTER_3,
				id: 'in:3',
				default: offset.byte(Memory.ZERO),
			},
			{
				type: MemoryTypes.INPUT_POINTER,
				address: Memory.INPUT_POINTER_4,
				id: 'in:4',
				default: offset.byte(Memory.ZERO),
			},
		],
	};
};

export default sequentialSwitch;
