import { i32storeLocal, i32load, i32loadLocal, localGet, localSet, i32const } from '../wasm/instructions';
import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Instruction, Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

const enum Memory {
	ZERO = 0x00,
	INPUT_POINTER = 0x04,
	OFFSET = 0x08,
	OUTPUT = 12,
}

const enum Locals {
	INPUT,
	__LENGTH,
}

const offset: ModuleGenerator = function (moduleId, offset, initialConfig) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32load(Memory.INPUT_POINTER + offset),
			...i32loadLocal(Locals.INPUT),

			...localGet(Locals.INPUT),
			...i32const(Memory.OFFSET + offset),
			...i32load(),
			Instruction.I32_ADD,
			...localSet(Locals.INPUT),

			...i32storeLocal(Locals.INPUT, Memory.OUTPUT + offset),
		]
	);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [0, Memory.ZERO + offset, initialConfig.offset, 0],
		memoryAddresses: [
			{ address: Memory.OUTPUT + offset, id: 'out' },
			{ address: Memory.OFFSET + offset, id: 'offset', default: initialConfig.offset },
			{ address: Memory.INPUT_POINTER + offset, id: 'in', isInputPointer: true, default: Memory.ZERO + offset },
		],
	};
};

export default offset;
