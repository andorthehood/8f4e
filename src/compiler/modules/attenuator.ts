import { i32const, i32load, i32store, ifelse } from '../wasm/instructions';
import { createFunctionBody } from '../wasm/sections';
import { Instruction } from '../wasm/enums';
import { ModuleGenerator } from './types';

const enum Memory {
	MULTIPLIER = 0x00,
	INCREMENT = 0x04,
	PREVIOUS = 0x08,
}

/**
 *
 * @param memoryStartAddress
 */
const saw: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(Memory.PREVIOUS + offset), // Address for storing
			...[
				...i32load(Memory.PREVIOUS + offset),
				...i32load(Memory.MULTIPLIER + offset),
				Instruction.I32_MUL,
				...i32load(Memory.INCREMENT + offset),
				Instruction.I32_ADD,
			],
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [25214903917, 11, 9],
		outputs: [{ address: Memory.PREVIOUS + offset, id: 'output' }],
		inputs: [],
	};
};

export default saw;
