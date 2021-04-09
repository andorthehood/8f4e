import {
	Type,
	createFunctionBody,
	createLocalDeclaration,
	i32const,
	i32load,
	i32store,
	localGet,
	localSet,
} from '../../../byteCodeUtils/src';
import { ModuleGenerator } from '../types';

const enum Memory {
	ZERO,
	INPUT_POINTER,
	OUTPUT_1,
	OUTPUT_2,
	OUTPUT_3,
	OUTPUT_4,
}

const enum Locals {
	INPUT,
	__LENGTH,
}

/**
 *
 * @param memoryStartAddress
 */
const splitter: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			...i32const(offset(Memory.INPUT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.INPUT),

			...i32const(offset(Memory.OUTPUT_1)),
			...localGet(Locals.INPUT),
			...i32store(),

			...i32const(offset(Memory.OUTPUT_2)),
			...localGet(Locals.INPUT),
			...i32store(),

			...i32const(offset(Memory.OUTPUT_3)),
			...localGet(Locals.INPUT),
			...i32store(),

			...i32const(offset(Memory.OUTPUT_4)),
			...localGet(Locals.INPUT),
			...i32store(),
		]
	);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [0, offset(Memory.ZERO), 0, 0, 0, 0],
		memoryAddresses: [
			{ address: offset(Memory.OUTPUT_1), id: 'out:1' },
			{ address: offset(Memory.OUTPUT_2), id: 'out:2' },
			{ address: offset(Memory.OUTPUT_3), id: 'out:3' },
			{ address: offset(Memory.OUTPUT_4), id: 'out:4' },
			{ address: offset(Memory.INPUT_POINTER), id: 'in' },
		],
	};
};

export default splitter;
