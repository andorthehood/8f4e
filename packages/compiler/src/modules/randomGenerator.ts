import { localGet, localSet, i32const, i32load, i32store } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

const enum Memory {
	MULTIPLIER = 0x00,
	INCREMENT = 0x04,
	PREVIOUS = 0x08,
}

const enum Locals {
	MULTIPLIER,
	INCREMENT,
	PREVIOUS,
	__LENGTH,
}

const random: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(Memory.MULTIPLIER + offset),
			...i32load(),
			...localSet(Locals.MULTIPLIER),

			...i32const(Memory.INCREMENT + offset),
			...i32load(),
			...localSet(Locals.PREVIOUS),

			...localGet(Locals.PREVIOUS),
			...localGet(Locals.MULTIPLIER),
			Instruction.I32_MUL,
			...localGet(Locals.INCREMENT),
			Instruction.I32_ADD,
			...localSet(Locals.PREVIOUS),

			...i32const(Memory.PREVIOUS + offset),
			...localGet(Locals.PREVIOUS),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [Date.now(), 11, 9],
		memoryAddresses: [{ address: Memory.PREVIOUS + offset, id: 'out' }],
	};
};

export default random;
