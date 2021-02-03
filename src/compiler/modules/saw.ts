import { i32const, i32load, i32store, ifelse } from '../utils/instructions';
import { createFunctionBody } from '../utils/sections';
import { Instruction, Type } from '../enums';
import { ModuleGenerator } from './types';

const enum Memory {
	COUNTER = 0x00,
	RATE = 0x04,
	LIMIT = 0x08,
}

/**
 *
 * @param memoryStartAddress
 */
const saw: ModuleGenerator = function (memoryStartAddress) {
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
		memoryStartAddress,
		initialMemory: [0, 1, 10],
		outputs: [{ address: Memory.COUNTER + offset, label: 'output' }],
		inputs: [{ address: Memory.RATE + offset, label: 'rate' }],
	};
};

export default saw;
