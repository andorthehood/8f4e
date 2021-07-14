import { Instruction, i32load, i32const, i32store, createFunctionBody } from 'bytecode-utils';
import { MemoryTypes, ModuleGenerator } from '../types';

export enum Memory {
	ZERO,
	INPUT_1_POINTER,
	INPUT_2_POINTER,
	OUTPUT,
}

const bitwiseOr: ModuleGenerator<unknown, Memory> = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(offset.byte(Memory.OUTPUT)),
			...i32const(offset.byte(Memory.INPUT_1_POINTER)),
			...i32load(),
			...i32load(),
			...i32const(offset.byte(Memory.INPUT_2_POINTER)),
			...i32load(),
			...i32load(),
			Instruction.I32_OR,
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
				address: offset.byte(Memory.INPUT_1_POINTER),
				id: 'in:1',
				default: offset.byte(Memory.ZERO),
			},
			{
				type: MemoryTypes.INPUT_POINTER,
				address: offset.byte(Memory.INPUT_2_POINTER),
				id: 'in:2',
				default: offset.byte(Memory.ZERO),
			},

			{ type: MemoryTypes.OUTPUT, address: offset.byte(Memory.OUTPUT), id: 'out', default: 0 },
		],
	};
};

export default bitwiseOr;
