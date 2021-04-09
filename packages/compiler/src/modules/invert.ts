import { Instruction, i32load, i32const, i32store, createFunctionBody } from '../../../byteCodeUtils/src';
import { ModuleGenerator } from '../types';

export const enum Memory {
	DEFAULT_VALUE,
	INPUT_POINTER,
	OUTPUT,
}

const invert: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(offset(Memory.OUTPUT)),
			...i32const(offset(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...i32const(-1),
			Instruction.I32_MUL, // TODO: replace MUL with bitwise operation
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, offset(Memory.DEFAULT_VALUE), offset(Memory.DEFAULT_VALUE), 0],
		memoryAddresses: [
			{ address: offset(Memory.OUTPUT), id: 'out' },
			{
				address: offset(Memory.INPUT_POINTER),
				id: 'in',
				default: offset(Memory.DEFAULT_VALUE),
			},
		],
	};
};

export default invert;
