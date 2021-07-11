import { Instruction, Type, i32load, i32const, i32store, ifelse, createFunctionBody } from 'bytecode-utils';
import { MemoryTypes, ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

export enum Memory {
	DEFAULT_VALUE,
	INPUT_POINTER,
	OUTPUT,
}

const negate: ModuleGenerator<unknown, Memory> = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(offset(Memory.OUTPUT)),
			...i32const(offset(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...i32const(0),
			Instruction.I32_GT_S,
			...ifelse(Type.I32, [...i32const(0)], [...i32const(I16_SIGNED_LARGEST_NUMBER)]),
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

export default negate;
