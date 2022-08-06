import { Instruction, i32load, i32const, i32store, createFunctionBody } from '@8f4e/bytecode-utils';
import { MemoryTypes, ModuleGenerator } from '../types';

export enum Memory {
	DEFAULT_VALUE,
	INPUT_POINTER,
	OUTPUT,
}

const invert: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(offset.byte(Memory.OUTPUT)),
			...i32const(offset.byte(Memory.INPUT_POINTER)),
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
		byteAddress: offset.byte(0),
		wordAddress: offset.word(0),
		memoryMap: [
			{ type: MemoryTypes.PRIVATE, address: Memory.DEFAULT_VALUE, default: 0 },

			{
				type: MemoryTypes.INPUT_POINTER,
				address: offset.byte(Memory.INPUT_POINTER),
				id: 'in',
				default: offset.byte(Memory.DEFAULT_VALUE),
			},

			{ type: MemoryTypes.OUTPUT, address: offset.byte(Memory.OUTPUT), id: 'out', default: 0 },
		],
	};
};

export default invert;
