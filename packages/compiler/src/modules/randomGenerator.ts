import { localGet, localSet, i32const, i32load, i32store } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

const enum Memory {
	MULTIPLIER,
	INCREMENT,
	PREVIOUS,
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
			...i32const(offset(Memory.MULTIPLIER)),
			...i32load(),
			...localSet(Locals.MULTIPLIER),

			...i32const(offset(Memory.INCREMENT)),
			...i32load(),
			...localSet(Locals.PREVIOUS),

			...localGet(Locals.PREVIOUS),
			...localGet(Locals.MULTIPLIER),
			Instruction.I32_MUL,
			...localGet(Locals.INCREMENT),
			Instruction.I32_ADD,
			...localSet(Locals.PREVIOUS),

			...i32const(offset(Memory.PREVIOUS)),
			...localGet(Locals.PREVIOUS),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [Date.now(), 11, 9],
		memoryAddresses: [{ address: offset(Memory.PREVIOUS), id: 'out' }],
	};
};

export default random;
