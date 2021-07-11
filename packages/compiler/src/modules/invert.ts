import { Instruction, i32load, i32const, i32store, createFunctionBody } from 'bytecode-utils';
import { MemoryTypes, ModuleGenerator } from '../types';

export enum Memory {
	DEFAULT_VALUE,
	INPUT_POINTER,
	OUTPUT,
}

const invert: ModuleGenerator<unknown, Memory> = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(offset(Memory.OUTPUT)),
			...i32const(offset(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...i32const(-1),
			Instruction.I32_MUL, // TODO: replace MUL with bitwise operation
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.DEFAULT_VALUE, default: 0 },

			{
				type: MemoryTypes.INPUT_POINTER,
				address: offset(Memory.INPUT_POINTER),
				id: 'in',
				default: offset(Memory.DEFAULT_VALUE),
			},

			{ type: MemoryTypes.OUTPUT, address: offset(Memory.OUTPUT), id: 'out', default: 0 },
		],
	};
};

export default invert;
