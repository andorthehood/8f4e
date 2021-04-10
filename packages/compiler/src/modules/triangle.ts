import { Type, createFunctionBody, createLocalDeclaration } from 'bytecode-utils';
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
	NEGATIVE_LIMIT,
	RATE,
	__LENGTH,
}

const triangle: ModuleGenerator = function (moduleId, offset) {
	const functionBody = createFunctionBody([createLocalDeclaration(Type.I32, Locals.__LENGTH)], []);

	const initialMemory = [0, offset(Memory.RATE_SELF), 1000, offset(Memory.LIMIT_SELF), I16_SIGNED_LARGEST_NUMBER];

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory,
		memoryAddresses: [
			{ address: offset(Memory.COUNTER), id: 'out' },
			{ address: offset(Memory.RATE_POINTER), id: 'in' },
		],
	};
};

export default triangle;
