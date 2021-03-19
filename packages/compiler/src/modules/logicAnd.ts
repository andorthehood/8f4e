import { i32load, i32const, i32store, ifelse, br } from '../wasm/instructions';
import { createFunctionBody } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

export const enum Memory {
	DEFAULT_VALUE,
	INPUT_1_POINTER,
	INPUT_2_POINTER,
	OUTPUT,
}

const and: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(offset(Memory.INPUT_1_POINTER)),
			...i32load(),
			...i32load(),
			...i32const(0),
			Instruction.I32_GT_S,
			...ifelse(Type.VOID, [
				...i32const(offset(Memory.INPUT_2_POINTER)),
				...i32load(),
				...i32load(),
				...i32const(0),
				Instruction.I32_GT_S,
				...ifelse(Type.VOID, [
					...i32const(offset(Memory.OUTPUT)),
					...i32const(I16_SIGNED_LARGEST_NUMBER),
					...i32store(),
					...br(2),
				]),
			]),

			...i32const(offset(Memory.OUTPUT)),
			...i32const(0),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, offset(Memory.DEFAULT_VALUE), offset(Memory.DEFAULT_VALUE), 0],
		memoryAddresses: [
			{ address: offset(Memory.OUTPUT), id: 'out' },
			{
				address: offset(Memory.INPUT_1_POINTER),
				id: 'in:1',
				default: offset(Memory.DEFAULT_VALUE),
			},
			{
				address: offset(Memory.INPUT_2_POINTER),
				id: 'in:2',
				default: offset(Memory.DEFAULT_VALUE),
			},
		],
	};
};

export default and;
