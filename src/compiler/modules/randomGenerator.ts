import { i32storeLocal, i32loadLocal, localGet, localSet } from '../wasm/instructions';
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
			...i32loadLocal(Locals.MULTIPLIER, Memory.MULTIPLIER + offset),
			...i32loadLocal(Locals.INCREMENT, Memory.INCREMENT + offset),
			...i32loadLocal(Locals.PREVIOUS, Memory.PREVIOUS + offset),

			...localGet(Locals.PREVIOUS),
			...localGet(Locals.MULTIPLIER),
			Instruction.I32_MUL,
			...localGet(Locals.INCREMENT),
			Instruction.I32_ADD,
			...localSet(Locals.PREVIOUS),

			...i32storeLocal(Locals.PREVIOUS, Memory.PREVIOUS + offset),
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
