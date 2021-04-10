import {
	Instruction,
	Type,
	createFunctionBody,
	createLocalDeclaration,
	i32const,
	i32load,
	i32store,
	ifelse,
	localGet,
	localSet,
} from '../../../byteCodeUtils/src';
import { ModuleGenerator } from '../types';
import { I16_SIGNED_LARGEST_NUMBER } from '../consts';

enum Memory {
	COUNTER,
	RATE_POINTER,
	RATE_SELF,
	LIMIT_POINTER,
	LIMIT_SELF,
}

enum Locals {
	COUNTER,
	LIMIT,
	RATE,
	__LENGTH,
}

const saw: ModuleGenerator = function (moduleId, offset, initialConfig) {
	const functionBody = createFunctionBody(
		[createLocalDeclaration(Type.I32, Locals.__LENGTH)],
		[
			// Load data from memory into local variables.
			...i32const(offset(Memory.RATE_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.RATE),

			...i32const(offset(Memory.LIMIT_POINTER)),
			...i32load(),
			...i32load(),
			...localSet(Locals.LIMIT),

			...i32const(offset(Memory.COUNTER)),
			...i32load(),
			...localSet(Locals.COUNTER),

			...localGet(Locals.COUNTER),
			...localGet(Locals.LIMIT),
			Instruction.I32_GE_S,
			...ifelse(
				Type.I32,
				[...i32const(0), ...localGet(Locals.LIMIT), Instruction.I32_SUB],
				[...localGet(Locals.RATE), ...localGet(Locals.COUNTER), Instruction.I32_ADD]
			),
			...localSet(Locals.COUNTER),

			// Save data to memory.
			...i32const(offset(Memory.COUNTER)),
			...localGet(Locals.COUNTER),
			...i32store(),
		]
	);

	const initialMemory = [
		0,
		offset(Memory.RATE_SELF),
		initialConfig.rate,
		offset(Memory.LIMIT_SELF),
		I16_SIGNED_LARGEST_NUMBER,
	];

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory,
		memoryAddresses: [
			{ address: offset(Memory.COUNTER), id: 'out' },
			{ address: offset(Memory.RATE_POINTER), id: 'in:rate', default: offset(Memory.RATE_SELF) },
			{ address: offset(Memory.RATE_SELF), id: 'rate', default: initialConfig.rate },
		],
	};
};

export default saw;
