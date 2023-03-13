import { InstructionHandler } from '../types';

const global: InstructionHandler = function (line, namespace, stack) {
	return {
		byteCode: [],
		namespace,
		stack,
	};
};

export default global;
