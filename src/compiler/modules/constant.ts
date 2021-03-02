import { createFunctionBody } from '../wasm/sections';
import { ModuleGenerator } from '../types';

const enum Memory {
	OUTPUT = 0x00,
}

const constant: ModuleGenerator = function (moduleId, offset, initialConfig) {
	const functionBody = createFunctionBody([], []);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [initialConfig.out || 0],
		memoryAddresses: [{ address: Memory.OUTPUT + offset, id: 'out' }],
	};
};

export default constant;
