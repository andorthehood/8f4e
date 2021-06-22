import { createFunctionBody } from 'bytecode-utils';
import { ModuleGenerator } from '../types';

export enum Memory {
	OUTPUT,
}

const constant: ModuleGenerator = function (moduleId, offset, initialConfig: { out?: number } = {}) {
	const functionBody = createFunctionBody([], []);

	return {
		moduleId,
		functionBody,
		offset: offset(0),
		initialMemory: [initialConfig.out || 0],
		memoryAddresses: [{ address: offset(Memory.OUTPUT), id: 'out' }],
	};
};

export default constant;
