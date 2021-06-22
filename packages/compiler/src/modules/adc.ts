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
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER, LOGIC_HIGH, LOGIC_LOW } from '../consts';

export enum Memory {
	DEFAULT_VALUE,
	INPUT_POINTER,
	OUTPUT_1,
	OUTPUT_2,
	OUTPUT_3,
	OUTPUT_4,
	OUTPUT_5,
	OUTPUT_6,
	OUTPUT_7,
	OUTPUT_8,
	OUTPUT_9,
	OUTPUT_10,
	OUTPUT_11,
	OUTPUT_12,
	OUTPUT_13,
	OUTPUT_14,
	OUTPUT_15,
	OUTPUT_16,
}

const masks = [
	[Memory.OUTPUT_1, 0b0000000000000001],
	[Memory.OUTPUT_2, 0b0000000000000010],
	[Memory.OUTPUT_3, 0b0000000000000100],
	[Memory.OUTPUT_4, 0b0000000000001000],
	[Memory.OUTPUT_5, 0b0000000000010000],
	[Memory.OUTPUT_6, 0b0000000000100000],
	[Memory.OUTPUT_7, 0b0000000001000000],
	[Memory.OUTPUT_8, 0b0000000010000000],
	[Memory.OUTPUT_9, 0b0000000100000000],
	[Memory.OUTPUT_10, 0b0000001000000000],
	[Memory.OUTPUT_11, 0b0000010000000000],
	[Memory.OUTPUT_12, 0b0000100000000000],
	[Memory.OUTPUT_13, 0b0001000000000000],
	[Memory.OUTPUT_14, 0b0010000000000000],
	[Memory.OUTPUT_15, 0b0100000000000000],
	[Memory.OUTPUT_16, 0b1000000000000000],
];

enum Locals {
	INPUT,
	__LENGTH,
}

const adc: ModuleGenerator = function (moduleId, offset, { resolution = 8 }: { resolution?: number } = {}) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...i32const(resolution === 16 ? 1 : Math.floor(I16_SIGNED_LARGEST_NUMBER / (Math.pow(2, resolution) - 1))),
			Instruction.I32_DIV_S,
			...localSet(Locals.INPUT),

			...masks
				.slice(0, resolution)
				.map(([memoryAddress, mask]) => [
					...i32const(offset(memoryAddress)),
					...localGet(Locals.INPUT),
					...i32const(mask),
					Instruction.I32_AND,
					...i32const(0),
					Instruction.I32_GT_S,
					...ifelse(Type.I32, i32const(LOGIC_HIGH), i32const(LOGIC_LOW)),
					...i32store(),
				])
				.flat(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, offset(Memory.DEFAULT_VALUE), offset(Memory.DEFAULT_VALUE), ...masks.map(() => 0)],
		memoryAddresses: [
			...masks
				.slice(0, resolution)
				.map(([memoryAddress], index) => ({ address: offset(memoryAddress), id: 'out:' + (index + 1) })),
			{
				address: offset(Memory.INPUT_POINTER),
				id: 'in',
				default: offset(Memory.DEFAULT_VALUE),
			},
		],
	};
};

export default adc;
