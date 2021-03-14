import { i32const, i32load, i32store } from '../wasm/instructions';
import { createFunctionBody } from '../wasm/sections';
import { Instruction } from 'wasm-bytecode-utils';
import { ModuleGenerator } from '../types';

const enum Memory {
	ZERO,
	INPUT_POINTER,
	DIVISOR,
	OUT,
}

const attenuator: ModuleGenerator = function (moduleId, offset, initialConfig) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(offset(Memory.OUT)),
			...i32const(offset(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...i32const(offset(Memory.DIVISOR)),
			...i32load(),
			Instruction.I32_DIV_S,
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, offset(Memory.ZERO), initialConfig.divisor, 0],
		memoryAddresses: [
			{ address: offset(Memory.OUT), id: 'out' },
			{ address: offset(Memory.DIVISOR), id: 'divisor' },
			{ address: offset(Memory.INPUT_POINTER), id: 'in', isInputPointer: true },
		],
	};
};

export default attenuator;
