import { i32const, i32load, i32loadAddress, i32store, ifelse } from '../utils/instructions';
import { createFunctionBody } from '../utils/sections';
import { Instruction, Type } from '../enums';
import { ModuleGenerator } from './types';

const enum Memory {
	COUNTER = 0x00,
	RATE_ADDRESS = 0x04,
	RATE_SELF = 0x08,
	LIMIT_ADDRESS = 12,
	LIMIT_SELF = 16,
}

type InitialMemory = [
	COUNTER: number,
	RATE_ADDRESS: number,
	RATE_SELF: number,
	LIMIT_ADDRESS: number,
	LIMIT_SELF: number
];

/**
 *
 * @param memoryStartAddress
 */
const saw: ModuleGenerator = function (moduleId, memoryStartAddress) {
	const offset = memoryStartAddress * 4;

	const functionBody = createFunctionBody(
		[],
		[
			...i32const(Memory.COUNTER + offset), // Address for storing
			...[
				...i32load(Memory.COUNTER + offset),
				...i32loadAddress(Memory.LIMIT_ADDRESS + offset),
				Instruction.I32_GE_S,
				...ifelse(
					Type.I32,
					[...i32const(0), ...i32loadAddress(Memory.LIMIT_ADDRESS + offset), Instruction.I32_SUB],
					[...i32loadAddress(Memory.RATE_ADDRESS + offset), ...i32load(Memory.COUNTER + offset), Instruction.I32_ADD]
				),
			],
			...i32store(),
		]
	);

	const initialMemory: InitialMemory = [0, offset + Memory.RATE_SELF, 1, offset + Memory.LIMIT_SELF, 10];

	return {
		moduleId,
		functionBody,
		memoryStartAddress,
		initialMemory,
		outputs: [{ address: Memory.COUNTER + offset, id: 'output' }],
		inputs: [{ address: Memory.RATE_ADDRESS + offset, id: 'rate' }],
	};
};

export default saw;
