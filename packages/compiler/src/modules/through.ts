import { i32load, i32const, i32store, createFunctionBody } from 'bytecode-utils';
import { ModuleGenerator } from '../types';

enum Memory {
	ZERO,
	INPUT_POINTER,
	OUTPUT,
}

const through: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[],
		[
			...i32const(offset(Memory.OUTPUT)),
			...i32const(offset(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, offset(Memory.ZERO), 0],
		memoryAddresses: [
			{ address: offset(Memory.OUTPUT), id: 'out' },
			{ address: offset(Memory.INPUT_POINTER), id: 'in' },
		],
	};
};

export default through;
