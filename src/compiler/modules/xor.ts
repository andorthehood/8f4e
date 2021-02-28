import { i32load, i32const, i32store } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

const enum Memory {
	ZERO = 0x00,
	INPUT_1_POINTER = 0x04,
	INPUT_2_POINTER = 0x08,
	OUTPUT = 0x0c,
}

const enum Locals {
	INPUT,
	__LENGTH,
}

const xor: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(Memory.OUTPUT + offset),
			...i32const(Memory.INPUT_1_POINTER + offset),
			...i32load(),
			...i32load(),
			...i32const(Memory.INPUT_2_POINTER + offset),
			...i32load(),
			...i32load(),
			Instruction.I32_XOR,
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [0, Memory.ZERO + offset, Memory.ZERO + offset, 0],
		memoryAddresses: [
			{ address: Memory.OUTPUT + offset, id: 'out' },
			{ address: Memory.INPUT_1_POINTER + offset, id: 'in1', default: Memory.ZERO + offset, isInputPointer: true },
			{ address: Memory.INPUT_2_POINTER + offset, id: 'in2', default: Memory.ZERO + offset, isInputPointer: true },
		],
	};
};

export default xor;
