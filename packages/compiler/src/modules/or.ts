import { i32load, i32const, i32store, ifelse, br } from '../wasm/instructions';
import { createFunctionBody } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

export const enum Memory {
	ZERO,
	INPUT_1_POINTER,
	INPUT_2_POINTER,
	OUTPUT,
}

const or: ModuleGenerator = function (moduleId, offset, initialConfig, bytes = 4) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(Memory.INPUT_1_POINTER * bytes + offset),
			...i32load(),
			...i32load(),
			...i32const(0),
			Instruction.I32_GT_S,
			...ifelse(Type.VOID, [
				...i32const(Memory.OUTPUT * bytes + offset),
				...i32const(I16_SIGNED_LARGEST_NUMBER),
				...i32store(),
				...br(1),
			]),

			...i32const(Memory.INPUT_2_POINTER * bytes + offset),
			...i32load(),
			...i32load(),
			...i32const(0),
			Instruction.I32_GT_S,
			...ifelse(Type.VOID, [
				...i32const(Memory.OUTPUT * bytes + offset),
				...i32const(I16_SIGNED_LARGEST_NUMBER),
				...i32store(),
				...br(1),
			]),

			...i32const(Memory.OUTPUT * bytes + offset),
			...i32const(0),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [0, Memory.ZERO * bytes + offset, Memory.ZERO * bytes + offset, 0],
		memoryAddresses: [
			{ address: Memory.OUTPUT * bytes + offset, id: 'out' },
			{
				address: Memory.INPUT_1_POINTER * bytes + offset,
				id: 'in1',
				default: Memory.ZERO * bytes + offset,
				isInputPointer: true,
			},
			{
				address: Memory.INPUT_2_POINTER * bytes + offset,
				id: 'in2',
				default: Memory.ZERO * bytes + offset,
				isInputPointer: true,
			},
		],
	};
};

export default or;
