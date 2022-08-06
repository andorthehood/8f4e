import { Instruction, Type, br, createFunctionBody, i32const, i32load, i32store, ifelse } from 'bytecode-utils';
import { MemoryTypes, ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

export enum Memory {
	DEFAULT_VALUE,
	INPUT_1_POINTER,
	INPUT_2_POINTER,
	OUTPUT,
}

const and: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(offset.byte(Memory.INPUT_1_POINTER)),
			...i32load(),
			...i32load(),
			...i32const(0),
			Instruction.I32_GT_S,
			...ifelse(Type.VOID, [
				...i32const(offset.byte(Memory.INPUT_2_POINTER)),
				...i32load(),
				...i32load(),
				...i32const(0),
				Instruction.I32_GT_S,
				...ifelse(Type.VOID, [
					...i32const(offset.byte(Memory.OUTPUT)),
					...i32const(I16_SIGNED_LARGEST_NUMBER),
					...i32store(),
					...br(2),
				]),
			]),

			...i32const(offset.byte(Memory.OUTPUT)),
			...i32const(0),
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
				address: offset.byte(Memory.INPUT_1_POINTER),
				id: 'in:1',
				default: offset.byte(Memory.DEFAULT_VALUE),
			},
			{
				type: MemoryTypes.INPUT_POINTER,
				address: offset.byte(Memory.INPUT_2_POINTER),
				id: 'in:2',
				default: offset.byte(Memory.DEFAULT_VALUE),
			},

			{ type: MemoryTypes.OUTPUT, address: offset.byte(Memory.OUTPUT), id: 'out', default: 0 },
		],
	};
};

export default and;
