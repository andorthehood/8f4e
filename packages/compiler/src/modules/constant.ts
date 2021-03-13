import { createFunctionBody } from '../wasm/sections';
import { ModuleGenerator } from '../types';

export const enum Memory {
	OUTPUT,
}

const constant: ModuleGenerator = function (moduleId, offset, initialConfig, bytes = 4) {
	const functionBody = createFunctionBody([], []);

	return {
		moduleId,
		functionBody,
		offset,
		initialMemory: [initialConfig.out || 0],
		memoryAddresses: [{ address: Memory.OUTPUT * bytes + offset, id: 'out' }],
	};
};

export default constant;
