import { call, i32const, i32load, i32store, ifelse } from '../utils/instructions';
import { createFunctionBody } from '../utils/sections';
import { Instruction, Type } from '../enums';

const enum Memory {
	COUNTER = 0x00,
	RATE = 0x04,
	LIMIT = 0x08,
}

const INITIAL_MEMORY = new Uint32Array([0, 1, 10]);

/**
 *
 * @param memoryStartAddress
 */
const saw = function (
	memoryStartAddress: number
): {
	functionBody: number[];
	memoryFootprint: number;
	memoryStartAddress: number;
	initialMemory: Uint32Array;
	outputs: { address: number; label: string }[];
	inputs: { address: number; label: string }[];
} {
	const offset = memoryStartAddress * 4;

	const functionBody = createFunctionBody(
		[],
		[
			...i32const(Memory.COUNTER + offset), // Address for storing
			...[
				...i32load(Memory.COUNTER + offset),
				...i32load(Memory.LIMIT + offset),
				Instruction.I32_GE_S,
				...ifelse(
					Type.I32,
					[...i32const(0), ...i32load(Memory.LIMIT + offset), Instruction.I32_SUB],
					[...i32load(Memory.RATE + offset), ...i32load(Memory.COUNTER + offset), Instruction.I32_ADD]
				),
			],
			...i32store(),
		]
	);

	return {
		functionBody,
		memoryFootprint: INITIAL_MEMORY.length,
		memoryStartAddress,
		initialMemory: INITIAL_MEMORY,
		outputs: [{ address: Memory.COUNTER + offset, label: 'output' }],
		inputs: [{ address: Memory.RATE + offset, label: 'rate' }],
	};
};

export default saw;
