import { call, i32const, i32load, i32store, ifelse } from '../utils/instructions';
import { createFunctionBody } from '../utils/sections';
import { Instruction, Type } from '../enums';

const enum Memory {
	COUNTER = 0x00,
	RATE = 0x04,
}

const INITIAL_MEMORY = new Uint32Array([0, 1]);

/**
 *
 * @param memoryStartAddress
 */
const saw = function (
	memoryStartAddress: number,
	moduloFunctionIndex: number
): {
	functionBody: number[];
	memoryFootprint: number;
	memoryStartAddress: number;
	initialMemory: Uint32Array;
	outputs: number[];
	inputs: number[];
} {
	const offset = memoryStartAddress;

	const functionBody = createFunctionBody(
		[],
		[
			...i32const(Memory.COUNTER + offset), // Address for storing
			...i32load(Memory.COUNTER + offset),
			...i32const(10), // Max value
			Instruction.I32_EQ,
			...ifelse(Type.I32, [...i32const(0)], [...i32const(1), ...i32load(Memory.COUNTER + offset), Instruction.I32_ADD]),
			...i32store(),
		]
	);

	return {
		functionBody,
		memoryFootprint: INITIAL_MEMORY.length,
		memoryStartAddress,
		initialMemory: INITIAL_MEMORY,
		outputs: [Memory.COUNTER],
		inputs: [Memory.RATE],
	};
};

export default saw;
