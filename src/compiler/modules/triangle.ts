import { createFunctionBody, createLocalDeclaration } from '../wasm/sections';
import { Type } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

const enum Memory {
	COUNTER = 0x00,
	RATE_POINTER = 0x04,
	RATE_SELF = 0x08,
	LIMIT_POINTER = 0xc,
	LIMIT_SELF = 0x10,
}

const enum Locals {
	COUNTER,
	RATE,
	LIMIT,
	NEGATIVE_LIMIT,
	__LENGTH,
}

const triangle: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody([createLocalDeclaration(Type.I32, Locals.__LENGTH)], []);

	const initialMemory = [0, offset + Memory.RATE_SELF, 1000, offset + Memory.LIMIT_SELF, 32767];

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory,
		memoryAddresses: [
			{ address: Memory.COUNTER + offset, id: 'out' },
			{ address: Memory.RATE_POINTER + offset, id: 'rate', isInputPointer: true },
		],
	};
};

export default triangle;
